"use client";

/**
 * 地域パック管理（管理者）
 *
 * 神旅帳本体を更新せずに、神社データだけを追加・更新・無効化・削除する。
 * JSON を選択または貼り付けて登録するだけで、利用者の「神社データ管理」に現れる。
 * npm の実行は不要（すべてブラウザ内で完結）。
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { useApp } from "@/lib/app-context";
import { formatDateTime } from "@/lib/format";
import {
  listLocalPacks,
  listRegisteredPacks,
  logPackAction,
  parsePack,
  registerPack,
  removeLocalPack,
  removePack,
  saveLocalPack,
  setPackEnabled,
  type LocalPack,
  type RegionPack,
} from "@/lib/region-packs";
import type { Region } from "@/lib/types";

type Row = { region: string; name: string; version: number; shrine_count: number; updated_at?: string; release?: string };

export default function AdminPacksPage() {
  const { user, mode, ready } = useApp();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<RegionPack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  const isFirebase = mode === "firebase";

  const load = async () => {
    const remote = isFirebase ? await listRegisteredPacks().catch(() => [] as Region[]) : [];
    const local: LocalPack[] = listLocalPacks();
    const merged: Row[] = [
      ...remote.map((r) => ({
        region: r.id,
        name: r.name ?? r.id,
        version: r.version ?? 1,
        shrine_count: r.shrine_count ?? 0,
        updated_at: r.updated_at,
        release: r.release ?? "available",
      })),
    ];
    for (const l of local) {
      if (!merged.some((m) => m.region === l.region)) {
        merged.push({
          region: l.region,
          name: l.name,
          version: l.version,
          shrine_count: l.shrine_count,
          updated_at: l.updated_at,
          release: "available",
        });
      }
    }
    setRows(merged.sort((a, b) => a.region.localeCompare(b.region)));
  };

  useEffect(() => {
    if (!ready) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isFirebase]);

  const onFile = async (file: File) => {
    setError(null);
    setParsed(null);
    const body = await file.text();
    setText(body);
    try {
      setParsed(parsePack(body));
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSON を読み取れませんでした。");
    }
  };

  const onParse = () => {
    setError(null);
    setMessage(null);
    try {
      setParsed(parsePack(text));
    } catch (e) {
      setParsed(null);
      setError(e instanceof Error ? e.message : "JSON を読み取れませんでした。");
    }
  };

  const onRegister = async (enabled: boolean) => {
    if (!parsed) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (isFirebase) await registerPack(parsed, { enabled });
      saveLocalPack(parsed, enabled);
      logPackAction(user?.uid ?? "local", "register", parsed.region, `${parsed.shrines.length}件 v${parsed.version}`);
      setMessage(
        `${parsed.name ?? parsed.region}（${parsed.shrines.length}件・v${parsed.version}）を登録しました。利用者の神社データ管理に表示されます。`,
      );
      setParsed(null);
      setText("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  const onToggle = async (row: Row) => {
    const enable = row.release === "disabled";
    try {
      if (isFirebase) await setPackEnabled(row.region, enable);
      const local = listLocalPacks().find((l) => l.region === row.region);
      if (local) {
        saveLocalPack(
          { region: local.region, name: local.name, version: local.version, shrines: [] },
          enable,
        );
      }
      logPackAction(user?.uid ?? "local", enable ? "enable" : "disable", row.region, "");
      setMessage(`${row.name}を${enable ? "有効化" : "無効化"}しました。`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "変更に失敗しました。");
    }
  };

  const onDelete = async (row: Row) => {
    if (!window.confirm(`${row.name}のパックを削除しますか？\n\n端末のキャッシュと配布データのみ削除します。利用者の参拝履歴・御朱印・お気に入りは削除されません。`)) return;
    try {
      if (isFirebase) await removePack(row.region);
      removeLocalPack(row.region);
      logPackAction(user?.uid ?? "local", "delete", row.region, "");
      setMessage(`${row.name}のパックを削除しました。`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました。");
    }
  };

  const preview = useMemo(() => (parsed ? parsed.shrines.slice(0, 3) : []), [parsed]);

  return (
    <div>
      <PageHeader title="地域パック管理" subtitle="JSON を登録するだけで、アプリを更新せずに地域データを追加できます" backHref="/mypage" eyebrow="ADMIN" />

      <div className="space-y-4 px-4 py-4">
        {!isFirebase && (
          <p className="rounded-xl border border-kin/40 bg-[rgba(168,137,79,0.1)] px-3 py-2 text-[0.8rem] leading-snug text-[#7a5f2c]">
            現在はデモモードです。登録内容はこの端末内に保存されます（Firebase 接続時は Firestore に登録されます）。
          </p>
        )}

        <section className="wa-card p-4">
          <h2 className="font-mincho mb-2 text-[1.02rem] font-semibold">パックを登録</h2>
          <p className="mb-2 text-[0.74rem] leading-relaxed text-sumi-mute">
            形式: <code className="text-[0.7rem]">{`{ region, version, shrine_count, updated_at, shrines: [{ name, prefecture, city, address, latitude, longitude }] }`}</code>
          </p>

          <label className="btn btn-outline btn-sm mb-2 block w-full cursor-pointer text-center">
            JSON ファイルを選択
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
          </label>

          <textarea
            className="field min-h-[140px] font-mono text-[0.72rem]"
            placeholder='{"region":"kinki","name":"近畿地方","version":1,"shrines":[...]}'
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="パックJSON"
          />

          <div className="mt-2 flex gap-2">
            <button className="btn btn-sm btn-outline flex-1" onClick={onParse} disabled={!text.trim() || busy}>
              内容を確認
            </button>
            <button className="btn btn-sm btn-primary flex-1" onClick={() => void onRegister(true)} disabled={!parsed || busy}>
              {busy ? "登録中…" : "登録する"}
            </button>
          </div>

          {error && <p className="mt-2 rounded-lg border border-shu/30 bg-[#fdf1ef] px-2.5 py-2 text-[0.78rem] text-shu-deep">{error}</p>}
          {message && <p className="mt-2 rounded-lg border border-mori/30 bg-[rgba(70,96,74,0.1)] px-2.5 py-2 text-[0.78rem] text-mori">{message}</p>}

          {parsed && (
            <div className="mt-3 rounded-lg border border-washi-line bg-washi-deep/30 p-2.5 text-[0.74rem]">
              <p>
                <span className="text-sumi-mute">region</span> {parsed.region}
                <span className="ml-2 text-sumi-mute">version</span> {parsed.version}
                <span className="ml-2 text-sumi-mute">件数</span> {parsed.shrines.length}
              </p>
              {preview.map((s) => (
                <p key={`${s.name}-${s.latitude}`} className="truncate text-sumi-mute">
                  ・{s.prefecture} {s.name}（{s.latitude.toFixed(3)}, {s.longitude?.toFixed(3)}）
                </p>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-mincho mb-2 text-[1.02rem] font-semibold">登録済みパック</h2>
          {rows.length === 0 ? (
            <p className="wa-card px-4 py-6 text-center text-[0.82rem] text-sumi-mute">登録済みのパックはありません。</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((row) => (
                <li key={row.region} className="wa-card p-3" data-pack={row.region}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-mincho text-[0.96rem] font-semibold">{row.name}</p>
                      <p className="text-[0.7rem] text-sumi-mute">
                        {row.region}・{row.shrine_count.toLocaleString("ja-JP")}件・v{row.version}
                        {row.release === "disabled" && "・無効"}
                      </p>
                      {row.updated_at && <p className="text-[0.66rem] text-sumi-mute">更新 {formatDateTime(row.updated_at)}</p>}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button className="btn btn-xs btn-outline" onClick={() => void onToggle(row)}>
                        {row.release === "disabled" ? "有効化" : "無効化"}
                      </button>
                      <button className="btn btn-xs btn-outline text-shu-deep" onClick={() => void onDelete(row)}>
                        削除
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link href="/data" className="btn btn-outline w-full">
          利用者側の「神社データ管理」を開く
        </Link>
        <p className="pb-2 text-center text-[0.66rem] leading-relaxed text-sumi-mute">
          登録・更新・無効化・削除は配布データのみが対象です。利用者の参拝履歴・御朱印・お気に入り・実績・神徳ポイントは変更されません。
        </p>
      </div>
    </div>
  );
}
