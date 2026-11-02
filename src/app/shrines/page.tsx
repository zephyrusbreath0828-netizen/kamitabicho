"use client";

/**
 * 神社一覧（v1.2-beta）
 * ページネーション / 地方・都道府県・参拝済み絞り込み / 現在地からの半径検索 / 地図表示
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import ShrineCard from "@/components/ShrineCard";
import ShrineMap from "@/components/ShrineMap";
import { EmptyState } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { distanceMeters } from "@/lib/geo";
import { REGION_LIST, regionLabel } from "@/lib/regions";
import type { RegionId, ShrineSearchResult, ShrineV2 } from "@/lib/types";
import { usePosition } from "@/lib/use-position";

type Filter = "all" | "visited" | "favorite";
const PAGE_SIZE = 20;
const RADII = [1, 5, 10, 50] as const;

export default function ShrinesPage() {
  const { searchShrines, visitedShrineIds, favorites, visitCountOf, shrines, online, regions } = useApp();
  const { position, locate } = usePosition();
  const [query, setQuery] = useState("");
  const [pref, setPref] = useState<string>("すべて");
  const [region, setRegion] = useState<RegionId | "all">("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [result, setResult] = useState<ShrineSearchResult | null>(null);
  const [items, setItems] = useState<ShrineV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const pageRef = useRef(1);
  const reqRef = useRef(0);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);

  const prefectures = useMemo(
    () => ["すべて", ...Array.from(new Set(shrines.map((s) => s.prefecture)))],
    [shrines],
  );

  const runSearch = useCallback(
    async (page: number, append: boolean) => {
      const reqId = ++reqRef.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await searchShrines({
          query: query.trim() || undefined,
          prefecture: pref === "すべて" ? undefined : pref,
          region: region === "all" ? undefined : region,
          near: position ? { latitude: position.latitude, longitude: position.longitude } : null,
          page,
          // 半径検索時は広めに取得してから端末側で距離で絞る
          pageSize: radiusKm ? 500 : PAGE_SIZE,
        });
        if (reqId !== reqRef.current) return;
        setResult(res);
        setItems((prev) => (append ? [...prev, ...res.items] : res.items));
        pageRef.current = page;
      } finally {
        if (reqId === reqRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [searchShrines, query, pref, region, position, radiusKm],
  );

  useEffect(() => {
    void runSearch(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, pref, region, position?.latitude, position?.longitude, radiusKm]);

  const withDistance = useMemo(() => {
    if (!position) return items.map((s) => ({ shrine: s, distance: null as number | null }));
    return items.map((s) => ({
      shrine: s,
      distance: distanceMeters(
        { latitude: position.latitude, longitude: position.longitude },
        { latitude: s.latitude, longitude: s.longitude },
      ),
    }));
  }, [items, position]);

  const list = useMemo(() => {
    const max = radiusKm ? radiusKm * 1000 : null;
    return withDistance.filter(({ shrine, distance }) => {
      if (max !== null) {
        if (distance === null || distance > max) return false;
      }
      if (filter === "visited") return visitedShrineIds.includes(shrine.id);
      if (filter === "favorite") return favorites.includes(shrine.id);
      return true;
    });
  }, [withDistance, radiusKm, filter, visitedShrineIds, favorites]);

  const markers = useMemo(
    () =>
      list.slice(0, 60).map(({ shrine }) => ({
        id: shrine.id,
        name: shrine.name,
        latitude: shrine.latitude,
        longitude: shrine.longitude,
      })),
    [list],
  );

  return (
    <div>
      <PageHeader title="神社をさがす" subtitle={`${shrines.length}社・${prefectures.length - 1}都道府県を収録`} eyebrow="SHRINES" />

      <div className="sticky top-0 z-20 space-y-2.5 border-b border-washi-line bg-washi/95 px-4 py-3 backdrop-blur">
        <input
          className="field"
          placeholder="神社名・都道府県・ご祭神・御利益で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="神社を検索"
        />
        <div className="flex gap-2">
          {([
            ["all", "すべて"],
            ["visited", "参拝済み"],
            ["favorite", "お気に入り"],
          ] as Array<[Filter, string]>).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`chip chip-btn ${filter === key ? "chip-active" : ""}`}
              aria-pressed={filter === key}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setShowMap((v) => !v)}
            className={`chip chip-btn ml-auto ${showMap ? "chip-active" : ""}`}
            aria-pressed={showMap}
          >
            地図
          </button>
        </div>

        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
          <span className="shrink-0 text-[0.68rem] text-sumi-mute">現在地から</span>
          <button
            onClick={() => setRadiusKm(null)}
            className={`chip chip-btn shrink-0 ${radiusKm === null ? "chip-active" : ""}`}
            aria-pressed={radiusKm === null}
          >
            全域
          </button>
          {RADII.map((km) => (
            <button
              key={km}
              onClick={() => {
                if (!position) void locate();
                setRadiusKm(km);
              }}
              className={`chip chip-btn shrink-0 ${radiusKm === km ? "chip-active" : ""}`}
              aria-pressed={radiusKm === km}
              data-radius={km}
            >
              {km}km
            </button>
          ))}
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-washi-line bg-paper/60 px-4 py-2">
        <button
          onClick={() => setRegion("all")}
          className={`chip chip-btn shrink-0 ${region === "all" ? "chip-active" : ""}`}
        >
          全国
        </button>
        {(regions.length ? regions : REGION_LIST)
          .slice()
          .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
          .map((r) => (
          <button
            key={r.id}
            onClick={() => setRegion(r.id)}
            className={`chip chip-btn shrink-0 ${region === r.id ? "chip-active" : ""}`}
            aria-pressed={region === r.id}
          >
            {r.name || regionLabel(r.id)}
          </button>
          ))}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-washi-line bg-paper/40 px-4 py-2">
        {prefectures.map((p) => (
          <button
            key={p}
            onClick={() => setPref(p)}
            className={`chip chip-btn shrink-0 ${pref === p ? "chip-active" : ""}`}
            aria-pressed={pref === p}
          >
            {p}
          </button>
        ))}
      </div>

      {showMap && (
        <div className="border-b border-washi-line px-4 py-3">
          <ShrineMap markers={markers} center={position} height={220} />
          {!position && (
            <button className="btn btn-outline btn-sm mt-2 w-full" onClick={() => void locate()}>
              現在地を取得して地図を中心に合わせる
            </button>
          )}
        </div>
      )}

      <div className="space-y-2.5 px-4 py-4">
        <div className="flex items-center justify-between">
          <p className="text-[0.76rem] text-sumi-mute">
            {radiusKm ? `半径${radiusKm}km・${list.length}件` : result ? `${result.total.toLocaleString("ja-JP")}件` : "検索中…"}
            {result && !radiusKm && (
              <span className="ml-1.5 text-[0.66rem]">
                （{result.source === "firestore" ? "クラウド" : result.source === "local" ? "端末データ" : "同梱データ"}
                {!online && "・オフライン"}）
              </span>
            )}
          </p>
          {loading && <span className="text-[0.7rem] text-sumi-mute">読み込み中…</span>}
        </div>

        {radiusKm && !position && (
          <p className="rounded-xl border border-kin/40 bg-[rgba(168,137,79,0.1)] px-3 py-2 text-[0.78rem] text-[#7a5f2c]">
            現在地を取得すると半径{radiusKm}kmの神社を表示します。位置情報を許可してください。
          </p>
        )}

        {list.length === 0 ? (
          <EmptyState
            title="該当する神社がありません"
            description="検索条件を変更するか、絞り込みを解除してお試しください。"
            mark="無"
          />
        ) : (
          <div className="stagger space-y-2.5">
            {list.map(({ shrine, distance }) => (
              <ShrineCard
                key={shrine.id}
                shrine={shrine}
                distance={distance}
                visited={visitedShrineIds.includes(shrine.id)}
                visitCount={visitCountOf(shrine.id)}
              />
            ))}
          </div>
        )}

        {result?.hasMore && !radiusKm && (
          <button
            className="btn btn-outline w-full"
            disabled={loadingMore}
            onClick={() => void runSearch(pageRef.current + 1, true)}
          >
            {loadingMore ? "読み込んでいます…" : `さらに読み込む（残り${result.total - items.length}件）`}
          </button>
        )}
      </div>
    </div>
  );
}
