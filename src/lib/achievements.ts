/**
 * 参拝実績（アチーブメント）
 *
 * 判定は「神社数・参拝回数・御朱印数・都道府県数」から**純粋関数**で導出する。
 * 解放済みの日時だけを users/{uid}.achievements に保存するため、
 * 将来 v1.3 のランキングや v1.2 の神様カード収集を追加してもデータ構造は変わらない。
 */
import type { Goshuin, Shrine, Visit } from "@/lib/types";

export type AchievementMetric =
  | "shrines" | "visits" | "goshuin" | "prefectures"
  /* v1.2 追加: 制覇系（0/1 のフラグ値） */
  | "kagawa" | "shikoku" | "national";

export type AchievementDef = {
  id: string;
  name: string;
  description: string;
  /** 表示用の一字（絵文字は使わず、和風の漢字1文字で表現） */
  mark: string;
  metric: AchievementMetric;
  target: number;
  /** 特別な実績（全国制覇など）は金色で強調 */
  premium?: boolean;
};

/** 実績定義（仕様の例：初参拝 / 10社 / 50社 / 100社 を含む） */
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_visit", name: "初参拝", description: "はじめての参拝記録を登録しました。", mark: "初", metric: "shrines", target: 1 },
  { id: "shrines_10", name: "十社参拝", description: "10社の神社を参拝しました。", mark: "十", metric: "shrines", target: 10 },
  { id: "shrines_30", name: "三十社参拝", description: "30社の神社を参拝しました。", mark: "卅", metric: "shrines", target: 30 },
  { id: "shrines_50", name: "五十社参拝", description: "50社の神社を参拝しました。", mark: "五", metric: "shrines", target: 50 },
  { id: "shrines_100", name: "百社参拝", description: "全国100社を巡りました。", mark: "百", metric: "shrines", target: 100, premium: true },
  { id: "goshuin_first", name: "御朱印デビュー", description: "はじめての御朱印を記録しました。", mark: "朱", metric: "goshuin", target: 1 },
  { id: "goshuin_10", name: "御朱印十枚", description: "御朱印を10枚集めました。", mark: "印", metric: "goshuin", target: 10 },
  { id: "prefectures_10", name: "十県巡拝", description: "10都道府県の神社を参拝しました。", mark: "国", metric: "prefectures", target: 10 },
  { id: "prefectures_all", name: "全県巡拝", description: "47都道府県すべての神社を参拝しました。", mark: "全", metric: "prefectures", target: 47, premium: true },
  /* v1.2 追加 */
  { id: "kagawa_conquest", name: "香川県制覇", description: "香川県のすべての神社を参拝しました。", mark: "讃", metric: "kagawa", target: 1 },
  { id: "shikoku_conquest", name: "四国制覇", description: "四国4県の神社を参拝しました。", mark: "四", metric: "shikoku", target: 1, premium: true },
  { id: "national_conquest", name: "全国制覇", description: "全国100社すべてを参拝しました。", mark: "覇", metric: "national", target: 1, premium: true },
];

export type AchievementStats = {
  /** 参拝した神社数（重複なし） */
  shrines: number;
  /** 総参拝回数 */
  visits: number;
  /** 御朱印の枚数 */
  goshuin: number;
  /** 参拝した都道府県数 */
  prefectures: number;
  /** 全神社数 */
  totalShrines: number;
  /** 参拝達成率（%） */
  rate: number;
  /* v1.2 追加 */
  /** 香川県を制覇したか（0/1） */
  kagawa: number;
  /** 四国4県を訪れたか（0/1） */
  shikoku: number;
  /** 全国の全神社を制覇したか（0/1） */
  national: number;
  /** 制覇した都道府県の一覧 */
  conqueredPrefectures: string[];
};

/** 統計値の算出（神社マスタとユーザーデータから） */
export function computeStats(shrines: Shrine[], visits: Visit[], goshuin: Goshuin[]): AchievementStats {
  const shrineMap = new Map(shrines.map((s) => [s.id, s]));
  const visited = new Set(visits.map((v) => v.shrine_id));
  const prefs = new Set<string>();
  for (const id of visited) {
    const s = shrineMap.get(id);
    if (s) prefs.add(s.prefecture);
  }
  const total = shrines.length || 100;

  // v1.2: 都道府県制覇（その県の収録神社をすべて参拝）
  const prefTotals = new Map<string, number>();
  const prefDone = new Map<string, number>();
  for (const s of shrines) {
    prefTotals.set(s.prefecture, (prefTotals.get(s.prefecture) ?? 0) + 1);
    if (visited.has(s.id)) prefDone.set(s.prefecture, (prefDone.get(s.prefecture) ?? 0) + 1);
  }
  const conqueredPrefectures = Array.from(prefTotals.entries())
    .filter(([pref, n]) => n > 0 && (prefDone.get(pref) ?? 0) >= n)
    .map(([pref]) => pref);

  const SHIKOKU = ["徳島県", "香川県", "愛媛県", "高知県"];
  const shikokuVisited = SHIKOKU.filter((p) => prefs.has(p)).length;

  return {
    shrines: visited.size,
    visits: visits.length,
    goshuin: goshuin.length,
    prefectures: prefs.size,
    totalShrines: total,
    rate: Math.round((visited.size / total) * 1000) / 10,
    kagawa: conqueredPrefectures.includes("香川県") ? 1 : 0,
    shikoku: shikokuVisited === SHIKOKU.length ? 1 : 0,
    national: visited.size >= total ? 1 : 0,
    conqueredPrefectures,
  };
}

export type AchievementProgress = AchievementDef & {
  value: number;
  unlocked: boolean;
  unlockedAt?: string;
  remaining: number;
  progress: number; // 0-1
};

/** 実績ごとの進捗（解放済み日時は保存済みマップから） */
export function computeAchievements(
  stats: AchievementStats,
  unlocked: Record<string, string> = {},
  _context?: { visits?: unknown[]; shrines?: unknown[] },
): AchievementProgress[] {
  return ACHIEVEMENTS.map((def) => {
    const value = stats[def.metric];
    const reached = value >= def.target;
    return {
      ...def,
      value,
      unlocked: reached || Boolean(unlocked[def.id]),
      unlockedAt: unlocked[def.id],
      remaining: Math.max(0, def.target - value),
      progress: Math.min(1, def.target === 0 ? 1 : value / def.target),
    };
  });
}

/** 新たに解放された実績のIDと日時を返す（保存用） */
export function newlyUnlocked(
  progress: AchievementProgress[],
  unlocked: Record<string, string> = {},
): Record<string, string> {
  const now = new Date().toISOString();
  const next = { ...unlocked };
  for (const p of progress) {
    if (p.unlocked && !next[p.id]) next[p.id] = now;
  }
  return next;
}

/** 直近に解放された実績（マイページのハイライト用） */
export function latestUnlocked(progress: AchievementProgress[]): AchievementProgress | null {
  const list = progress.filter((p) => p.unlockedAt).sort((a, b) => (a.unlockedAt! < b.unlockedAt! ? 1 : -1));
  return list[0] ?? progress.find((p) => p.unlocked) ?? null;
}
