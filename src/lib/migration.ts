"use client";

/**
 * v1.2 データ移行（既存ユーザーのデータを壊さない）
 *
 * 方針:
 *  - 既存ドキュメントの削除・改名は行わない（追加・マージのみ）
 *  - ポイント・収集状態・実績は「履歴から導出」して保存するだけ。既存の値は上書きしない
 *  - 何度実行しても結果が変わらない（冪等）
 *  - 1ステップ失敗しても他のステップと既存データには影響させない
 *
 * 移行内容:
 *  1. visits の status 未設定 = synced として扱う（書き込み不要／読み取り時に補完）
 *  2. users.points に神徳ポイントのスナップショットを保存（履歴から再計算）
 *  3. users.benefits / users.deities に収集済みマップを保存（既存の値を保持してマージ）
 *  4. users.achievements に v1.2 の実績（香川県制覇・四国制覇・全国制覇）を追加マージ
 */
import type { Backend, Deity, Benefit, Goshuin, Shrine, ShrineV2, UserProfile, Visit } from "@/lib/types";
import { computePoints } from "@/lib/points";
import { collectBenefits, collectDeities, toCollectedMap } from "@/lib/collections";

export const CURRENT_SCHEMA_VERSION = 2;
const FLAG_PREFIX = "kamitabicho:migrated:v1.2:";

export type MigrationReport = {
  from: number;
  to: number;
  skipped: boolean;
  /** status 未設定（= synced 扱い）の既存参拝件数 */
  legacyVisits: number;
  points: number;
  benefits: number;
  deities: number;
  errors: string[];
};

function flagKey(uid: string) {
  return `${FLAG_PREFIX}${uid}`;
}

export function migrationDone(uid: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(flagKey(uid)) === String(CURRENT_SCHEMA_VERSION);
}

export function markMigrationDone(uid: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(flagKey(uid), String(CURRENT_SCHEMA_VERSION));
}

type Args = {
  backend: Backend;
  uid: string;
  profile: UserProfile | null;
  visits: Visit[];
  goshuin: Goshuin[];
  shrines: Shrine[];
  shrinesV2: ShrineV2[];
  deities: Deity[];
  benefits: Benefit[];
  unlocked: Record<string, string>;
};

export async function runV12Migration(args: Args): Promise<MigrationReport> {
  const { backend, uid, profile, visits, goshuin, shrines, shrinesV2, deities, benefits, unlocked } = args;
  const from = profile?.schema_version ?? 1;
  const report: MigrationReport = {
    from,
    to: CURRENT_SCHEMA_VERSION,
    skipped: true,
    legacyVisits: visits.filter((v) => !v.status).length,
    points: 0,
    benefits: 0,
    deities: 0,
    errors: [],
  };

  if (from >= CURRENT_SCHEMA_VERSION || migrationDone(uid)) {
    return report;
  }
  report.skipped = false;

  // 1) ポイントのスナップショット（導出値なので既存の付与履歴に影響しない）
  try {
    const points = computePoints(shrines, visits, goshuin);
    await backend.savePoints(uid, {
      total: points.total,
      rank_id: points.rank.id,
      breakdown: points.breakdown,
      updated_at: new Date().toISOString(),
    });
    report.points = points.total;
  } catch (e) {
    report.errors.push(`points: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 2) 図鑑の収集状態（既存の収集記録は保持し、無い項目だけ追加）
  try {
    const benefitSummary = collectBenefits(benefits, shrinesV2, visits);
    const deitySummary = collectDeities(deities, shrinesV2, visits);
    const knownBenefits = profile?.benefits ?? {};
    const knownDeities = profile?.deities ?? {};
    const mergedBenefits = { ...toCollectedMap(benefitSummary), ...knownBenefits };
    const mergedDeities = { ...toCollectedMap(deitySummary), ...knownDeities };
    await backend.saveCollection(uid, "benefits", mergedBenefits);
    await backend.saveCollection(uid, "deities", mergedDeities);
    report.benefits = Object.keys(mergedBenefits).length;
    report.deities = Object.keys(mergedDeities).length;
  } catch (e) {
    report.errors.push(`collections: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 3) 実績（既存の解放日時を保持したまま、新規分だけ追記）
  try {
    if (Object.keys(unlocked).length > 0) {
      await backend.saveAchievements(uid, { ...unlocked, ...(profile?.achievements ?? {}) });
    }
  } catch (e) {
    report.errors.push(`achievements: ${e instanceof Error ? e.message : String(e)}`);
  }

  markMigrationDone(uid);
  return report;
}
