"use client";

/** マイページ：プロフィール / 参拝回数 / 御朱印数 / 参拝達成率 / 実績 / 履歴 */
import Link from "next/link";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { AchievementBadge, EmptyState, ProgressRing, SectionTitle } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { toUserMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { formatDistance } from "@/lib/geo";

export default function MyPage() {
  const {
    user,
    profile,
    mode,
    stats,
    achievements,
    unlockedAchievements,
    visits,
    goshuin,
    favorites,
    shrineById,
    removeVisit,
    points,
    benefitsCollection,
    deitiesCollection,
    pendingVisits,
    downloads,
    online,
  } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const deleteVisit = async (id: string) => {
    if (!window.confirm("この参拝記録を削除しますか？")) return;
    setBusyId(id);
    setError(null);
    try {
      await removeVisit(id);
    } catch (e) {
      setError(toUserMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title="マイページ" subtitle="参拝の歩みと実績" eyebrow="MY PAGE" />

      <div className="space-y-4 px-4 py-4">
        {/* プロフィール */}
        <section className="wa-card flex items-center gap-3 p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-washi-line bg-washi-deep text-xl text-sumi-soft">
            {profile?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{(profile?.nickname ?? user?.displayName ?? "参").slice(0, 1)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mincho truncate text-[1.12rem] font-semibold">
              {profile?.nickname ?? user?.displayName ?? "参拝者"}
            </p>
            <p className="text-[0.74rem] text-sumi-mute">{user?.email ?? "デモモード（メールなし）"}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className={mode === "demo" ? "badge-demo" : "chip text-[0.68rem]"}>
                {mode === "demo" ? "デモモード" : "Google ログイン"}
              </span>
              <span className="chip text-[0.68rem]">お気に入り {favorites.length}</span>
            </div>
          </div>
          <Link href="/profile" className="btn btn-outline btn-sm shrink-0">
            編集
          </Link>
        </section>

        {/* 達成率と統計 */}
        <section className="wa-card p-4">
          <div className="flex items-center gap-4">
            <ProgressRing value={stats.rate} label="参拝達成率" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.78rem] text-sumi-mute">
                {stats.totalShrines}社のうち
                <span className="font-mincho mx-1 text-[1.05rem] font-semibold text-shu">{stats.shrines}</span>
                社を参拝
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  { label: "総参拝回数", value: stats.visits, unit: "回" },
                  { label: "御朱印", value: stats.goshuin, unit: "枚" },
                  { label: "都道府県", value: stats.prefectures, unit: "/47" },
                  { label: "実績", value: unlockedAchievements, unit: `/${achievements.length}` },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-washi-line bg-washi-deep/30 px-2.5 py-1.5">
                    <p className="text-[0.66rem] text-sumi-mute">{item.label}</p>
                    <p className="font-mincho text-[1.08rem] font-semibold leading-tight">
                      {item.value}
                      <span className="ml-0.5 text-[0.62rem] font-normal text-sumi-mute">{item.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 神徳ポイント */}
        <section className="wa-card p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="eyebrow">TOKUDOKU POINT</p>
              <p className="font-mincho text-[1.5rem] leading-tight font-semibold text-kin">
                {points.total.toLocaleString("ja-JP")}
                <span className="ml-1 text-[0.7rem] font-normal text-sumi-mute">ポイント</span>
              </p>
            </div>
            <span className="chip chip-active">{points.rank.name}</span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-washi-deep">
            <div
              className="h-full rounded-full bg-gradient-to-r from-kin to-shu"
              style={{ width: `${Math.max(2, Math.round((points.nextRank?.progress ?? 1) * 100))}%` }}
            />
          </div>
          <p className="mt-1 text-[0.7rem] text-sumi-mute">
            {points.nextRank
              ? `${points.nextRank.name}まで あと ${points.nextRank.remaining.toLocaleString("ja-JP")}pt`
              : "最高ランクに到達しました"}
          </p>

          <dl className="mt-3 grid grid-cols-2 gap-2">
            {[
              ["参拝", points.breakdown.visits],
              ["御朱印", points.breakdown.goshuin],
              ["新都道府県", points.breakdown.prefectures],
              ["制覇ボーナス", points.breakdown.conquest],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-baseline justify-between rounded-lg bg-washi-deep/30 px-2.5 py-1.5">
                <dt className="text-[0.7rem] text-sumi-mute">{label}</dt>
                <dd className="text-[0.82rem] font-semibold">{Number(value).toLocaleString("ja-JP")}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 図鑑サマリ */}
        <Link href="/zukan" className="wa-card flex items-center gap-3 px-4 py-3">
          <span className="text-shu" aria-hidden>
            ✦
          </span>
          <div className="flex-1">
            <p className="text-[0.9rem] font-semibold">図鑑</p>
            <p className="text-[0.72rem] text-sumi-mute">
              御利益 {benefitsCollection.collected}/{benefitsCollection.total}・祭神{" "}
              {deitiesCollection.collected}/{deitiesCollection.total}
            </p>
          </div>
          <span className="text-sumi-mute" aria-hidden>
            ›
          </span>
        </Link>

        {/* データ管理・同期 */}
        <section className="wa-card divide-y divide-washi-line">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3">
            <span className="text-kin" aria-hidden>
              ＋
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.9rem] font-semibold">地域パック管理</p>
              <p className="text-[0.72rem] text-sumi-mute">JSON を登録して地域データを追加（管理者）</p>
            </div>
            <span className="text-sumi-mute" aria-hidden>
              ›
            </span>
          </Link>

          <Link href="/data" className="flex items-center gap-3 px-4 py-3">
            <span className="text-kin" aria-hidden>
              ↓
            </span>
            <div className="flex-1">
              <p className="text-[0.9rem] font-semibold">神社データ管理</p>
              <p className="text-[0.72rem] text-sumi-mute">
                {downloads.length}地方を端末に保存中
              </p>
            </div>
            <span className="text-sumi-mute" aria-hidden>
              ›
            </span>
          </Link>
          <Link href="/sync" className="flex items-center gap-3 px-4 py-3">
            <span className="text-mori" aria-hidden>
              ↻
            </span>
            <div className="flex-1">
              <p className="text-[0.9rem] font-semibold">同期センター</p>
              <p className="text-[0.72rem] text-sumi-mute">
                {pendingVisits.length > 0 ? `未同期 ${pendingVisits.length}件` : "すべて同期済み"}
                {!online && "・オフライン"}
              </p>
            </div>
            {pendingVisits.length > 0 && <span className="badge-demo">未同期</span>}
            <span className="text-sumi-mute" aria-hidden>
              ›
            </span>
          </Link>
        </section>

        {/* 実績 */}
        <section>
          <SectionTitle title="参拝実績" actionLabel="すべて見る" actionHref="/achievements" />
          <div className="grid grid-cols-3 gap-2">
            {achievements.slice(0, 6).map((a) => (
              <AchievementBadge key={a.id} achievement={a} compact />
            ))}
          </div>
        </section>

        {/* 参拝履歴 */}
        <section>
          <SectionTitle title="参拝履歴" trailing={<span className="text-[0.74rem] text-sumi-mute">{visits.length}件</span>} />
          {visits.length === 0 ? (
            <EmptyState
              title="参拝履歴がありません"
              description="神社に到着したら、詳細画面からGPSで参拝を記録しましょう。"
              actionLabel="神社をさがす"
              actionHref="/shrines"
              mark="旅"
            />
          ) : (
            <ul className="wa-card divide-y divide-washi-line">
              {visits.map((v) => {
                const s = shrineById(v.shrine_id);
                return (
                  <li key={v.id} className="flex items-center gap-3 px-4 py-3">
                    <div
                      className="h-10 w-10 shrink-0 rounded-lg bg-washi-deep bg-cover bg-center"
                      style={s ? { backgroundImage: `url(${s.image_url})` } : undefined}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <Link href={`/shrines/${v.shrine_id}`} className="font-mincho block truncate text-[0.92rem] font-semibold">
                        {s?.name ?? "神社"}
                      </Link>
                      <p className="text-[0.7rem] text-sumi-mute">
                        {formatDateTime(v.visit_datetime)}・{formatDistance(v.distance_m)}
                      </p>
                    </div>
                    <button
                      onClick={() => void deleteVisit(v.id)}
                      disabled={busyId === v.id}
                      className="shrink-0 px-1.5 text-[0.72rem] text-sumi-mute underline"
                    >
                      削除
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {error && <p className="mt-2 text-[0.8rem] text-shu-deep">{error}</p>}
        </section>

        {/* 御朱印サマリ */}
        <Link href="/goshuin" className="wa-card flex items-center gap-3 px-4 py-3">
          <span className="text-kin" aria-hidden>
            ✦
          </span>
          <div className="flex-1">
            <p className="text-[0.9rem] font-semibold">御朱印帳</p>
            <p className="text-[0.72rem] text-sumi-mute">{goshuin.length}枚を記録中</p>
          </div>
          <span className="text-sumi-mute" aria-hidden>
            ›
          </span>
        </Link>

        <Link href="/favorites" className="wa-card flex items-center gap-3 px-4 py-3">
          <span className="text-kin" aria-hidden>
            ★
          </span>
          <div className="flex-1">
            <p className="text-[0.9rem] font-semibold">お気に入りの神社</p>
            <p className="text-[0.72rem] text-sumi-mute">{favorites.length}社を登録中</p>
          </div>
          <span className="text-sumi-mute" aria-hidden>
            ›
          </span>
        </Link>

        <p className="pb-2 text-center text-[0.66rem] text-sumi-mute">神旅帳 v2.8.0</p>
      </div>
    </div>
  );
}
