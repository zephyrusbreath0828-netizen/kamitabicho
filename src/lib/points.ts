/**
 * 神徳ポイント・ランク（v1.2）
 *
 * 設計: ポイントは **保存値ではなく導出値**。
 * visits / goshuin / 神社マスタから毎回計算するため、
 * 既存ユーザーにも遡って正しく付与され、二重付与が起こらない。
 * 表示用に users/{uid}.points へスナップショットを保存する（既存フィールドは触らない）。
 */
import type { Goshuin, PointBreakdown, RankDef, ShrineV2, Visit } from "@/lib/types";

/** 獲得ルール（仕様の例に準拠） */
export const POINT_RULES = {
  visit: 100,
  goshuin: 50,
  newPrefecture: 300,
  /** 都道府県制覇（全神社を参拝） */
  prefectureConquest: 500,
  /** 四国制覇（4県すべて） */
  shikokuConquest: 2000,
  /** 全国制覇 */
  nationalConquest: 10000,
} as const;

/** ランク定義（昇順） */
export const RANKS: Array<{ id: string; name: string; min: number }> = [
  { id: "novice", name: "見習い参拝者", min: 0 },
  { id: "pilgrim", name: "巡礼者", min: 1000 },
  { id: "advanced", name: "上級巡礼者", min: 5000 },
  { id: "kamisama", name: "神使い", min: 15000 },
  { id: "master", name: "神旅マスター", min: 30000 },
];

export const SHIKOKU_PREFECTURES = ["徳島県", "香川県", "愛媛県", "高知県"];

export type PointsResult = {
  total: number;
  breakdown: PointBreakdown;
  rank: RankDef;
  nextRank: { name: string; min: number; remaining: number; progress: number } | null;
  /** 制覇した都道府県 */
  conqueredPrefectures: string[];
  shikokuConquered: boolean;
  nationalConquered: boolean;
};

/**
 * 参拝記録からポイントを算出する。
 * @param shrines 全神社マスタ（都道府県の判定に使用）
 */
export function computePoints(shrines: ShrineV2[], visits: Visit[], goshuin: Goshuin[]): PointsResult {
  const shrinesById = new Map(shrines.map((s) => [s.id, s]));
  const visitedIds = Array.from(new Set(visits.map((v) => v.shrine_id)));

  const visitedPrefs = new Set<string>();
  for (const id of visitedIds) {
    const s = shrinesById.get(id);
    if (s) visitedPrefs.add(s.prefecture);
  }

  // 都道府県制覇: その県の全収録神社を参拝済みか
  const conqueredPrefectures: string[] = [];
  const prefsInMaster = Array.from(new Set(shrines.map((s) => s.prefecture)));
  for (const pref of prefsInMaster) {
    const total = shrines.filter((s) => s.prefecture === pref).length;
    const done = shrines.filter((s) => s.prefecture === pref && visitedIds.includes(s.id)).length;
    if (total > 0 && done >= total) conqueredPrefectures.push(pref);
  }

  const shikokuConquered = SHIKOKU_PREFECTURES.every((p) => visitedPrefs.has(p));
  const nationalConquered = prefsInMaster.length > 0 && visitedPrefs.size >= prefsInMaster.length;

  const breakdown: PointBreakdown = {
    visits: visits.length * POINT_RULES.visit,
    goshuin: goshuin.length * POINT_RULES.goshuin,
    prefectures: visitedPrefs.size * POINT_RULES.newPrefecture,
    conquest:
      conqueredPrefectures.length * POINT_RULES.prefectureConquest +
      (shikokuConquered ? POINT_RULES.shikokuConquest : 0) +
      (nationalConquered ? POINT_RULES.nationalConquest : 0),
    total: 0,
  };
  breakdown.total = breakdown.visits + breakdown.goshuin + breakdown.prefectures + breakdown.conquest;

  const rankIndex = Math.max(
    0,
    RANKS.findLastIndex((r) => breakdown.total >= r.min),
  );
  const current = RANKS[rankIndex];
  const next = RANKS[rankIndex + 1];
  const rank: RankDef = {
    id: current.id,
    name: current.name,
    min: current.min,
    next: next ? { name: next.name, remaining: Math.max(0, next.min - breakdown.total) } : undefined,
  };

  return {
    total: breakdown.total,
    breakdown,
    rank,
    nextRank: next
      ? {
          name: next.name,
          min: next.min,
          remaining: Math.max(0, next.min - breakdown.total),
          progress: Math.min(1, (breakdown.total - current.min) / Math.max(1, next.min - current.min)),
        }
      : null,
    conqueredPrefectures,
    shikokuConquered,
    nationalConquered,
  };
}

/** 次ポイントまでの進捗（0-1） */
export function rankProgress(result: PointsResult): number {
  if (!result.nextRank) return 1;
  return result.nextRank.progress;
}

/** ポイント内訳の表示用ラベル */
export const POINT_LABELS: Array<{ key: keyof PointBreakdown; label: string; unit: string }> = [
  { key: "visits", label: "参拝", unit: "回" },
  { key: "goshuin", label: "御朱印", unit: "枚" },
  { key: "prefectures", label: "新都道府県", unit: "県" },
  { key: "conquest", label: "制覇ボーナス", unit: "" },
];
