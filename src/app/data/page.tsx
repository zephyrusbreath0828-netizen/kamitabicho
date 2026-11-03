"use client";

/**
 * 神社データ管理（v1.2-beta）
 *
 * 地域単位で神社データをダウンロードし、端末（IndexedDB）へ保存する。
 * 状態は「未取得 / 取得済み / 更新あり / ダウンロード中 / エラー」の5種類。
 *
 * - 保存先は IndexedDB（Dexie）。状態は localStorage にもミラーして起動時に復元する
 * - 削除は地域キャッシュのみ。参拝履歴・御朱印・お気に入り・実績・ポイントには触れない
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { useApp } from "@/lib/app-context";
import { formatDateTime } from "@/lib/format";
import { readRegionStates, type SavedRegionState } from "@/lib/local-db";
import { REGION_LIST, regionLabel } from "@/lib/regions";
import { packCount } from "@/data/packs";
import type { RegionId } from "@/lib/types";

type State = "none" | "saved" | "update" | "downloading" | "error";

const STATE_LABEL: Record<State, string> = {
  none: "未取得",
  saved: "取得済み",
  update: "更新あり",
  downloading: "ダウンロード中",
  error: "エラー",
};

const STATE_CLASS: Record<State, string> = {
  none: "border-washi-line text-sumi-mute",
  saved: "border-mori/40 bg-[rgba(70,96,74,0.12)] text-mori",
  update: "border-kin/50 bg-[rgba(168,137,79,0.14)] text-[#7a5f2c]",
  downloading: "border-shu/30 bg-[#fdf3f0] text-shu",
  error: "border-shu/40 bg-[#fdf1ef] text-shu-deep",
};

export default function ShrineDataPage() {
  const { downloads, downloadRegion, removeRegionData, regionUpdates, lastSyncAt, online, ready, regions } = useApp();

  // Firestore の regions を正とし、未取得時は同梱定義へフォールバック（アプリ更新なしで地域追加可能）
  const REGIONS_VIEW = useMemo(
    () =>
      (regions.length ? regions : REGION_LIST)
        .slice()
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
        .map((r) => ({
          ...r,
          name: r.name || regionLabel(r.id),
          // 神社数はパック JSON の件数を正とする（regions.json の固定値に依存しない）
          shrine_count: r.id ? (packCount(r.id) || r.shrine_count || 0) : (r.shrine_count ?? 0),
        })),
    [regions],
  );
  const [mirror, setMirror] = useState<Record<string, SavedRegionState>>({});
  const [busy, setBusy] = useState<RegionId[]>([]);
  const [errors, setErrors] = useState<RegionId[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);

  // 起動時: localStorage のミラーを読み込み、IndexedDB の内容で上書きする
  useEffect(() => {
    setMirror(readRegionStates());
  }, [ready]);

  const saved = useMemo(() => {
    const list = new Map<string, { shrine_count: number; version: number; saved_at: string }>();
    for (const [id, st] of Object.entries(mirror)) list.set(id, st);
    for (const d of downloads) {
      list.set(d.region_id, { shrine_count: d.shrine_count, version: d.version ?? 1, saved_at: d.last_synced_at });
    }
    return list;
  }, [mirror, downloads]);

  const stateOf = useCallback(
    (regionId: RegionId): State => {
      if (busy.includes(regionId)) return "downloading";
      if (errors.includes(regionId)) return "error";
      if (!saved.has(regionId)) return "none";
      if (regionUpdates.includes(regionId)) return "update";
      return "saved";
    },
    [busy, errors, saved, regionUpdates],
  );

  const runDownload = useCallback(
    async (regionId: RegionId) => {
      setErrors((prev) => prev.filter((id) => id !== regionId));
      setBusy((prev) => [...prev, regionId]);
      try {
        if (!online) throw new Error("オフラインです。通信環境をご確認ください。");
        await downloadRegion(regionId);
        setMirror(readRegionStates());
        return true;
      } catch (e) {
        setErrors((prev) => [...prev, regionId]);
        setMessage(e instanceof Error ? e.message : "ダウンロードに失敗しました。");
        return false;
      } finally {
        setBusy((prev) => prev.filter((id) => id !== regionId));
      }
    },
    [downloadRegion, online],
  );

  const runRemove = useCallback(
    async (regionId: RegionId) => {
      setErrors((prev) => prev.filter((id) => id !== regionId));
      setBusy((prev) => [...prev, regionId]);
      try {
        await removeRegionData(regionId);
        setMirror(readRegionStates());
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "削除に失敗しました。");
      } finally {
        setBusy((prev) => prev.filter((id) => id !== regionId));
      }
    },
    [removeRegionData],
  );

  const downloadAll = async () => {
    if (!window.confirm("すべての地域の神社データをダウンロードします。よろしいですか？")) return;
    setBulk(true);
    setMessage(null);
    let ok = 0;
    let ng = 0;
    for (const region of REGION_LIST) {
      if (stateOf(region.id) === "saved") {
        ok += 1;
        continue;
      }
      const result = await runDownload(region.id);
      if (result) ok += 1;
      else ng += 1;
    }
    setBulk(false);
    setMessage(
      ng === 0
        ? `全${REGIONS_VIEW.length}地域のデータを端末に保存しました（${ok}地域）。`
        : `${ok}地域を保存しました。${ng}地域は失敗しました。`,
    );
  };

  const removeAll = async () => {
    if (
      !window.confirm(
        "端末に保存したすべての地域データを削除しますか？\n\n参拝履歴・御朱印・お気に入り・実績・神徳ポイントは削除されません。",
      )
    )
      return;
    setBulk(true);
    setMessage(null);
    for (const region of REGION_LIST) {
      if (stateOf(region.id) === "none") continue;
      await runRemove(region.id);
    }
    setBulk(false);
    setMessage("端末に保存した地域データをすべて削除しました（参拝記録などはそのまま残ります）。");
  };

  const savedCount = REGIONS_VIEW.filter((r) => stateOf(r.id) !== "none").length;
  const canBulk = online && !bulk;

  return (
    <div>
      <PageHeader
        title="神社データ管理"
        subtitle="神社データを地域単位でダウンロードできます。"
        backHref="/mypage"
        eyebrow="SHRINE DATA"
      />

      <div className="space-y-4 px-4 py-4">
        <section className="wa-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">取得済みの地域</p>
              <p className="stat-value">
                {savedCount}
                <span className="ml-1 text-[0.7rem] font-normal text-sumi-mute">/ {REGIONS_VIEW.length} 地域</span>
              </p>
            </div>
            <div className="text-right">
              <p className="stat-label">最終同期</p>
              <p className="text-[0.82rem] font-semibold">{lastSyncAt ? formatDateTime(lastSyncAt) : "未同期"}</p>
            </div>
          </div>
          <p className="mt-2 text-[0.76rem] leading-relaxed text-sumi-mute">
            ダウンロードした地域は、電波の届かない場所でも検索・閲覧できます。保存先は端末内（IndexedDB）です。
          </p>
          <Link href="/sync" className="btn btn-outline btn-sm mt-3 w-full">
            同期センターを開く
          </Link>
        </section>

        {message && (
          <p className="rounded-xl border border-mori/30 bg-[rgba(70,96,74,0.1)] px-3 py-2 text-[0.82rem] leading-snug text-mori">
            {message}
          </p>
        )}
        {!online && (
          <p className="rounded-xl border border-kin/40 bg-[rgba(168,137,79,0.1)] px-3 py-2 text-[0.8rem] text-[#7a5f2c]">
            オフラインです。ダウンロードは通信復帰後に行えます（取得済みデータの削除は可能です）。
          </p>
        )}

        <section>
          <h2 className="font-mincho mb-2 text-[1.02rem] font-semibold">地域一覧</h2>
          <ul className="space-y-2.5">
            {REGIONS_VIEW.map((region) => {
              const state = stateOf(region.id);
              const info = saved.get(region.id);
              const count = region.shrine_count ?? 0;
              // パック JSON が無く、配布状態も preparing の地域は「準備中」
              // パック JSON が存在しない地域は配布前（準備中）として扱う
              const preparing = count === 0 || region.release === "preparing";
              return (
                <li key={region.id} className="wa-card p-3.5" data-region={region.id} data-state={state}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-washi-line bg-washi-deep/40 font-mincho text-[0.9rem] text-kin">
                      {region.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mincho text-[1rem] font-semibold">{region.name}</p>

                      <div className="mt-1.5 flex items-baseline gap-1.5">
                        <span className="text-[0.68rem] text-sumi-mute">神社数</span>
                        <span className="font-mincho text-[0.98rem] font-semibold text-sumi">
                          {count.toLocaleString("ja-JP")}
                          <span className="ml-0.5 text-[0.68rem] font-normal text-sumi-mute">件</span>
                        </span>
                        <span className="text-[0.64rem] text-sumi-mute">v{region.version ?? 1}</span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold ${STATE_CLASS[state]}`}>
                          {STATE_LABEL[state]}
                        </span>
                        {info && state !== "downloading" && (
                          <span className="text-[0.64rem] text-sumi-mute">
                            保存 {info.shrine_count.toLocaleString("ja-JP")}件・{formatDateTime(info.saved_at)}
                          </span>
                        )}
                        {state === "error" && (
                          <span className="text-[0.64rem] text-shu-deep">通信状況を確認して再度お試しください</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex gap-2">
                    {preparing ? (
                      <span className="chip chip-btn flex-1 cursor-default justify-center text-sumi-mute">準備中</span>
                    ) : (
                      <button
                        className={`btn btn-sm flex-1 ${state === "saved" || state === "update" ? "btn-outline" : "btn-primary"}`}
                        onClick={() => void runDownload(region.id)}
                        disabled={state === "downloading" || bulk || !online || preparing}
                        aria-label={`${region.name}をダウンロード`}
                      >
                        {state === "downloading"
                          ? "ダウンロード中…"
                          : state === "update"
                            ? "更新する"
                            : state === "saved"
                              ? "再ダウンロード"
                              : state === "error"
                                ? "再試行"
                                : "ダウンロード"}
                      </button>
                    )}

                    {state !== "none" && state !== "downloading" && (
                      <button
                        className="btn btn-sm btn-outline px-3"
                        onClick={() => void runRemove(region.id)}
                        disabled={bulk}
                        aria-label={`${region.name}の保存データを削除`}
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

        <section className="wa-card p-3.5">
          <h2 className="font-mincho mb-2 text-[0.96rem] font-semibold">一括操作</h2>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-primary flex-1" onClick={() => void downloadAll()} disabled={!canBulk}>
              {bulk ? "処理中…" : "全件取得"}
            </button>
            <button className="btn btn-sm btn-outline flex-1" onClick={() => void removeAll()} disabled={bulk}>
              {bulk ? "処理中…" : "全件削除"}
            </button>
          </div>
          <p className="mt-2 text-[0.68rem] leading-relaxed text-sumi-mute">
            全件削除は端末に保存した地域データのみを対象とします。参拝履歴・御朱印・お気に入り・実績・神徳ポイント・
            ユーザー情報は削除されません。
          </p>
        </section>

        <p className="pb-2 text-center text-[0.68rem] leading-relaxed text-sumi-mute">
          実証版のため、神社数は現在マスタに収録されている件数を表示しています。
          地域の追加はマスタ投入だけで可能です。
        </p>
      </div>
    </div>
  );
}
