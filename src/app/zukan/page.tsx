"use client";

/** 図鑑（v1.2）: 御利益コレクション / 祭神図鑑 */
import { useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { ProgressRing, SectionTitle } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { formatDate } from "@/lib/format";

export default function ZukanPage() {
  const { benefitsCollection, deitiesCollection, benefits, deities, shrines, visitedShrineIds } = useApp();
  const [tab, setTab] = useState<"benefits" | "deities">("benefits");
  const [query, setQuery] = useState("");

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
        const e = m.get(id) ?? { total: 0, visited: 0 };
        e.total += 1;
        if (visited.has(s.id)) e.visited += 1;
        m.set(id, e);
      }
    }
    return m;
  }, [shrines, visitedShrineIds]);

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
                  className={`wa-card p-3 ${got ? "" : "border-dashed bg-transparent opacity-80"}`}
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
                          関連 {deityStats.get(item.id)?.total ?? 0}社・参拝済 {deityStats.get(item.id)?.visited ?? 0}社
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

        <Link href="/shrines" className="btn btn-primary w-full">
          神社をさがして参拝する
        </Link>
        <p className="pb-2 text-center text-[0.68rem] leading-relaxed text-sumi-mute">
          御利益は神社マスタの情報に基づきます。未設定の神社は運営が順次追加します。
        </p>
      </div>
    </div>
  );
}
