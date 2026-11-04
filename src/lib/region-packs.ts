"use client";

/**
 * 地域パック（JSON）の管理 — アプリ更新なしで地方データを追加するための基盤
 *
 * パック形式:
 * {
 *   "region": "kinki", "version": 1, "shrine_count": 1200, "updated_at": "2026-11-01T00:00:00Z",
 *   "shrines": [{ "id"?, "name", "prefecture", "city"?, "address"?, "latitude", "longitude"?, "source"? }]
 * }
 *
 * 保存先:
 *   - Firestore regions/{region} と shrines（id は region + 名称ハッシュで安定）… 正データ
 *   - IndexedDB（Dexie）… 端末キャッシュ（オフライン検索用）
 *
 * 管理者は管理画面から JSON を貼り付け／選択して登録する。npm 実行は不要。
 */
import { collection, doc, getDocs, query, setDoc, updateDoc, where, deleteDoc } from "firebase/firestore";
import { getDb as getFirestoreDb, COLLECTIONS } from "@/lib/firebase";
import type { Region, ShrineV2 } from "@/lib/types";

export type PackShrine = {
  id?: string;
  name: string;
  prefecture: string;
  city?: string;
  address?: string;
  latitude: number;
  longitude?: number;
  source?: string;
};

export type RegionPack = {
  region: string;
  name?: string;
  version: number;
  shrine_count?: number;
  updated_at?: string;
  shrines: PackShrine[];
};

export class PackError extends Error {}

/** 文字列から安定した短いIDを作る（同じ神社は常に同じID） */
function hashId(region: string, prefecture: string, name: string): string {
  let h = 0;
  const key = `${region}|${prefecture}|${name}`;
  for (let i = 0; i < key.length; i += 1) h = (Math.imul(h, 31) + key.charCodeAt(i)) | 0;
  const a = (h >>> 0).toString(36);
  let h2 = 0;
  for (let i = key.length - 1; i >= 0; i -= 1) h2 = (Math.imul(h2, 37) + key.charCodeAt(i)) | 0;
  return `${region.slice(0, 3)}_${a}${(h2 >>> 0).toString(36)}`.slice(0, 24);
}

/** JSON テキストを検証してパックへ変換する（管理画面・登録処理で共用） */
const REGION_LABELS: Record<string, string> = {
  hokkaido: "北海道", tohoku: "東北地方", kanto: "関東地方", chubu: "中部地方",
  kinki: "近畿地方", chugoku: "中国地方", shikoku: "四国地方", kyushu: "九州・沖縄地方",
};

export function parsePack(text: string): RegionPack {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new PackError("JSON の形式が正しくありません。");
  }
  // 配列形式（src/data/packs/*.json と同形式）にも対応する
  const asArray = Array.isArray(data) ? (data as PackShrine[]) : null;
  const raw = (asArray
    ? {
        region: (asArray[0] as PackShrine & { region?: string })?.region,
        version: 1,
        shrines: asArray,
      }
    : data) as Partial<RegionPack>;
  if (!raw || typeof raw !== "object") throw new PackError("JSON のルートがオブジェクトではありません。");
  if (!raw.region || typeof raw.region !== "string") throw new PackError("region がありません。");
  if (!/^[a-z0-9_-]{2,32}$/.test(raw.region)) throw new PackError("region は英小文字・数字・-・_ のみ使用できます。");
  if (!Array.isArray(raw.shrines) || raw.shrines.length === 0) throw new PackError("shrines が空です。");
  if (raw.version != null && !Number.isFinite(Number(raw.version))) throw new PackError("version が数値ではありません。");

  const shrines: PackShrine[] = [];
  for (const [i, s] of raw.shrines.entries()) {
    const row = s as Partial<PackShrine>;
    const name = String(row?.name ?? "").trim();
    const prefecture = String(row?.prefecture ?? "").trim();
    const lat = Number(row?.latitude);
    const lon = row?.longitude == null ? NaN : Number(row.longitude);
    if (!name) throw new PackError(`${i + 1}件目: name が空です。`);
    if (!prefecture) throw new PackError(`${i + 1}件目: prefecture が空です。`);
    if (!Number.isFinite(lat) || lat < 20 || lat > 46) throw new PackError(`${i + 1}件目: latitude が不正です。`);
    if (!Number.isFinite(lon) || lon < 122 || lon > 154) throw new PackError(`${i + 1}件目: longitude が不正です。`);
    shrines.push({
      id: row.id,
      name,
      prefecture,
      city: String(row.city ?? "").trim(),
      address: String(row.address ?? "").trim(),
      latitude: Math.round(lat * 1e6) / 1e6,
      longitude: Math.round(lon * 1e6) / 1e6,
      source: String(row.source ?? "imported").trim(),
    });
  }

  return {
    region: raw.region,
    name: raw.name ?? REGION_LABELS[raw.region] ?? raw.region,
    version: Number(raw.version ?? 1),
    shrine_count: shrines.length,
    updated_at: raw.updated_at ?? new Date().toISOString(),
    shrines,
  };
}

