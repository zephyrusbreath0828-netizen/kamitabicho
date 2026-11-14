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
import {
  BENEFITS,
  BENEFIT_KEYWORDS,
  BENEFIT_LONG,
  BENEFIT_OVERVIEW,
  BENEFIT_RELATED,
  BENEFIT_SIGNATURE,
  PREF_NEIGHBORS,
  PILGRIM_RANKS,
  SIGNATURE_PREF,
  benefitIconOf,
  pilgrimRankOf,
} from "@/data/masters";
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
  const [prefBase, setPrefBase] = useState("auto");

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

  /**
   * 詳細画面のデータ（v2.13.0）
   * 詳細を開いたときだけ関連神社を走査するので、一覧の初回表示は軽いまま。
   */
  const detailData = useMemo(() => {
    if (!detail) return null;
    const visitedRefs = detail.refs.filter((r) => visited.has(r.id));
    const unvisited = detail.refs.filter((r) => !visited.has(r.id));

    const deityCount = new Map<string, number>();
    detail.refs.forEach((r) => r.deities.forEach((d) => deityCount.set(d, (deityCount.get(d) ?? 0) + 1)));
    const deities = Array.from(deityCount.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
      .slice(0, 4);

    // 分社・御旅所などは避け、同名の本社を優先する
    const NOT_MAIN = /分社|分霊|御旅所|遥拝|境外|末社|摂社/;
    const pickMain = (keyword: string): BenefitShrineRef | undefined => {
      const want = SIGNATURE_PREF[keyword];
      const candidates = detail.refs.filter(
        (r) =>
          r.name.replace(/\s/g, "").includes(keyword) &&
          !NOT_MAIN.test(r.name) &&
          (want ? r.prefecture === want : true),
      );
      const score = (n: string) => (n === keyword ? 0 : n.startsWith(keyword) ? 1 : 2);
      return candidates.sort((a, b) => score(a.name) - score(b.name) || a.name.length - b.name.length)[0];
    };
    const picked = (BENEFIT_SIGNATURE[detail.name] ?? [])
      .map(pickMain)
      .filter((r): r is BenefitShrineRef => Boolean(r))
      .filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i);
    const featured = (picked.length >= 2 ? picked : unvisited).slice(0, 4);

    const base = prefBase === "auto" ? visitedRefs[0]?.prefecture ?? "" : prefBase;
    const near = base ? PREF_NEIGHBORS[base] ?? [] : [];
    const samePref = unvisited.filter((r) => r.prefecture === base);
    const nearPref = unvisited.filter((r) => near.includes(r.prefecture));
    const others = unvisited.filter((r) => r.prefecture !== base && !near.includes(r.prefecture));
    const recommend = [...samePref, ...nearPref, ...others].slice(0, 5);

    const related = Array.from(
      new Set([
        ...(BENEFIT_RELATED[detail.name] ?? []),
        ...BENEFITS.filter((b) => b.category === detail.category).map((b) => b.name),
      ]),
    )
      .filter((n) => n !== detail.name && BENEFITS.some((b) => b.name === n))
      .slice(0, 4);

    const prefs = Array.from(new Set(detail.refs.map((r) => r.prefecture))).sort((a, b) => a.localeCompare(b, "ja"));

    return {
      visitedRefs,
      unvisited,
      deities,
      featured,
      recommend,
      related,
      prefs,
      base,
      samePrefCount: samePref.length,
      complete: detail.total > 0 && detail.done === detail.total,
      overview: BENEFIT_OVERVIEW[detail.name] ?? null,
      rank: pilgrimRankOf(detail.rate),
    };
  }, [detail, visited, prefBase]);

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

      {/* 御利益詳細（v2.13.0） */}
      {detail && detailData && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-washi"
          role="dialog"
          aria-modal="true"
          aria-label={`${detail.name}の詳細`}
        >
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-washi-line bg-washi/95 px-3 py-2 backdrop-blur">
            <button
              type="button"
              className="shrink-0 rounded-full border border-washi-line px-2.5 py-1 text-[0.72rem] text-sumi-mute"
              onClick={() => setOpen(null)}
              aria-label="図鑑に戻る"
            >
              ← 戻る
            </button>
            <span className="min-w-0 flex-1 truncate font-mincho text-[0.86rem] font-semibold">
              {benefitIconOf(detail.name)} {detail.name}
            </span>
            {detailData.complete && <span className="shrink-0 text-[0.62rem] font-semibold text-kin">🏆 COMPLETE</span>}
          </div>

          <div className="mx-auto max-w-md px-4 pb-20 pt-4">
            {/* 1. 御利益名・カテゴリ・アイコン */}
            <section className="wa-card p-4 text-center">
              <p className="text-[2.1rem] leading-none" aria-hidden>{benefitIconOf(detail.name)}</p>
              <h1 className="mt-2 font-mincho text-[1.32rem] font-semibold">{detail.name}</h1>
              <p className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-kin/50 px-2.5 py-0.5 text-[0.66rem] text-kin">
                カテゴリ {detail.category}
              </p>
              <p className="mt-2 text-[0.68rem] text-sumi-mute">
                現在の称号 <span className="font-medium text-ink/85">{detailData.rank.label}</span>
                <span className="ml-1 font-mono">（参拝率 {detail.rate}%）</span>
              </p>
            </section>

            {/* 2. 御利益概要 */}
            <section className="mt-3 wa-card p-4">
              <SectionTitle title="御利益概要" />
              <p className="text-[0.8rem] leading-relaxed text-ink/85">
                {detailData.overview?.summary ?? detail.description}
              </p>
              {detailData.overview && (
                <>
                  <p className="mt-3 text-[0.7rem] font-semibold text-sumi-mute">こんな願いごとに</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {detailData.overview.wishes.map((w) => (
                      <span key={w} className="chip text-[0.66rem]">{w}</span>
                    ))}
                  </div>
                  <p className="mt-3 text-[0.7rem] font-semibold text-sumi-mute">関連する信仰</p>
                  <p className="mt-1 text-[0.76rem] leading-relaxed text-ink/80">{detailData.overview.faith}</p>
                </>
              )}
            </section>

            {/* 3. 代表祭神 */}
            <section className="mt-3 wa-card p-4">
              <SectionTitle title="代表祭神" trailing={<span className="text-[0.64rem] text-sumi-mute">関連神社の多い順</span>} />
              {detailData.deities.length === 0 ? (
                <p className="text-[0.76rem] text-sumi-mute">祭神データが未登録です。</p>
              ) : (
                <div className="space-y-1.5">
                  {detailData.deities.map(([name, count]) => (
                    <div key={name} className="flex items-center gap-2 rounded-lg bg-[#faf7ef] px-2.5 py-1.5">
                      <span className="min-w-0 flex-1 truncate font-mincho text-[0.84rem]">{name}</span>
                      <span className="shrink-0 font-mono text-[0.64rem] text-sumi-mute">{count}社</span>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/zukan" className="mt-2 inline-block text-[0.7rem] text-shu underline">
                祭神図鑑で神格を調べる
              </Link>
            </section>

            {/* 4. 代表神社 */}
            <section className="mt-3 wa-card p-4">
              <SectionTitle title="代表神社" trailing={<span className="text-[0.64rem] text-sumi-mute">タップで詳細</span>} />
              <div className="space-y-1.5">
                {detailData.featured.map((r) => (
                  <Link key={r.id} href={`/shrines/${r.id}`} className="flex items-center gap-2 rounded-lg border border-washi-line px-2.5 py-2 transition hover:border-shu/50">
                    <span className="shrink-0 text-[0.9rem]" aria-hidden>⛩</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.82rem] font-medium">{r.name}</span>
                      <span className="block truncate text-[0.64rem] text-sumi-mute">
                        {r.prefecture}
                        {r.deities.length > 0 && `・${r.deities.slice(0, 2).join("・")}`}
                      </span>
                    </span>
                    <span className={`shrink-0 text-[0.62rem] ${visited.has(r.id) ? "text-mori" : "text-sumi-mute"}`}>
                      {visited.has(r.id) ? "✅ 参拝済" : "未参拝"}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* 5. あなたの収集状況 */}
            <section className="mt-3 wa-card p-4">
              <SectionTitle title="あなたの収集状況" />
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["関連神社", `${detail.total}社`, "text-ink"],
                  ["参拝済", `${detail.done}社`, "text-mori"],
                  ["未参拝", `${detail.total - detail.done}社`, "text-sumi-mute"],
                ].map(([label, value, tone]) => (
                  <div key={label} className="rounded-lg bg-[#faf7ef] p-2 text-center">
                    <p className="text-[0.6rem] text-sumi-mute">{label}</p>
                    <p className={`font-mono text-[0.95rem] font-semibold ${tone}`}>{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 6. あなたの参拝済神社 */}
            <section className="mt-3 wa-card p-4">
              <SectionTitle title="あなたの参拝済神社" trailing={<span className="text-[0.64rem] text-sumi-mute">{detailData.visitedRefs.length}社</span>} />
              {detailData.visitedRefs.length === 0 ? (
                <p className="text-[0.76rem] leading-relaxed text-sumi-mute">
                  まだ参拝記録がありません。下のおすすめ神社から最初の一社を訪ねてみましょう。
                </p>
              ) : (
                <div className="space-y-1">
                  {detailData.visitedRefs.slice(0, 8).map((r) => (
                    <Link key={r.id} href={`/shrines/${r.id}`} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition hover:bg-[#faf7ef]">
                      <span className="text-mori" aria-hidden>✅</span>
                      <span className="min-w-0 flex-1 truncate text-[0.8rem]">{r.name}</span>
                      <span className="shrink-0 text-[0.64rem] text-sumi-mute">{r.prefecture}</span>
                    </Link>
                  ))}
                  {detailData.visitedRefs.length > 8 && (
                    <p className="pt-1 text-[0.66rem] text-sumi-mute">ほか {detailData.visitedRefs.length - 8}社</p>
                  )}
                </div>
              )}
            </section>

            {/* 7. おすすめ神社（同県 → 近県 → 全国） */}
            <section className="mt-3 wa-card p-4">
              <SectionTitle
                title="おすすめ神社"
                trailing={<span className="text-[0.64rem] text-sumi-mute">未参拝から</span>}
              />
              <div className="mb-2 flex items-center gap-2">
                <span className="shrink-0 text-[0.66rem] text-sumi-mute">基準の地域</span>
                <select
                  className="field flex-1 text-[0.74rem]"
                  value={prefBase}
                  onChange={(e) => setPrefBase(e.target.value)}
                  aria-label="おすすめの基準地域"
                >
                  <option value="auto">自動（参拝した神社の都道府県）</option>
                  {detailData.prefs.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <p className="mb-1.5 text-[0.64rem] text-sumi-mute">
                {detailData.base
                  ? `${detailData.base} → 近県 → 全国 の順に表示`
                  : "参拝記録がないため全国から表示します"}
              </p>
              {detailData.recommend.length === 0 ? (
                <p className="text-[0.76rem] text-sumi-mute">未参拝の神社はありません。すべて参拝済みです。</p>
              ) : (
                <div className="space-y-1.5">
                  {detailData.recommend.map((r) => (
                    <Link key={r.id} href={`/shrines/${r.id}`} className="flex items-start gap-2 rounded-lg border border-washi-line px-2.5 py-2 transition hover:border-shu/50">
                      <span className="shrink-0 text-[0.8rem]" aria-hidden>⭐</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.82rem] font-medium">{r.name}</span>
                        <span className="block truncate text-[0.64rem] text-sumi-mute">
                          {r.prefecture}・{detail.name}の御利益
                          {r.prefecture === detailData.base && "・同県"}
                          {r.prefecture !== detailData.base && (PREF_NEIGHBORS[detailData.base] ?? []).includes(r.prefecture) && "・近県"}
                        </span>
                      </span>
                      <span className="shrink-0 self-center text-[0.6rem] text-sumi-mute">未参拝</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* 8. 関連御利益 */}
            <section className="mt-3">
              <SectionTitle title="関連御利益" />
              <div className="grid grid-cols-2 gap-2">
                {detailData.related.map((n) => {
                  const target = stats.find((x) => x.name === n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => { setOpen(n); setLimit(40); setStatus("all"); setPref("all"); }}
                      className="wa-card p-2.5 text-left transition hover:border-shu/50"
                      aria-label={`${n}の詳細を見る`}
                    >
                      <p className="text-[1rem] leading-none" aria-hidden>{benefitIconOf(n)}</p>
                      <p className="mt-1 truncate font-mincho text-[0.82rem] font-semibold">{n}</p>
                      <p className="text-[0.62rem] text-sumi-mute">
                        {target ? `関連 ${target.total}社・参拝済 ${target.done}社` : "関連神社なし"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 9. 達成バッジ */}
            <section className="mt-3 wa-card p-4">
              <SectionTitle title="達成バッジ" trailing={<span className="text-[0.64rem] text-sumi-mute">参拝率 {detail.rate}%</span>} />
              <div className="space-y-1">
                {PILGRIM_RANKS.filter((r) => r.min > 0).map((r, i) => {
                  const reached = detail.rate >= r.min;
                  return (
                    <div key={r.label} className={`flex items-center gap-2 rounded-lg px-2 py-1 ${reached ? "bg-[#fdf8ec]" : ""}`}>
                      <span className={`w-8 shrink-0 text-right font-mono text-[0.62rem] ${reached ? "text-kin" : "text-sumi-mute"}`}>{r.min}%</span>
                      <span className={`min-w-0 flex-1 truncate text-[0.78rem] ${reached ? "font-medium" : "text-sumi-mute"}`}>
                        {reached ? "🏅 " : ""}{r.label}
                      </span>
                      {detailData.rank.index === i + 1 && <span className="shrink-0 text-[0.58rem] text-shu">現在</span>}
                    </div>
                  );
                })}
              </div>
              {detailData.rank.next ? (
                <p className="mt-2 text-[0.66rem] text-sumi-mute">
                  次は「{detailData.rank.next.label}」（参拝率 {detailData.rank.next.min}%）
                </p>
              ) : (
                <p className="mt-2 text-[0.66rem] text-sumi-mute">すべての称号を獲得しました。</p>
              )}
            </section>

            {/* 10. コンプリート */}
            <section className={`mt-3 rounded-xl border p-4 text-center ${detailData.complete ? "border-kin/60 bg-[#fdf8ec]" : "border-washi-line bg-white/50"}`}>
              {detailData.complete ? (
                <>
                  <p className="text-[1.6rem] leading-none" aria-hidden>🏆</p>
                  <p className="mt-1.5 text-[0.7rem] font-semibold tracking-wide text-kin">COMPLETE</p>
                  <p className="mt-1 font-mincho text-[1.02rem] font-semibold">{detail.name}マスター</p>
                  <p className="mt-1 text-[0.68rem] text-sumi-mute">
                    関連 {detail.total}社すべてを参拝しました。
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[1.15rem] leading-none opacity-30" aria-hidden>🏆</p>
                  <p className="mt-1.5 font-mincho text-[0.88rem] font-semibold text-sumi-mute">コンプリートまで</p>
                  <p className="font-mono text-[1.05rem] font-semibold">残り {detail.total - detail.done}社</p>
                  <p className="mt-1 text-[0.66rem] text-sumi-mute">
                    すべて参拝すると「{detail.name}マスター」の称号が付きます。
                  </p>
                </>
              )}
            </section>

            {/* 11. 関連神社一覧 */}
            <section className="mt-3">
              <SectionTitle title="関連神社一覧" trailing={<span className="text-[0.64rem] text-sumi-mute">{relatedList.rows.length}件</span>} />
              <div className="flex flex-wrap gap-1.5">
                {STATUS.map(([key, label]) => (
                  <button key={key} type="button" className={`chip chip-btn ${status === key ? "chip-active" : ""}`} onClick={() => { setStatus(key); setPref("all"); setLimit(40); }} aria-pressed={status === key}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <select className="field flex-1 text-[0.76rem]" value={pref} onChange={(e) => { setPref(e.target.value); setLimit(40); }} aria-label="都道府県で絞り込み">
                  <option value="all">すべての都道府県</option>
                  {relatedList.prefs.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <select className="field flex-1 text-[0.76rem]" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="並び替え">
                  {SORTS.map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
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
            </section>

            <button type="button" className="btn btn-outline mt-4 w-full" onClick={() => setOpen(null)}>
              図鑑に戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
