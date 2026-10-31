"use client";

/**
 * データ管理（v1.2）
 * 地域ごとの神社データを端末（IndexedDB）へ保存し、オフライン検索を可能にする。
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { useApp } from "@/lib/app-context";
import { formatDateTime } from "@/lib/format";
import { formatCount, REGION_LIST } from "@/lib/regions";
import type { RegionId } from "@/lib/types";

export default function DataManagementPage() {
  const { downloads, regions, downloadRegion, removeRegionData, localShrineTotal, lastSyncAt, online } = useApp();
  const [busy, setBusy] = useState<RegionId | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadedIds = useMemo(() => new Set(downloads.map((d) => d.region_id)), [downloads]);

  const runDownload = async (regionId: RegionId, name: string) => {
    setBusy(regionId);
    setError(null);
    setMessage(null);
    try {
      if (!online) throw new Error("オフラインのためダウンロードできません。通信環境をご確認ください。");
      const count = await downloadRegion(regionId);
      setMessage(`${name}の神社データ ${formatCount(count)} を端末に保存しました。`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ダウンロードに失敗しました。");
    } finally {
      setBusy(null);
    }
  };

  const runRemove = async (regionId: RegionId, name: string) => {
    if (!window.confirm(`${name}の保存済みデータを端末から削除しますか？（参拝記録は削除されません）`)) return;
    setBusy(regionId);
    setError(null);
    setMessage(null);
    try {
      await removeRegionData(regionId);
      setMessage(`${name}の保存データを削除しました。`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました。");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="データ管理"
        subtitle="地域データを端末に保存して、オフラインでも検索できます"
        backHref="/mypage"
        eyebrow="OFFLINE DATA"
      />

      <div className="space-y-4 px-4 py-4">
        <section className="wa-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">端末に保存済み</p>
              <p className="stat-value">
                {localShrineTotal.toLocaleString("ja-JP")}
                <span className="ml-1 text-[0.7rem] font-normal text-sumi-mute">社</span>
              </p>
            </div>
            <div className="text-right">
              <p className="stat-label">最終同期</p>
              <p className="text-[0.82rem] font-semibold">
                {lastSyncAt ? formatDateTime(lastSyncAt) : "未同期"}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[0.76rem] leading-relaxed text-sumi-mute">
            保存した地域は、電波の届かない場所でも検索・閲覧できます。参拝記録はオフラインでも登録でき、
            通信復帰時に自動で同期されます。
          </p>
          <Link href="/sync" className="btn btn-outline btn-sm mt-3 w-full">
            同期センターを開く
          </Link>
        </section>

        {(message || error) && (
          <p
            className={`rounded-xl border px-3 py-2 text-[0.82rem] leading-snug ${
              error ? "border-shu/30 bg-[#fdf1ef] text-shu-deep" : "border-mori/30 bg-[rgba(70,96,74,0.1)] text-mori"
            }`}
          >
            {error ?? message}
          </p>
        )}

        {!online && (
          <p className="rounded-xl border border-kin/40 bg-[rgba(168,137,79,0.1)] px-3 py-2 text-[0.8rem] text-[#7a5f2c]">
            オフラインです。ダウンロードは通信復帰後に行えます（保存済みデータの閲覧・削除は可能です）。
          </p>
        )}

        <section>
          <h2 className="font-mincho mb-2 text-[1.02rem] font-semibold">地域を選んでダウンロード</h2>
          <ul className="space-y-2">
            {REGION_LIST.map((region) => {
              const info = regions.find((r) => r.id === region.id);
              const count = info?.shrine_count ?? 0;
              const saved = downloads.find((d) => d.region_id === region.id);
              const isDownloaded = downloadedIds.has(region.id);
              const isBusy = busy === region.id;
              return (
                <li key={region.id} className="wa-card flex items-center gap-3 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-washi-line bg-washi-deep/40 font-mincho text-[0.9rem] text-kin">
                    {region.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mincho text-[0.96rem] font-semibold">{region.name}</p>
                    <p className="text-[0.72rem] text-sumi-mute">
                      {formatCount(count)}
                      {saved && ` ・ 保存済み ${formatCount(saved.shrine_count)}`}
                    </p>
                    {saved && (
                      <p className="text-[0.66rem] text-mori">
                        最終同期 {formatDateTime(saved.last_synced_at)}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      className={`btn btn-sm ${isDownloaded ? "btn-outline" : "btn-primary"}`}
                      onClick={() => void runDownload(region.id, region.name)}
                      disabled={isBusy || !online}
                    >
                      {isBusy ? "処理中…" : isDownloaded ? "更新" : "保存"}
                    </button>
                    {isDownloaded && (
                      <button
                        className="text-[0.68rem] text-sumi-mute underline"
                        onClick={() => void runRemove(region.id, region.name)}
                        disabled={isBusy}
                      >
                        削除
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <p className="pb-2 text-center text-[0.68rem] leading-relaxed text-sumi-mute">
          件数はマスタに収録されている神社数です。地域の追加はマスタ投入だけで可能です。
        </p>
      </div>
    </div>
  );
}