/** パックをアプリの神社型へ変換 */
export function toShrines(pack: RegionPack): ShrineV2[] {
  return pack.shrines.map(
    (s) =>
      ({
        id: s.id || hashId(pack.region, s.prefecture, s.name),
        name: s.name,
        prefecture: s.prefecture,
        address: s.address || s.prefecture,
        latitude: s.latitude,
        longitude: s.longitude,
        coord_accuracy: "exact",
        main_deity: "",
        description: "",
        image_url: "",
        visit_count: 0,
        city: s.city ?? "",
        region: pack.region,
        deities: [],
        benefits: [],
        source: s.source ?? "imported",
        data_version: pack.version,
      }) as unknown as ShrineV2,
  );
}

/**
 * パックを Firestore へ登録・更新する（管理者）
 * 既存ドキュメントは削除しない。`version` を上げると利用者側に「更新あり」が出る。
 */
export async function registerPack(pack: RegionPack, opts: { enabled?: boolean } = {}): Promise<{ region: string; count: number }> {
  const db = getFirestoreDb();
  if (!db) throw new PackError("Firebase が設定されていないため登録できません。");

  const rows = toShrines(pack);
  const now = new Date().toISOString();
  const payloadSize = new Blob([JSON.stringify(pack)]).size;

  await setDoc(
    doc(db, COLLECTIONS.regions, pack.region),
    {
      id: pack.region,
      name: pack.name ?? pack.region,
      shrine_count: rows.length,
      version: pack.version,
      download_size: payloadSize,
      release: opts.enabled === false ? "disabled" : "available",
      source: rows[0]?.source ?? "imported",
      updated_at: now,
    },
    { merge: true },
  );

  for (let i = 0; i < rows.length; i += 400) {
    const batch = rows.slice(i, i + 400);
    await Promise.all(batch.map((s) => setDoc(doc(db, COLLECTIONS.shrines, s.id), { ...s, data_version: pack.version }, { merge: true })));
  }
  return { region: pack.region, count: rows.length };
}

/** 配布状態の切り替え（無効化 / 有効化） */
export async function setPackEnabled(region: string, enabled: boolean): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new PackError("Firebase が設定されていないため変更できません。");
  await updateDoc(doc(db, COLLECTIONS.regions, region), {
    release: enabled ? "available" : "disabled",
    updated_at: new Date().toISOString(),
  });
}

/** 地域パックの削除（regions ドキュメントと、その地域の shrines のみ） */
export async function removePack(region: string): Promise<number> {
  const db = getFirestoreDb();
  if (!db) throw new PackError("Firebase が設定されていないため削除できません。");
  const snap = await getDocs(query(collection(db, COLLECTIONS.shrines), where("region", "==", region)));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, COLLECTIONS.regions, region));
  return snap.size;
}

/** 登録済みパックの一覧（管理画面用） */
export async function listRegisteredPacks(): Promise<Region[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.regions));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Partial<Region>) })) as Region[];
}

/* ---------------- 端末内の登録パック（Firebase 未設定・デモ用） ---------------- */

const KEY_LOCAL = "kamitabicho:local-packs:v1";
export type LocalPack = { region: string; name: string; version: number; shrine_count: number; updated_at: string };

export function listLocalPacks(): LocalPack[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY_LOCAL) ?? "[]") as LocalPack[];
  } catch {
    return [];
  }
}

export function saveLocalPack(pack: RegionPack, enabled: boolean): void {
  if (typeof window === "undefined") return;
  const list = listLocalPacks().filter((p) => p.region !== pack.region);
  list.push({
    region: pack.region,
    name: pack.name ?? pack.region,
    version: pack.version,
    shrine_count: pack.shrines.length,
    updated_at: new Date().toISOString(),
    enabled,
  } as LocalPack & { enabled: boolean });
  window.localStorage.setItem(KEY_LOCAL, JSON.stringify(list));
}

export function removeLocalPack(region: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_LOCAL, JSON.stringify(listLocalPacks().filter((p) => p.region !== region)));
}

/** 監査ログ（端末内に保持。Firestore へは書かない） */
export function logPackAction(uid: string, action: string, region: string, detail: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = "kamitabicho:pack-log:v1";
    const rows = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown[];
    rows.unshift({ uid, action, region, detail: detail.slice(0, 200), created_at: new Date().toISOString() });
    window.localStorage.setItem(key, JSON.stringify(rows.slice(0, 50)));
  } catch {
    /* 記録失敗は本処理に影響させない */
  }
}
