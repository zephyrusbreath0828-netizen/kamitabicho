"use client";

/**
 * アプリ全体の状態管理（v1.2）
 *
 * v1.1 の API はすべて維持したまま、以下を追加:
 *  - 神徳ポイント / ランク（導出値）
 *  - 御利益コレクション / 祭神図鑑（参拝履歴から導出）
 *  - 端末データ（地域ダウンロード）とオフライン状態
 *  - オフライン参拝の未同期キューと同期
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getBackend, resolveInitialMode } from "@/lib/backend";
import { computeAchievements, computeStats, newlyUnlocked, type AchievementProgress, type AchievementStats } from "@/lib/achievements";
import { collectBenefits, collectDeities, toCollectedMap, type CollectionSummary } from "@/lib/collections";
import { isSilentError, toUserMessage } from "@/lib/errors";
import { isFirebaseConfigured } from "@/lib/firebase";
import { isLocallyMigrated, readLegacyLocalData, storeMode } from "@/lib/legacy";
import { computePoints, type PointsResult } from "@/lib/points";
import { flushPendingVisits, pendingToVisit, type SyncOutcome } from "@/lib/sync";
import {
  allLocalShrines,
  isLocalDbAvailable,
  listDownloads,
  listPendingVisits,
  localShrineCount,
  getLastSyncAt,
  queueVisit,
  removeRegion as removeRegionDb,
  saveRegion,
  touchLastSync,
} from "@/lib/local-db";
import { searchInArray } from "@/lib/search";
import { nearestPrefecture } from "@/lib/regions";
import type {
  Backend,
  BackendMode,
  Benefit,
  Deity,
  DownloadedRegion,
  Goshuin,
  MigrationResult,
  NewGoshuinInput,
  PendingVisit,
  Region,
  RegionId,
  SessionUser,
  ShrineSearchParams,
  ShrineSearchResult,
  ShrineV2,
  UserProfile,
  Visit,
} from "@/lib/types";
import { SHRINES_V2, BENEFITS, DEITIES, REGIONS } from "@/data/masters";

function rethrow(e: unknown): never {
  throw new Error(toUserMessage(e));
}

type AppContextValue = {
  backend: Backend;
  mode: BackendMode;
  ready: boolean;
  user: SessionUser | null;
  profile: UserProfile | null;
  shrines: ShrineV2[];
  visits: Visit[];
  goshuin: Goshuin[];
  favorites: string[];
  stats: AchievementStats;
  achievements: AchievementProgress[];
  unlockedAchievements: number;
  /** 神徳ポイント（導出値 + 保存スナップショット） */
  points: PointsResult;
  benefitsCollection: CollectionSummary<Benefit & { obtainedAt: string; shrineNames: string[] }>;
  deitiesCollection: CollectionSummary<Deity & { obtainedAt: string; shrineNames: string[] }>;
  deities: Deity[];
  benefits: Benefit[];
  regions: Region[];
  shrineSource: "firestore" | "bundled";
  error: string | null;
  clearError: () => void;
  migration: MigrationResult | null;
  dismissMigration: () => void;
  /* v1.2 */
  online: boolean;
  downloads: DownloadedRegion[];
  pendingVisits: PendingVisit[];
  lastSyncAt: string | null;
  localShrineTotal: number;
  syncing: boolean;
  syncNow: () => Promise<SyncOutcome>;
  downloadRegion: (regionId: RegionId) => Promise<number>;
  removeRegionData: (regionId: RegionId) => Promise<void>;
  suggestRegionForPosition: (pos: { latitude: number; longitude: number }) => RegionId | null;
  searchShrines: (params: ShrineSearchParams) => Promise<ShrineSearchResult>;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: { nickname?: string; photo_url?: string | null }) => Promise<void>;
  uploadImage: (kind: "goshuin" | "avatar", file: File) => Promise<string>;
  checkIn: (shrine: ShrineV2, position: { latitude: number; longitude: number; distance_m: number }) => Promise<Visit>;
  removeVisit: (visitId: string) => Promise<void>;
  registerGoshuin: (input: Omit<NewGoshuinInput, "user_id">) => Promise<Goshuin>;
  removeGoshuin: (id: string) => Promise<void>;
  toggleFavorite: (shrineId: string) => Promise<void>;
  isFavorite: (shrineId: string) => boolean;
  shrineById: (id: string) => ShrineV2 | undefined;
  visitCountOf: (shrineId: string) => number;
  visitedShrineIds: string[];
  recentVisits: Visit[];
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<BackendMode>(() => resolveInitialMode());
  const [backend, setBackend] = useState<Backend>(() => getBackend(resolveInitialMode()));
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shrines, setShrines] = useState<ShrineV2[]>(SHRINES_V2);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [goshuin, setGoshuin] = useState<Goshuin[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [shrineSource, setShrineSource] = useState<"firestore" | "bundled">("bundled");
  const [error, setError] = useState<string | null>(null);
  const [migration, setMigration] = useState<MigrationResult | null>(null);
  const [deities, setDeities] = useState<Deity[]>(DEITIES);
  const [benefits, setBenefits] = useState<Benefit[]>(BENEFITS);
  const [regions, setRegions] = useState<Region[]>(REGIONS);

  // v1.2
  const [online, setOnline] = useState(true);
  const [downloads, setDownloads] = useState<DownloadedRegion[]>([]);
  const [pendingVisits, setPendingVisits] = useState<PendingVisit[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [localShrineTotal, setLocalShrineTotal] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const savedAchievementsKey = useRef<string>("");
  const savedPointsKey = useRef<string>("");

  /* ---------------- 端末データの読み込み ---------------- */
  const refreshLocal = useCallback(async () => {
    if (!(await isLocalDbAvailable())) return;
    const [dl, pending, last, count] = await Promise.all([
      listDownloads(),
      listPendingVisits(),
      getLastSyncAt(),
      localShrineCount(),
    ]);
    setDownloads(dl);
    setPendingVisits(pending);
    setLastSyncAt(last);
    setLocalShrineTotal(count);
  }, []);

  /* ---------------- オンライン状態 ---------------- */
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    void refreshLocal();
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [refreshLocal]);

  /* ---------------- マスタ ---------------- */
  useEffect(() => {
    let alive = true;
    backend
      .listShrines()
      .then((list) => {
        if (!alive) return;
        setShrines(list as ShrineV2[]);
        setShrineSource(backend.shrineSource ?? "bundled");
      })
      .catch((e) => alive && setError(toUserMessage(e)));
    backend.listDeities().then((d) => alive && setDeities(d)).catch(() => undefined);
    backend.listBenefits().then((b) => alive && setBenefits(b)).catch(() => undefined);
    backend.listRegions().then((r) => alive && setRegions(r)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [backend]);

  /* ---------------- アカウントデータ ---------------- */
  const hydrate = useCallback(async (target: Backend, uid: string) => {
    const loadAll = async () => {
      const [p, v, g, f] = await Promise.all([
        target.getUserProfile(uid),
        target.listVisits(uid),
        target.listGoshuin(uid),
        target.listFavorites(uid),
      ]);
      setProfile(p);
      setVisits(v);
      setGoshuin(g);
      setFavorites(f);
      return { p, v, g };
    };

    let loaded = await loadAll();

    if (target.mode === "firebase" && !isLocallyMigrated(uid)) {
      const scan = readLegacyLocalData();
      if (scan.found) {
        try {
          const result = await target.migrateLocalData(uid, scan.payload);
          if (result.performed) {
            loaded = await loadAll();
            setMigration(result);
          }
        } catch (e) {
          console.warn("[神旅帳] localStorage データの移行に失敗しました", e);
        }
      }
    }

    if (target.mode === "firebase" && target.migrateLegacyVisitHistory) {
      try {
        const copied = await target.migrateLegacyVisitHistory(uid);
        if (copied > 0) loaded = await loadAll();
      } catch (e) {
        console.warn("[神旅帳] 旧コレクションの移行に失敗しました", e);
      }
    }
    return loaded;
  }, []);

  useEffect(() => {
    let alive = true;
    const unsub = backend.onAuthChange(async (u) => {
      if (!alive) return;
      setUser(u);
      if (!u) {
        setProfile(null);
        setVisits([]);
        setGoshuin([]);
        setFavorites([]);
        setReady(true);
        return;
      }
      try {
        await hydrate(backend, u.uid);
      } catch (e) {
        if (alive) setError(toUserMessage(e));
      } finally {
        if (alive) setReady(true);
      }
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [backend, hydrate]);

  const switchBackend = useCallback((next: BackendMode) => {
    storeMode(next);
    setMode(next);
    setBackend(getBackend(next));
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const target = mode === "demo" && isFirebaseConfigured ? getBackend("firebase") : backend;
      if (target !== backend) switchBackend("firebase");
      const u = await target.signInWithGoogle();
      if (!u.uid) return;
      setUser(u);
      await hydrate(target, u.uid);
    } catch (e) {
      if (!isSilentError(e)) setError(toUserMessage(e, "ログインに失敗しました。"));
    } finally {
      setReady(true);
    }
  }, [backend, hydrate, mode, switchBackend]);

  const signInAsDemo = useCallback(async () => {
    setError(null);
    try {
      const target = getBackend("demo");
      if (target !== backend) switchBackend("demo");
      const u = await target.signInAsDemo();
      setUser(u);
      await hydrate(target, u.uid);
    } catch (e) {
      setError(toUserMessage(e, "デモモードを開始できませんでした。"));
    } finally {
      setReady(true);
    }
  }, [backend, hydrate, switchBackend]);

  const signOut = useCallback(async () => {
    try {
      await backend.signOut();
    } catch (e) {
      setError(toUserMessage(e, "ログアウトに失敗しました。"));
    } finally {
      setUser(null);
      setProfile(null);
      setVisits([]);
      setGoshuin([]);
      setFavorites([]);
      setMigration(null);
      savedAchievementsKey.current = "";
      savedPointsKey.current = "";
      if (isFirebaseConfigured && mode === "demo") {
        storeMode("firebase");
        setMode("firebase");
        setBackend(getBackend("firebase"));
      }
    }
  }, [backend, mode]);

  const updateProfile = useCallback(
    async (patch: { nickname?: string; photo_url?: string | null }) => {
      if (!user) return;
      const base: UserProfile =
        profile ?? {
          uid: user.uid,
          nickname: user.displayName ?? "参拝者",
          photo_url: user.photoURL ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      const next: UserProfile = { ...base, ...patch };
      try {
        await backend.saveUserProfile(next);
      } catch (e) {
        rethrow(e);
      }
      setProfile(next);
      setUser((u) => (u ? { ...u, displayName: next.nickname, photoURL: next.photo_url } : u));
    },
    [backend, profile, user],
  );

  const uploadImage = useCallback(
    async (kind: "goshuin" | "avatar", file: File) => {
      if (!user) throw new Error("ログインが必要です。");
      try {
        return await backend.uploadImage(user.uid, kind, file);
      } catch (e) {
        rethrow(e);
      }
    },
    [backend, user],
  );

  /* ---------------- 参拝記録（オフライン対応） ---------------- */
  const checkIn = useCallback(
    async (shrine: ShrineV2, position: { latitude: number; longitude: number; distance_m: number }) => {
      if (!user) throw new Error("ログインが必要です。");
      const now = new Date().toISOString();

      // オフライン、または Firestore へ届かない場合はローカルに保存
      if (!navigator.onLine) {
        const pending: PendingVisit = {
          id: `visit_off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          user_id: user.uid,
          shrine_id: shrine.id,
          shrine_name: shrine.name,
          shrine_prefecture: shrine.prefecture,
          visit_datetime: now,
          latitude: position.latitude,
          longitude: position.longitude,
          distance_m: Math.round(position.distance_m),
          created_at: now,
          status: "pending",
        };
        await queueVisit(pending);
        await refreshLocal();
        setVisits((prev) => [pendingToVisit(pending), ...prev]);
        setShrines((prev) =>
          prev.map((s) => (s.id === shrine.id ? { ...s, visit_count: s.visit_count + 1 } : s)),
        );
        return pendingToVisit(pending);
      }

      let visit: Visit;
      try {
        visit = await backend.addVisit({
          user_id: user.uid,
          shrine_id: shrine.id,
          latitude: position.latitude,
          longitude: position.longitude,
          distance_m: position.distance_m,
        });
      } catch (e) {
        rethrow(e);
      }
      setVisits((prev) => [visit, ...prev]);
      setShrines((prev) =>
        prev.map((s) => (s.id === shrine.id ? { ...s, visit_count: s.visit_count + 1 } : s)),
      );
      return visit;
    },
    [backend, user, refreshLocal],
  );

  const removeVisit = useCallback(
    async (visitId: string) => {
      if (visitId.startsWith("visit_off_")) {
        // 未同期の記録はローカルからのみ削除
        const { removePending } = await import("@/lib/local-db");
        await removePending(visitId);
        await refreshLocal();
        setVisits((prev) => prev.filter((v) => v.id !== visitId));
        return;
      }
      try {
        await backend.deleteVisit(visitId);
      } catch (e) {
        rethrow(e);
      }
      setVisits((prev) => prev.filter((v) => v.id !== visitId));
    },
    [backend, refreshLocal],
  );

  const registerGoshuin = useCallback(
    async (input: Omit<NewGoshuinInput, "user_id">) => {
      if (!user) throw new Error("ログインが必要です。");
      let created: Goshuin;
      try {
        created = await backend.addGoshuin({ ...input, user_id: user.uid });
      } catch (e) {
        rethrow(e);
      }
      setGoshuin((prev) => [created, ...prev]);
      return created;
    },
    [backend, user],
  );

  const removeGoshuin = useCallback(
    async (id: string) => {
      try {
        await backend.deleteGoshuin(id);
      } catch (e) {
        rethrow(e);
      }
      setGoshuin((prev) => prev.filter((g) => g.id !== id));
    },
    [backend],
  );

  const toggleFavorite = useCallback(
    async (shrineId: string) => {
      if (!user) throw new Error("ログインが必要です。");
      const on = !favorites.includes(shrineId);
      setFavorites((prev) => (on ? [...prev, shrineId] : prev.filter((id) => id !== shrineId)));
      try {
        await backend.setFavorite(user.uid, shrineId, on);
      } catch (e) {
        setFavorites((prev) => (on ? prev.filter((id) => id !== shrineId) : [...prev, shrineId]));
        rethrow(e);
      }
    },
    [backend, favorites, user],
  );

  /* ---------------- v1.2: 同期 ---------------- */
  const syncNow = useCallback(async (): Promise<SyncOutcome> => {
    if (!user) return { attempted: 0, synced: 0, failed: 0, errors: [] };
    setSyncing(true);
    try {
      const outcome = await flushPendingVisits(backend, user.uid);
      if (outcome.synced > 0) {
        // 同期済みの記録を Firestore から読み直す
        const fresh = await backend.listVisits(user.uid);
        setVisits(fresh);
        await touchLastSync();
      }
      await refreshLocal();
      return outcome;
    } catch (e) {
      setError(toUserMessage(e, "同期に失敗しました。"));
      return { attempted: 0, synced: 0, failed: 1, errors: [toUserMessage(e)] };
    } finally {
      setSyncing(false);
    }
  }, [backend, refreshLocal, user]);

  /* 通信復帰時に自動同期 */
  useEffect(() => {
    if (!online || !user || pendingVisits.length === 0 || syncing) return;
    void syncNow();
    // pendingVisits.length の変化でのみ発火させる（syncNow は内部で state を更新する）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, user?.uid, pendingVisits.length]);

  /* ---------------- v1.2: 地域ダウンロード ---------------- */
  const downloadRegion = useCallback(
    async (regionId: RegionId): Promise<number> => {
      const region = regions.find((r) => r.id === regionId);
      // Firestore から該当地方の神社を取得（失敗時は同梱データ）
      const result = await backend.searchShrines({ region: regionId, page: 1, pageSize: 5000 });
      const rows = result.items.length ? result.items : SHRINES_V2.filter((s) => s.region === regionId);
      if (!rows.length) throw new Error("この地域の神社データが見つかりませんでした。");
      const count = await saveRegion(regionId, region?.name ?? regionId, rows, deities, benefits);
      await refreshLocal();
      return count;
    },
    [backend, regions, deities, benefits, refreshLocal],
  );

  const removeRegionData = useCallback(
    async (regionId: RegionId) => {
      await removeRegionDb(regionId);
      await refreshLocal();
    },
    [refreshLocal],
  );

  const suggestRegionForPosition = useCallback(
    (pos: { latitude: number; longitude: number }): RegionId | null => {
      const pref = nearestPrefecture(pos, SHRINES_V2);
      if (!pref) return null;
      return (SHRINES_V2.find((s) => s.prefecture === pref)?.region ?? null) as RegionId | null;
    },
    [],
  );

  /* ---------------- v1.2: 検索 ---------------- */
  const searchShrines = useCallback(
    async (params: ShrineSearchParams): Promise<ShrineSearchResult> => {
      const ctx = {
        deityNames: new Map(deities.map((d) => [d.id, d.name])),
        benefitNames: new Map(benefits.map((b) => [b.id, b.name])),
      };
      // オフライン: 端末保存 → 同梱データの順
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const local = await allLocalShrines();
        const pool = local.length ? local : SHRINES_V2;
        return searchInArray(pool, params, ctx, local.length ? "local" : "bundled");
      }
      // オンライン: Firestore（失敗時は同梱データへフォールバック）
      try {
        return await backend.searchShrines(params);
      } catch {
        return searchInArray(SHRINES_V2, params, ctx, "bundled");
      }
    },
    [backend, deities, benefits],
  );

  /* ---------------- 導出値 ---------------- */
  const shrineMap = useMemo(() => new Map(shrines.map((s) => [s.id, s])), [shrines]);
  const visitCountMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of visits) m.set(v.shrine_id, (m.get(v.shrine_id) ?? 0) + 1);
    return m;
  }, [visits]);

  const stats = useMemo(() => computeStats(shrines, visits, goshuin), [shrines, visits, goshuin]);
  const achievements = useMemo(
    () => computeAchievements(stats, profile?.achievements ?? {}, { visits, shrines }),
    [stats, profile?.achievements, visits, shrines],
  );
  const unlockedAchievements = achievements.filter((a) => a.unlocked).length;
  const points = useMemo(() => computePoints(shrines, visits, goshuin), [shrines, visits, goshuin]);
  const benefitsCollection = useMemo(() => collectBenefits(benefits, shrines, visits), [benefits, shrines, visits]);
  const deitiesCollection = useMemo(() => collectDeities(deities, shrines, visits), [deities, shrines, visits]);

  /* 実績の新規解放を保存 */
  const unlockedIdsKey = achievements.filter((a) => a.unlocked).map((a) => a.id).join(",");
  useEffect(() => {
    if (!user || !profile) return;
    const current = profile.achievements ?? {};
    const merged = newlyUnlocked(achievements, current);
    const nextKey = `${user.uid}:${Object.keys(merged).sort().join(",")}`;
    if (savedAchievementsKey.current === nextKey) return;
    if (Object.keys(merged).length === Object.keys(current).length) return;
    savedAchievementsKey.current = nextKey;
    setProfile((p) => (p ? { ...p, achievements: merged } : p));
    backend.saveAchievements(user.uid, merged).catch((e) => {
      console.warn("[神旅帳] 実績の保存に失敗しました", e);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockedIdsKey, user?.uid, profile?.uid]);

  /* ポイント・収集状態のスナップショット保存（値が変わった時だけ） */
  useEffect(() => {
    if (!user) return;
    const key = `${user.uid}:${points.total}:${benefitsCollection.collected}:${deitiesCollection.collected}`;
    if (savedPointsKey.current === key) return;
    savedPointsKey.current = key;
    backend
      .savePoints(user.uid, {
        total: points.total,
        rank_id: points.rank.id,
        breakdown: points.breakdown,
        updated_at: new Date().toISOString(),
      })
      .catch((e) => console.warn("[神旅帳] ポイントの保存に失敗しました", e));
    backend
      .saveCollection(user.uid, "benefits", toCollectedMap(benefitsCollection))
      .catch(() => undefined);
    backend
      .saveCollection(user.uid, "deities", toCollectedMap(deitiesCollection))
      .catch(() => undefined);
  }, [user, points, benefitsCollection, deitiesCollection, backend]);

  const value: AppContextValue = {
    backend,
    mode,
    ready,
    user,
    profile,
    shrines,
    visits,
    goshuin,
    favorites,
    stats,
    achievements,
    unlockedAchievements,
    points,
    benefitsCollection,
    deitiesCollection,
    deities,
    benefits,
    regions,
    shrineSource,
    error,
    clearError: () => setError(null),
    migration,
    dismissMigration: () => setMigration(null),
    online,
    downloads,
    pendingVisits,
    lastSyncAt,
    localShrineTotal,
    syncing,
    syncNow,
    downloadRegion,
    removeRegionData,
    suggestRegionForPosition,
    searchShrines,
    signInWithGoogle,
    signInAsDemo,
    signOut,
    updateProfile,
    uploadImage,
    checkIn,
    removeVisit,
    registerGoshuin,
    removeGoshuin,
    toggleFavorite,
    isFavorite: (shrineId: string) => favorites.includes(shrineId),
    shrineById: (id: string) => shrineMap.get(id),
    visitCountOf: (shrineId: string) => visitCountMap.get(shrineId) ?? 0,
    visitedShrineIds: Array.from(visitCountMap.keys()),
    recentVisits: visits.slice(0, 5),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp は AppProvider の内側で使用してください。");
  return ctx;
}
