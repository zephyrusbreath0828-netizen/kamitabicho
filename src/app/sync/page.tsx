"use client";

/** 同期センター（v1.2）: 未同期件数・最終同期日時・同期実行 */
import Link from "next/link";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useApp } from "@/lib/app-context";
import { formatDateTime } from "@/lib/format";

export default function SyncCenterPage() {
  const { pendingVisits, lastSyncAt, syncNow, syncing, online, shrineById, removeVisit, regionUpdates, applyRegionUpdate } =
    useApp();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    setResult(null);
    if (!online) {
      setError("オフラインです。通信環境を確認してから同期してください。");
      return;
    }
    const outcome = await syncNow();
    if (outcome.failed > 0) {
      setError(`${outcome.synced}件を同期しました。${outcome.failed}件は失敗しました（次回再試行します）。`);
    } else if (outcome.attempted === 0) {
      setResult("未同期の記録はありません。すべて同期済みです。");
    } else {
      setResult(`${outcome.synced}件の参拝記録を同期しました。`);
    }
  };

  return (
    <div>
      <PageHeader title="同期センター" subtitle="オフラインで登録した参拝記録を送信します" backHref="/mypage" eyebrow="SYNC" />

      <div className="space-y-4 px-4 py-4">
        {regionUpdates.length > 0 && (
          <section className="rounded-xl border border-kin/50 bg-[rgba(168,137,79,0.12)] px-3.5 py-3">
            <p className="font-mincho text-[0.92rem] font-semibold text-[#7a5f2c]">
              保存済み地域データの更新があります（{regionUpdates.length}件）
            </p>
            <button
              className="btn btn-outline btn-sm mt-2"
              disabled={!online}
              onClick={() => {
                if (!window.confirm("地域データを最新版に更新しますか？")) return;
                void (async () => {
                  for (const id of regionUpdates) await applyRegionUpdate(id);
                  setResult("地域データを最新版に更新しました。");
                })();
              }}
            >
              更新を適用する
            </button>
          </section>
        )}
        <section className={`wa-card p-4 ${pendingVisits.length > 0 ? "border-kin/50" : ""}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">未同期の参拝記録</p>
              <p className={`stat-value ${pendingVisits.length > 0 ? "text-shu" : ""}`}>
                {pendingVisits.length}
                <span className="ml-1 text-[0.7rem] font-normal text-sumi-mute">件</span>
              </p>
            </div>
            <div className="text-right">
              <p className="stat-label">最終同期日時</p>
              <p className="text-[0.82rem] font-semibold">{lastSyncAt ? formatDateTime(lastSyncAt) : "未同期"}</p>
            </div>
          </div>

          <button className="btn btn-primary mt-3 w-full" onClick={() => void run()} disabled={syncing}>
            {syncing ? "同期しています…" : "今すぐ同期する"}
          </button>

          {!online && (
            <p className="mt-2 rounded-xl border border-kin/40 bg-[rgba(168,137,79,0.1)] px-3 py-2 text-[0.78rem] text-[#7a5f2c]">
              オフラインです。通信が復帰すると自動で同期されます。
            </p>
          )}
          {result && <p className="mt-2 text-[0.82rem] text-mori">✓ {result}</p>}
          {error && <p className="mt-2 text-[0.82rem] text-shu-deep">{error}</p>}
        </section>

        <section>
          <h2 className="font-mincho mb-2 text-[1.02rem] font-semibold">未同期の記録</h2>
          {pendingVisits.length === 0 ? (
            <div className="wa-card px-4 py-6 text-center">
              <p className="font-mincho text-[0.95rem]">すべて同期済みです</p>
              <p className="mt-1 text-[0.78rem] text-sumi-mute">
                オフラインで登録した参拝記録は、通信復帰時に自動で送信されます。
              </p>
            </div>
          ) : (
            <ul className="wa-card divide-y divide-washi-line">
              {pendingVisits.map((p) => {
                const shrine = shrineById(p.shrine_id);
                return (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="badge-demo shrink-0">未同期</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mincho truncate text-[0.9rem] font-semibold">
                        {shrine?.name ?? p.shrine_name}
                      </p>
                      <p className="text-[0.7rem] text-sumi-mute">{formatDateTime(p.visit_datetime)}</p>
                    </div>
                    <button
                      className="shrink-0 text-[0.7rem] text-sumi-mute underline"
                      onClick={() => {
                        if (window.confirm("この未同期の記録を削除しますか？")) void removeVisit(p.id);
                      }}
                    >
                      削除
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Link href="/data" className="wa-card flex items-center gap-3 px-4 py-3">
          <span className="text-kin" aria-hidden>
            ↓
          </span>
          <div className="flex-1">
            <p className="text-[0.9rem] font-semibold">地域データをダウンロード</p>
            <p className="text-[0.72rem] text-sumi-mute">保存した地域はオフラインでも検索できます</p>
          </div>
          <span className="text-sumi-mute" aria-hidden>
            ›
          </span>
        </Link>
      </div>
    </div>
  );
}
