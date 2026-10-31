/**
 * 地方・都道府県ユーティリティ（v1.2）
 * 既存の PREFECTURES（src/data/shrines.ts）はそのまま利用できる。
 */
import { REGIONS, regionOfPrefecture } from "@/data/masters";
import type { RegionId } from "@/lib/types";

/** 八地方区分（仕様の並び順） */
export const REGION_LIST = [...REGIONS].sort((a, b) => a.order - b.order);

/** 地域IDから名前 */
export function regionLabel(id: RegionId | string | undefined): string {
  if (!id) return "全国";
  return REGION_LIST.find((r) => r.id === id)?.name ?? String(id);
}

/** 都道府県が属する地方 */
export function regionForPrefecture(prefecture: string): RegionId {
  return regionOfPrefecture(prefecture);
}

/** 表示用の件数フォーマット（4,200件） */
export function formatCount(n: number): string {
  return `${n.toLocaleString("ja-JP")}件`;
}

/**
 * 現在地から都道府県を推定する（外部APIを使わない方式）
 *
 * 保存済み・同梱の神社データのうち最も近いものの都道府県を採用する。
 * 県境付近では誤差が出るため、UI 側で「変更できます」と明示する。
 */
export function nearestPrefecture(
  position: { latitude: number; longitude: number },
  shrines: Array<{ prefecture: string; latitude: number; longitude: number }>,
): string | null {
  let best: { pref: string; d: number } | null = null;
  for (const s of shrines) {
    // 緯度経度の平面近似（数百kmスケールの比較には十分）
    const dy = (s.latitude - position.latitude) * 111;
    const dx = (s.longitude - position.longitude) * 111 * Math.cos((position.latitude * Math.PI) / 180);
    const d = Math.hypot(dx, dy);
    if (!best || d < best.d) best = { pref: s.prefecture, d };
  }
  return best?.pref ?? null;
}
