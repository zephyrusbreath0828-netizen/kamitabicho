"use client";

/**
 * オフライン参拝記録の同期（v1.2）
 *
 * 流れ:
 *   圏外で登録 → IndexedDB に status="pending" で保存
 *   通信復帰 → Firestore へ書き込み（同じ ID で冪等）→ status="synced" → ローカルから削除
 *
 * 既存の visits ドキュメントには status が無いが、
 * 「未設定 = synced」として扱うため既存データの移行は不要。
 */
import { listPendingVisits, removePending } from "@/lib/local-db";
import type { Backend, PendingVisit } from "@/lib/types";

export type SyncOutcome = {
  attempted: number;
  synced: number;
  failed: number;
  errors: string[];
};

/**
 * 未同期の参拝記録を送信する。
 * 1件ずつ処理し、失敗したものはローカルに残す（次回再試行）。
 */
export async function flushPendingVisits(backend: Backend, uid: string): Promise<SyncOutcome> {
  const pending = await listPendingVisits();
  const outcome: SyncOutcome = { attempted: pending.length, synced: 0, failed: 0, errors: [] };

  for (const p of pending) {
    try {
      await backend.addVisit({
        id: p.id, // 冪等: 同じ ID で再送しても重複しない
        user_id: uid,
        shrine_id: p.shrine_id,
        latitude: p.latitude,
        longitude: p.longitude,
        distance_m: p.distance_m,
        visit_datetime: p.visit_datetime,
        status: "synced",
      });
      await removePending(p.id);
      outcome.synced += 1;
    } catch (e) {
      outcome.failed += 1;
      if (outcome.errors.length < 3) {
        outcome.errors.push(e instanceof Error ? e.message : String(e));
      }
    }
  }
  return outcome;
}

/** pending を「画面表示用の Visit」に変換する */
export function pendingToVisit(p: PendingVisit) {
  return {
    id: p.id,
    user_id: p.user_id,
    shrine_id: p.shrine_id,
    visit_datetime: p.visit_datetime,
    latitude: p.latitude,
    longitude: p.longitude,
    distance_m: p.distance_m,
    created_at: p.created_at,
    status: "pending" as const,
  };
}
