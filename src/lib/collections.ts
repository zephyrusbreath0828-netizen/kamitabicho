/**
 * 御利益コレクション / 祭神図鑑（v1.2）
 *
 * 参拝した神社のマスタ情報から **導出** する。
 * そのため既存ユーザーも、過去の参拝履歴から自動的に収集済みになる（追加の移行不要）。
 */
import { BENEFIT_BY_ID, DEITY_BY_ID } from "@/data/masters";
import type { Benefit, Deity, ShrineV2, Visit } from "@/lib/types";

export type CollectedBenefit = Benefit & { obtainedAt: string; shrineNames: string[] };
export type CollectedDeity = Deity & { obtainedAt: string; shrineNames: string[] };

export type CollectionSummary<T> = {
  items: T[];
  /** 取得済み数 */
  collected: number;
  /** マスタ総数 */
  total: number;
  /** コンプリート率（0-100, 小数1桁） */
  rate: number;
};

function firstVisitMap(visits: Visit[]): Map<string, { at: string; shrineId: string }> {
  const map = new Map<string, { at: string; shrineId: string }>();
  for (const v of visits) {
    const when = v.visit_datetime ?? v.created_at ?? "";
    const prev = map.get(v.shrine_id);
    if (!prev || when < prev.at) map.set(v.shrine_id, { at: when, shrineId: v.shrine_id });
  }
  return map;
}

function build<T extends { id: string }>(
  master: T[],
  shrines: ShrineV2[],
  visits: Visit[],
  pick: (s: ShrineV2) => string[] | undefined,
): CollectionSummary<T & { obtainedAt: string; shrineNames: string[] }> {
  const byId = new Map(shrines.map((s) => [s.id, s]));
  const firstVisit = firstVisitMap(visits);
  const acc = new Map<string, { at: string; shrines: Set<string> }>();

  for (const [shrineId, info] of firstVisit) {
    const shrine = byId.get(shrineId);
    if (!shrine) continue;
    for (const itemId of pick(shrine) ?? []) {
      const prev = acc.get(itemId);
      if (!prev) acc.set(itemId, { at: info.at, shrines: new Set([shrine.name]) });
      else {
        prev.shrines.add(shrine.name);
        if (info.at < prev.at) prev.at = info.at;
      }
    }
  }

  const items = master
    .filter((m) => acc.has(m.id))
    .map((m) => {
      const info = acc.get(m.id)!;
      return { ...m, obtainedAt: info.at, shrineNames: Array.from(info.shrines) };
    })
    .sort((a, b) => (a.obtainedAt < b.obtainedAt ? 1 : -1));

  return {
    items,
    collected: items.length,
    total: master.length,
    rate: master.length ? Math.round((items.length / master.length) * 1000) / 10 : 0,
  };
}

/** 御利益コレクション */
export function collectBenefits(master: Benefit[], shrines: ShrineV2[], visits: Visit[]) {
  const known = master.length ? master : Array.from(BENEFIT_BY_ID.values());
  return build(known, shrines, visits, (s) => s.benefits);
}

/** 祭神図鑑 */
export function collectDeities(master: Deity[], shrines: ShrineV2[], visits: Visit[]) {
  const known = master.length ? master : Array.from(DEITY_BY_ID.values());
  return build(known, shrines, visits, (s) => s.deities);
}

/** 収集済みマップ（users/{uid}.deities / .benefits に保存する形） */
export function toCollectedMap(
  summary: CollectionSummary<{ id: string; obtainedAt: string }>,
): Record<string, string> {
  return Object.fromEntries(summary.items.map((i) => [i.id, i.obtainedAt]));
}
