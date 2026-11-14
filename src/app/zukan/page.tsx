"use client";

/** 図鑑（v1.2）: 御利益コレクション / 祭神図鑑 */
import { useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { ProgressRing, SectionTitle } from "@/components/ui";
import { benefitIconOf, deityGroupId, deityProfileOf, DEITY_BY_ID } from "@/data/masters";
import { packBenefitIndex, packDeityIndex } from "@/data/packs";
import { useApp } from "@/lib/app-context";
import { formatDate } from "@/lib/format";

export default function ZukanPage() {
  const { benefitsCollection, deitiesCollection, benefits, deities, shrines, visitedShrineIds } = useApp();
  const [tab, setTab] = useState<"benefits" | "deities">("benefits");
  const [query, setQuery] = useState("");
  const [deityId, setDeityId] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [categorySort, setCategorySort] = useState<"rate" | "name">("rate");
  const [showAllRelated, setShowAllRelated] = useState(false);

  const active = tab === "benefits" ? benefitsCollection : deitiesCollection;
  const master = tab === "benefits" ? benefits : deities;

  const items = useMemo(() => {
    const q = query.trim().normalize("NFKC").toLowerCase();
    return master
      .map((m) => {
        const got = active.items.find((i) => i.id === m.id);
        return { ...m, obtainedAt: got?.obtainedAt, shrineNames: got?.shrineNames ?? [] };
      })
      .filter((m) => (q ? `${m.name} ${("category" in m ? m.category : "")}`.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        if (a.obtainedAt && !b.obtainedAt) return -1;
        if (!a.obtainedAt && b.obtainedAt) return 1;
        return a.name.localeCompare(b.name, "ja");
      });
  }, [tab, query, master, active.items]);

  /** 祭神ごとの関連神社数・参拝済数（v2.0） */
  const deityStats = useMemo(() => {
    const visited = new Set(visitedShrineIds);
    const m = new Map<string, { total: number; visited: number }>();
    for (const s of shrines) {
      for (const id of s.deities ?? []) {
        const key = deityGroupId(id);
        const e = m.get(key) ?? { total: 0, visited: 0 };
        e.total += 1;
        if (visited.has(s.id)) e.visited += 1;
        m.set(key, e);
      }
    }
    return m;
  }, [shrines, visitedShrineIds]);

  /** 祭神詳細（v2.11.6）: 神格・神徳・関連神社一覧 */
  const deityDetail = useMemo(() => {
    if (!deityId) return null;
    const key = deityGroupId(deityId);
    const visited = new Set(visitedShrineIds);
    const base = DEITY_BY_ID.get(deityId) ?? deities.find((d) => d.id === deityId);
    const name = base?.name ?? deityId.replace(/^d_/, "");
    const fallback = (base?.description ?? "").replace(/（.*?）/g, "").trim();
    const profile = deityProfileOf(name, fallback);
    // 同梱パック全体から関連神社を抽出し、アプリ側の神社情報で上書きする
    const map = new Map<string, { id: string; name: string; prefecture: string; benefits: string[] }>();
    for (const r of packDeityIndex().get(key) ?? []) map.set(r.id, { ...r });
    for (const s of shrines) {
      if (!(s.deities ?? []).some((d) => deityGroupId(d) === key)) continue;
      if (map.has(s.id)) continue;
      map.set(s.id, { id: s.id, name: s.name, prefecture: s.prefecture, benefits: [] });
    }
    const related = Array.from(map.values())
      .map((r) => ({ ...r, visited: visited.has(r.id) }))
      .sort((a, b) => Number(b.visited) - Number(a.visited) || a.prefecture.localeCompare(b.prefecture, "ja") || a.name.localeCompare(b.name, "ja"));
    const visitedCount = related.filter((r) => r.visited).length;
    return {
      key,
      name,
      profile,
      related,
      visitedCount,
      rate: related.length ? Math.round((visitedCount / related.length) * 1000) / 10 : 0,
      obtained: Boolean(deitiesCollection.items.find((i) => i.id === deityId)?.obtainedAt),
    };
  }, [deityId, shrines, visitedShrineIds, deitiesCollection.items, deities]);

  /** カテゴリ別の取得状況（v2.8） */
  /**
   * カテゴリ別の収集状況（v2.12.1）
   * 種別ごとに「取得 x / y種類・達成率・内訳（✅/⬜）」を持つ汎用構造。
   * 祭神図鑑など別の分類軸にもそのまま流用できる。
   */
  type CategoryGroup = {
    category: string;
    total: number;
    got: number;
    rate: number;
    complete: boolean;
    members: Array<{ id: string; name: string; obtained: boolean; icon: string; shrines: number }>;
  };

  const benefitShrineCounts = useMemo(() => {
    const idx = packBenefitIndex();
    const m = new Map<string, number>();
    idx.forEach((refs, name) => m.set(name, refs.length));
    return m;
  }, []);

  const categoryStats = useMemo<CategoryGroup[]>(() => {
    const m = new Map<string, CategoryGroup>();
    for (const item of items) {
      const cat = "category" in item ? String(item.category ?? "その他") : "その他";
      const e = m.get(cat) ?? { category: cat, total: 0, got: 0, rate: 0, complete: false, members: [] };
      const obtained = Boolean(item.obtainedAt);
      e.total += 1;
      if (obtained) e.got += 1;
      e.members.push({
        id: item.id,
        name: item.name,
        obtained,
        icon: benefitIconOf(item.name),
        shrines: benefitShrineCounts.get(item.name) ?? 0,
      });
      m.set(cat, e);
    }
    const list = Array.from(m.values()).map((e) => ({
      ...e,
      rate: e.total ? Math.round((e.got / e.total) * 100) : 0,
      complete: e.got === e.total && e.total > 0,
      members: e.members.sort((a, b) => Number(b.obtained) - Number(a.obtained) || a.name.localeCompare(b.name, "ja")),
    }));
    // 並び順は内部の取得率で決める（画面上に % は表示しない）
    return list.sort((a, b) =>
      categorySort === "name" ? a.category.localeCompare(b.category, "ja") : b.rate - a.rate || a.category.localeCompare(b.category, "ja"),
    );
  }, [items, categorySort, benefitShrineCounts]);

  return (
    <div>
      <PageHeader title="図鑑" subtitle="参拝で集まる御利益と祭神" eyebrow="COLLECTION" />

      <div className="space-y-4 px-4 py-4">
        <section className="wa-card flex items-center gap-4 p-4">
          <ProgressRing value={active.rate} size={104} stroke={9} label="収集率" />
          <div className="min-w-0 flex-1">
            <p className="font-mincho text-[1.02rem] font-semibold">
              取得 {active.collected} / 未取得 {active.total - active.collected}
            </p>
            <p className="mt-0.5 text-[0.72rem] text-sumi-mute">
              達成率 {active.rate}%（全 {active.total} 件）
            </p>
            <p className="mt-0.5 text-[0.76rem] leading-relaxed text-sumi-mute">
              {tab === "benefits"
                ? "参拝した神社の御利益が自動で集まります。"
                : "参拝した神社のご祭神が図鑑に登録されます。"}
            </p>
            <div className="mt-2 flex gap-1.5">
              {([
                ["benefits", "御利益"],
                ["deities", "祭神"],
              ] as Array<["benefits" | "deities", string]>).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`chip chip-btn ${tab === key ? "chip-active" : ""}`}
                  aria-pressed={tab === key}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {categoryStats.length > 0 && (
          <section className="wa-card p-3">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <p className="font-mincho text-[0.8rem] font-semibold">
                {tab === "benefits" ? "カテゴリ別の収集状況" : "分類別の収集状況"}
              </p>
              <button
                type="button"
                className="chip chip-btn text-[0.64rem]"
                onClick={() => setCategorySort((v) => (v === "rate" ? "name" : "rate"))}
                aria-label="並び順を切り替える"
              >
                {categorySort === "rate" ? "取得数順" : "カテゴリ名順"}
              </button>
            </div>
            <div className="space-y-1.5">
              {categoryStats.map((c) => {
                const expanded = openCategory === c.category;
                return (
                  <div key={c.category} className={`rounded-lg border ${c.complete ? "border-kin/60 bg-[#fdf8ec]" : "border-transparent"}`}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-1.5 py-1.5 text-left"
                      onClick={() => setOpenCategory(expanded ? null : c.category)}
                      aria-expanded={expanded}
                      aria-label={`${c.category}の内訳を${expanded ? "閉じる" : "見る"}`}
                    >
                      <span className={`shrink-0 text-[0.58rem] text-sumi-mute transition-transform ${expanded ? "rotate-90" : ""}`} aria-hidden>
                        ▶
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-1.5">
                          <span className="truncate text-[0.78rem] font-medium">{c.category}</span>
                          {c.complete && <span className="shrink-0 text-[0.56rem] font-semibold text-kin">🏆 COMPLETE</span>}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-1" aria-hidden>
                          {c.members.map((m) => (
                            <span
                              key={m.id}
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-[0.72rem] leading-none ${
                                m.obtained ? "border-shu/40 bg-[#fdf3f0]" : "border-washi-line bg-transparent opacity-35 grayscale"
                              }`}
                              title={`${m.name}${m.obtained ? "（取得済）" : "（未取得）"}`}
                            >
                              {m.obtained ? m.icon : "○"}
                            </span>
                          ))}
                        </span>
                      </span>
                      <span className="shrink-0 self-start text-right text-[0.66rem] text-sumi-mute">
                        取得 <span className="font-mono text-ink/80">{c.got}</span> / {c.total}種類
                      </span>
                    </button>
                    {expanded && (
                      <div className="animate-[fade-in_.16s_ease-out] border-t border-washi-line px-2 py-1.5">
                        {c.members.map((m) => (
                          <div key={m.id} className="flex items-center gap-2 py-1">
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[0.82rem] ${
                              m.obtained ? "border-shu/40 bg-[#fdf3f0]" : "border-washi-line opacity-45 grayscale"
                            }`} aria-hidden>
                              {m.icon}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={`block truncate text-[0.78rem] ${m.obtained ? "font-medium" : "text-sumi-mute"}`}>
                                {m.name}
                              </span>
                              <span className="block text-[0.64rem] text-sumi-mute">
                                {m.obtained ? "✅ 取得済" : "⬜ 未取得"}
                                {m.shrines > 0 && `・関連神社 ${m.shrines.toLocaleString()}社`}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[0.62rem] text-sumi-mute">
              カテゴリをタップすると取得状況の内訳を表示します。
            </p>
          </section>
        )}

        <input
          className="field"
          placeholder={tab === "benefits" ? "御利益・カテゴリで検索" : "祭神名で検索"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="図鑑を検索"
        />

        <section>
          <SectionTitle
            title={tab === "benefits" ? "御利益コレクション" : "祭神図鑑"}
            trailing={<span className="text-[0.74rem] text-sumi-mute">{items.length}件</span>}
          />
          <div className="grid grid-cols-2 gap-2.5 stagger">
            {items.map((item) => {
              const got = Boolean(item.obtainedAt);
              const category = "category" in item ? item.category : null;
              return (
                <div
                  key={item.id}
                  onClick={tab === "deities" ? () => { setShowAllRelated(false); setDeityId(item.id); } : undefined}
                  onKeyDown={tab === "deities" ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowAllRelated(false); setDeityId(item.id); } } : undefined}
                  role={tab === "deities" ? "button" : undefined}
                  tabIndex={tab === "deities" ? 0 : undefined}
                  aria-label={tab === "deities" ? `${item.name}の詳細を見る` : undefined}
                  className={`wa-card p-3 ${got ? "" : "border-dashed bg-transparent opacity-80"} ${tab === "deities" ? "cursor-pointer transition hover:border-shu/50" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mincho text-[0.85rem] ${
                        got ? "border-shu/60 bg-[#fdf3f0] text-shu" : "border-washi-line text-sumi-mute"
                      }`}
                    >
                      {got ? item.name.slice(0, 1) : "？"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mincho truncate text-[0.9rem] font-semibold">{item.name}</p>
                      {category && <p className="text-[0.66rem] text-kin">{category}</p>}
                      {tab === "deities" && (
                        <p className="text-[0.64rem] text-sumi-mute">
                          関連 {deityStats.get(deityGroupId(item.id))?.total ?? 0}社・参拝済 {deityStats.get(deityGroupId(item.id))?.visited ?? 0}社
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[0.7rem] leading-snug text-sumi-mute">
                    {got ? item.description : "参拝すると詳細が解放されます。"}
                  </p>
                  {got ? (
                    <p className="mt-1 text-[0.64rem] text-mori">
                      {formatDate(item.obtainedAt)} 取得
                      {item.shrineNames.length > 0 && `・${item.shrineNames[0]}`}
                    </p>
                  ) : (
                    <p className="mt-1 text-[0.64rem] text-sumi-mute">未取得</p>
                  )}
                </div>
              );
            })}
          </div>
          {items.length === 0 && (
            <p className="wa-card p-4 text-center text-[0.82rem] text-sumi-mute">該当する項目がありません。</p>
          )}
        </section>

        <Link href="/benefits" className="wa-card flex items-center gap-3 px-4 py-3">
          <span className="text-shu" aria-hidden>✦</span>
          <span className="flex-1">
            <span className="block text-[0.86rem] font-semibold">御利益図鑑で願い事からさがす</span>
            <span className="block text-[0.7rem] text-sumi-mute">縁結び・金運・厄除け など19種から神社を探せます</span>
          </span>
          <span className="text-sumi-mute" aria-hidden>›</span>
        </Link>

        <Link href="/shrines" className="btn btn-primary w-full">
          神社をさがして参拝する
        </Link>
        <p className="pb-2 text-center text-[0.68rem] leading-relaxed text-sumi-mute">
          御利益は神社マスタの情報に基づきます。未設定の神社は運営が順次追加します。
        </p>

      {deityDetail && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={`${deityDetail.name}の詳細`}
          onClick={() => setDeityId(null)}
        >
          <div
            className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-washi p-4 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-shu/60 bg-[#fdf3f0] font-mincho text-[1.1rem] text-shu">
                {deityDetail.obtained ? deityDetail.name.slice(0, 1) : "？"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mincho text-[1.12rem] font-semibold leading-tight">{deityDetail.name}</p>
                <p className="mt-0.5 text-[0.72rem] text-kin">{deityDetail.profile.rank}</p>
                <p className="mt-0.5 text-[0.7rem] text-sumi-mute">神徳：{deityDetail.profile.virtue}</p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full border border-washi-line px-2 py-1 text-[0.7rem] text-sumi-mute"
                onClick={() => setDeityId(null)}
                aria-label="閉じる"
              >
                閉じる
              </button>
            </div>

            <p className="mt-3 text-[0.78rem] leading-relaxed text-ink/85">{deityDetail.profile.desc}</p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ["関連神社", `${deityDetail.related.length}社`],
                ["参拝済", `${deityDetail.visitedCount}社`],
                ["参拝率", `${deityDetail.rate}%`],
              ].map(([label, value]) => (
                <div key={label} className="wa-card p-2 text-center">
                  <p className="text-[0.62rem] text-sumi-mute">{label}</p>
                  <p className="font-mono text-[0.9rem] font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <p className="font-mincho mb-2 text-[0.86rem] font-semibold">
                関連神社一覧
                <span className="ml-2 text-[0.66rem] font-normal text-sumi-mute">
                  {deityDetail.obtained ? "参拝済みから表示" : "参拝すると図鑑に登録されます"}
                </span>
              </p>
              <div className="space-y-1.5">
                {deityDetail.related.slice(0, showAllRelated ? undefined : 30).map((r) => (
                  <Link
                    key={r.id}
                    href={`/shrines/${r.id}`}
                    className="wa-card flex items-center gap-2 p-2.5 transition hover:border-shu/50"
                  >
                    <span className={`text-[0.8rem] ${r.visited ? "text-mori" : "text-sumi-mute"}`} aria-hidden>
                      {r.visited ? "✅" : "⬜"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.8rem] font-medium">{r.name}</span>
                      <span className="block truncate text-[0.66rem] text-sumi-mute">
                        {r.prefecture}
                        {r.benefits.length > 0 && `・${r.benefits.slice(0, 2).join("・")}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-[0.7rem] text-sumi-mute" aria-hidden>›</span>
                  </Link>
                ))}
              </div>
              {deityDetail.related.length === 0 && (
                <p className="wa-card p-3 text-center text-[0.76rem] text-sumi-mute">
                  関連神社の登録がありません。
                </p>
              )}
              {!showAllRelated && deityDetail.related.length > 30 && (
                <button type="button" className="btn btn-outline mt-2 w-full" onClick={() => setShowAllRelated(true)}>
                  さらに表示（残り {deityDetail.related.length - 30}社）
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
