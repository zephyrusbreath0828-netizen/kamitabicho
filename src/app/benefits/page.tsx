"use client";

/**
 * 御利益図鑑（v2.12.0）
 *
 * 御利益 → 神社検索 → 神社詳細 → 参拝 の導線を担う。
 * 一覧は benefits-*.json から自動生成し、初回のみ索引を構築する。
 */
import Link from "next/link";
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { SectionTitle } from "@/components/ui";
import { BENEFITS, BENEFIT_KEYWORDS, BENEFIT_LONG } from "@/data/masters";
import { packBenefitIndex, type BenefitShrineRef } from "@/data/packs";
import { useApp } from "@/lib/app-context";
import { distanceMeters, usePosition } from "@/lib/geo";
import { formatDistance } from "@/lib/geo";

const STATUS = [
  ["all", "すべて"],
  ["visited", "参拝済"],
  ["unvisited", "未参拝"],
] as const;

const SORTS = [
  ["name", "五十音順"],
  ["pref", "県順"],
  ["visited", "参拝済優先"],
  ["unvisited", "未参拝優先"],
] as const;

const RECOMMEND = ["縁結び", "金運", "厄除け"];

type Status = (typeof STATUS)[number][0];
type SortKey = (typeof SORTS)[number][0];

export default function BenefitsPage() {
  const { visitedShrineIds } = useApp();
  const { position, loading, error, locate } = usePosition();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("all");
  const [pref, setPref] = useState("all");
  const [sort, setSort] = useState<SortKey>("visited");
  const [limit, setLimit] = useState(40);

  const visited = useMemo(() => new Set(visitedShrineIds), [visitedShrineIds]);

  /** 御利益ごとの集計（初回のみ索引を構築） */
  const stats = useMemo(() => {
    const idx = packBenefitIndex();
    return BENEFITS.map((b) => {
      const refs = idx.get(b.name) ?? [];
      const done = refs.filter((r) => visited.has(r.id)).length;
      return {
        name: b.name,
        category: b.category,
        description: BENEFIT_LONG[b.name] ?? b.description,
        refs,
        total: refs.length,
        done,
        rate: refs.length ? Math.round((done / refs.length) * 1000) / 10 : 0,
      };
    });
  }, [visited]);

  /** 検索（願い事の言葉も御利益に読み替える） */
  const filtered = useMemo(() => {
    const q = query.trim().normalize("NFKC").toLowerCase();
    if (!q) return stats;
    return stats.filter((s) => {
      const words = [s.name, s.category, ...(BENEFIT_KEYWORDS[s.name] ?? [])];
      return words.some((w) => {
        const t = w.toLowerCase();
        return t.includes(q) || (t.length >= 2 && q.includes(t)) || s.description.toLowerCase().includes(q);
      });
    });
  }, [stats, query]);

  /** マイ御利益ランキング TOP10（参拝済みの社数） */
  const ranking = useMemo(
    () =>
      stats
        .filter((s) => s.done > 0)
        .sort((a, b) => b.done - a.done || a.name.localeCompare(b.name, "ja"))
        .slice(0, 10),
    [stats],
  );

  /** 現在地近くのおすすめ（縁結び・金運・厄除け） */
  const nearby = useMemo(() => {
    if (!position) return [];
    return RECOMMEND.map((name) => {
      const s = stats.find((x) => x.name === name);
      if (!s) return null;
      const best = s.refs
        .filter((r) => r.latitude && r.longitude)
        .map((r) => ({ r, d: distanceMeters(position, { latitude: r.latitude, longitude: r.longitude }) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      return { name, total: s.total, best };
    }).filter(Boolean) as Array<{ name: string; total: number; best: Array<{ r: BenefitShrineRef; d: number }> }>;
  }, [position, stats]);

  const detail = open ? stats.find((s) => s.name === open) ?? null : null;

  const relatedList = useMemo(() => {
    if (!detail) return { rows: [], prefs: [] };
    const prefs = Array.from(new Set(detail.refs.map((r) => r.prefecture))).sort((a, b) => a.localeCompare(b, "ja"));
    const rows = detail.refs
      .filter((r) => (status === "visited" ? visited.has(r.id) : status === "unvisited" ? !visited.has(r.id) : true))
      .filter((r) => (pref === "all" ? true : r.prefecture === pref))
      .map((r) => ({ ...r, visited: visited.has(r.id) }));
    rows.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ja");
      if (sort === "pref") return a.prefecture.localeCompare(b.prefecture, "ja") || a.name.localeCompare(b.name, "ja");
      if (sort === "visited") return Number(b.visited) - Number(a.visited) || a.prefecture.localeCompare(b.prefecture, "ja");
      return Number(a.visited) - Number(b.visited) || a.prefecture.localeCompare(b.prefecture, "ja");
    });
    return { rows, prefs };
  }, [detail, status, pref, sort, visited]);

  return (
    <div>
      <PageHeader title="御利益図鑑" subtitle="願い事から神社をさがす" backHref="/zukan" eyebrow="BENEFITS" />

      <div className="space-y-4 px-4 py-4">
        <section className="wa-card p-4">
          <p className="text-[0.8rem] leading-relaxed text-ink/85">
            願い事から御利益を選ぶと、その御利益を授ける神社を探せます。
            <span className="text-sumi-mute">全{BENEFITS.length}種・{stats.reduce((a, s) => a + s.total, 0).toLocaleString()}社を収録。</span>
          </p>
        </section>

        {/* おすすめ（現在地） */}
        <section>
          <SectionTitle
            title="現在地の近くで探す"
            trailing={
              <button type="button" className="text-[0.74rem] text-shu underline" onClick={() => void locate()}>
                {position ? "現在地を更新" : loading ? "取得中…" : "現在地を取得"}
              </button>
            }
          />
          {position ? (
            <div className="space-y-2">
              {nearby.map((n) => (
                <div key={n.name} className="wa-card p-3">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[0.84rem] font-semibold">
                      {n.name}の神社
                      <span className="ml-2 text-[0.66rem] font-normal text-sumi-mute">全{n.total}社</span>
                    </p>
                    <button type="button" className="text-[0.7rem] text-shu underline" onClick={() => { setQuery(n.name); setOpen(n.name); setLimit(40); }}>
                      一覧
                    </button>
                  </div>
                  {n.best.length === 0 && <p className="mt-1 text-[0.72rem] text-sumi-mute">座標が未登録です。</p>}
                  {n.best.map(({ r, d }) => (
                    <Link key={r.id} href={`/shrines/${r.id}`} className="mt-1 flex items-center gap-2 text-[0.76rem]">
                      <span className={r.id && visited.has(r.id) ? "text-mori" : "text-sumi-mute"} aria-hidden>
                        {visited.has(r.id) ? "✅" : "⬜"}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{r.name}</span>
                      <span className="shrink-0 font-mono text-[0.68rem] text-sumi-mute">{formatDistance(d)}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="wa-card p-3 text-[0.76rem] leading-relaxed text-sumi-mute">
              {error ? `現在地を取得できませんでした（${error}）。` : "現在地を取得すると、近くの縁結び・金運・厄除けの神社を表示します。"}
            </p>
          )}
        </section>

        {/* ランキング */}
        {ranking.length > 0 && (
          <section>
            <SectionTitle title="マイ御利益ランキング" trailing={<span className="text-[0.66rem] text-sumi-mute">TOP{ranking.length}</span>} />
            <div className="wa-card divide-y divide-washi-line">
              {ranking.map((r, i) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => { setOpen(r.name); setLimit(40); }}
                  className="flex w-full items-center gap-3 p-2.5 text-left"
                >
                  <span className="w-5 shrink-0 font-mono text-[0.76rem] text-kin">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[0.82rem]">{r.name}</span>
                  <span className="shrink-0 font-mono text-[0.72rem] text-sumi-mute">{r.done}社</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 検索 */}
        <input
          className="field"
          placeholder="願い事で検索（恋愛・受験・金運・厄年 など）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="御利益を検索"
        />

        {/* 一覧 */}
        <section>
          <SectionTitle title="御利益一覧" trailing={<span className="text-[0.74rem] text-sumi-mute">{filtered.length}件</span>} />
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => { setOpen(s.name); setLimit(40); }}
                className="wa-card p-3 text-left transition hover:border-shu/50"
                aria-label={`${s.name}の詳細を見る`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="font-mincho truncate text-[0.92rem] font-semibold">{s.name}</span>
                  <span className="shrink-0 text-[0.62rem] text-kin">{s.category}</span>
                </div>
                <p className="mt-1 text-[0.66rem] text-sumi-mute">関連 {s.total}社・参拝済 {s.done}社</p>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-washi-line">
                  <div className="h-full rounded-full bg-shu/70" style={{ width: `${Math.min(100, s.rate)}%` }} />
                </div>
                <p className="mt-1 text-right font-mono text-[0.62rem] text-sumi-mute">達成率 {s.rate}%</p>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="wa-card p-4 text-center text-[0.8rem] text-sumi-mute">
              該当する御利益がありません。「恋愛」「受験」「金運」など別の言葉でもお試しください。
            </p>
          )}
        </section>

        <Link href="/shrines" className="btn btn-primary w-full">
          神社をさがす
        </Link>
      </div>

      {/* 詳細 */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={`${detail.name}の詳細`}
          onClick={() => setOpen(null)}
        >
          <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-washi p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-mincho text-[1.12rem] font-semibold">{detail.name}</p>
                <p className="mt-0.5 text-[0.7rem] text-kin">{detail.category}</p>
              </div>
              <button type="button" className="shrink-0 rounded-full border border-washi-line px-2 py-1 text-[0.7rem] text-sumi-mute" onClick={() => setOpen(null)} aria-label="閉じる">
                閉じる
              </button>
            </div>

            <p className="mt-2 text-[0.78rem] leading-relaxed text-ink/85">{detail.description}</p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ["関連神社", `${detail.total}社`],
                ["参拝済", `${detail.done}社`],
                ["参拝率", `${detail.rate}%`],
              ].map(([label, value]) => (
                <div key={label} className="wa-card p-2 text-center">
                  <p className="text-[0.62rem] text-sumi-mute">{label}</p>
                  <p className="font-mono text-[0.9rem] font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {STATUS.map(([key, label]) => (
                <button key={key} type="button" className={`chip chip-btn ${status === key ? "chip-active" : ""}`} onClick={() => { setStatus(key); setPref("all"); setLimit(40); }} aria-pressed={status === key}>
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-2 flex gap-2">
              <select className="field flex-1 text-[0.76rem]" value={pref} onChange={(e) => { setPref(e.target.value); setLimit(40); }} aria-label="都道府県で絞り込み">
                <option value="all">すべての都道府県</option>
                {relatedList.prefs.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select className="field flex-1 text-[0.76rem]" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="並び替え">
                {SORTS.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <p className="mt-3 text-[0.7rem] text-sumi-mute">
              関連神社 {relatedList.rows.length}件を表示
            </p>
            <div className="mt-1.5 space-y-1.5">
              {relatedList.rows.slice(0, limit).map((r) => (
                <Link key={r.id} href={`/shrines/${r.id}`} className="wa-card flex items-center gap-2 p-2.5 transition hover:border-shu/50">
                  <span className={r.visited ? "text-mori" : "text-sumi-mute"} aria-hidden>{r.visited ? "✅" : "⬜"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8rem] font-medium">{r.name}</span>
                    <span className="block truncate text-[0.66rem] text-sumi-mute">
                      {r.prefecture}
                      {r.deities.length > 0 && `・${r.deities.slice(0, 2).join("・")}`}
                      {r.visited && "・参拝済"}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.7rem] text-sumi-mute" aria-hidden>›</span>
                </Link>
              ))}
            </div>
            {relatedList.rows.length === 0 && (
              <p className="wa-card p-3 text-center text-[0.76rem] text-sumi-mute">条件に合う神社がありません。</p>
            )}
            {relatedList.rows.length > limit && (
              <button type="button" className="btn btn-outline mt-2 w-full" onClick={() => setLimit((n) => n + 40)}>
                さらに表示（残り {relatedList.rows.length - limit}社）
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
