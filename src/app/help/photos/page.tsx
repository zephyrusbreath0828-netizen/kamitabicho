"use client";

/** 写真圧縮の詳細説明（v2.11） */
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { COMPRESS_MAX_EDGE, COMPRESS_QUALITY, COMPRESS_TARGET_BYTES, formatBytes } from "@/lib/cloudinary";

const ITEMS = [
  { title: "長辺1600pxへ自動縮小", body: "スマートフォンで撮影した写真（例: 4032×3024）は、アスペクト比を保ったまま長辺1600pxへ縮小します。" },
  { title: "画質を維持したまま最適化", body: `JPEG品質${Math.round(COMPRESS_QUALITY * 100)}%で保存します。1枚あたり${formatBytes(COMPRESS_TARGET_BYTES)}以下を目標に、品質を保ったまま段階的に調整します。` },
  { title: "御朱印や参拝写真は十分な画質", body: "御朱印の文字や神社の細部が判読できる解像度を維持します。通常のスマートフォンやタブレットで閲覧する場合、画質差はほぼありません。" },
  { title: "位置情報などのExifは保存しません", body: "写真に含まれる撮影日時・位置情報などのExif情報は、最適化の際に自動的に取り除かれます。" },
];

const EFFECTS = [
  ["アップロード時間の短縮", "通信量が減り、電波の弱い場所でも送信しやすくなります。"],
  ["表示速度の向上", "一覧や御朱印帳の読み込みが軽くなります。"],
  ["通信量の削減", "モバイル回線のデータ消費を抑えられます。"],
  ["長期運用の安定化", "保存容量の増加を抑え、サービスを長く安定して提供できます。"],
];

export default function PhotoCompressionPage() {
  return (
    <div>
      <PageHeader title="写真圧縮について" subtitle="アップロード時の自動最適化" backHref="/goshuin/new" eyebrow="PHOTO" />

      <div className="space-y-4 px-4 py-4">
        <section className="wa-card p-4">
          <p className="text-[0.84rem] leading-relaxed">
            神旅帳では快適な利用環境を維持するため、アップロード写真を自動で最適化しています。
          </p>
          <p className="mt-2 text-[0.84rem] leading-relaxed">
            写真は長辺{COMPRESS_MAX_EDGE}px・高画質設定（JPEG {Math.round(COMPRESS_QUALITY * 100)}%）で保存されます。
            通常のスマートフォンやタブレットで閲覧する場合、画質差はほぼありません。
          </p>
        </section>

        <section>
          <p className="font-mincho mb-2 text-[0.9rem] font-semibold">保存される内容</p>
          <div className="space-y-2">
            {ITEMS.map((it) => (
              <div key={it.title} className="wa-card p-3">
                <p className="text-[0.82rem] font-semibold">{it.title}</p>
                <p className="mt-1 text-[0.74rem] leading-relaxed text-sumi-mute">{it.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="font-mincho mb-2 text-[0.9rem] font-semibold">容量を削減することで</p>
          <div className="wa-card divide-y divide-washi-line">
            {EFFECTS.map(([title, body]) => (
              <div key={title} className="p-3">
                <p className="text-[0.8rem] font-semibold">{title}</p>
                <p className="mt-0.5 text-[0.72rem] leading-relaxed text-sumi-mute">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="wa-card p-4">
          <p className="text-[0.78rem] font-semibold">圧縮の例</p>
          <p className="mt-1 font-mono text-[0.78rem] text-ink/80">
            4032×3024 / 5.2MB → 1600×1200 / 約300〜800KB
          </p>
          <p className="mt-1 text-[0.7rem] leading-relaxed text-sumi-mute">
            元の写真が小さい場合や、すでに最適化されている場合は、画質を落とさないため元の画像をそのまま保存することがあります。
          </p>
        </section>

        <Link href="/goshuin/new" className="btn btn-primary w-full">
          御朱印を記録する
        </Link>
        <p className="pb-2 text-center text-[0.68rem] text-sumi-mute">
          すでに保存済みの写真・URLは変更されません。
        </p>
      </div>
    </div>
  );
}
