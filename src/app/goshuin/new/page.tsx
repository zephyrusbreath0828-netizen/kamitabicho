"use client";

/** 御朱印の新規登録：写真・神社・授与日・メモ */
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useApp } from "@/lib/app-context";
import { toUserMessage } from "@/lib/errors";
import { toDateInputValue } from "@/lib/format";
import Link from "next/link";
import { compressImage, formatBytes, type CompressedImage, validateImage } from "@/lib/cloudinary";

export default function NewGoshuinPage() {
  const { shrines, shrineById, registerGoshuin, visits } = useApp();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [shrineId, setShrineId] = useState("");
  const [visitedDate, setVisitedDate] = useState(toDateInputValue());
  const [memo, setMemo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressed, setCompressed] = useState<CompressedImage | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ?shrine= で神社を指定して遷移してくる
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("shrine");
    if (id) setShrineId(id);
  }, []);

  // 最近参拝した神社を先頭に並べる
  const orderedShrines = useMemo(() => {
    const recent = Array.from(new Set(visits.map((v) => v.shrine_id)));
    const recentSet = new Set(recent);
    return [...shrines].sort((a, b) => {
      const ra = recentSet.has(a.id) ? 0 : 1;
      const rb = recentSet.has(b.id) ? 0 : 1;
      if (ra !== rb) return ra - rb;
      return 0;
    });
  }, [shrines, visits]);

  const resetPhoto = () => {
    if (compressed) URL.revokeObjectURL(compressed.previewUrl);
    setFile(null);
    setPreview(null);
    setCompressed(null);
    setCompressing(false);
  };

  /** 選択直後に自動圧縮し、圧縮後プレビューと削減量を表示する（v2.11） */
  const onPick = async (f: File | null) => {
    setError(null);
    if (!f) {
      resetPhoto();
      return;
    }
    const message = validateImage(f);
    if (message) {
      setError(message);
      return;
    }
    if (compressed) URL.revokeObjectURL(compressed.previewUrl);
    setFile(f);
    setCompressed(null);
    setCompressing(true);
    // 元画像を先に出して「何も起きていない」感を消す
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(f);
    try {
      const out = await compressImage(f);
      setCompressed(out);
      setPreview(out.previewUrl);
    } catch {
      setCompressed(null);
    } finally {
      setCompressing(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!shrineId) {
      setError("神社を選択してください。");
      return;
    }
    if (!file) {
      setError("御朱印の写真を選択してください。");
      return;
    }
    setBusy(true);
    try {
      // 圧縮済みの実体を送る（未圧縮なら registerGoshuin 側で再度最適化される）
      await registerGoshuin({ shrine_id: shrineId, visited_date: visitedDate, memo, file: compressed?.file ?? file });
      router.push("/goshuin");
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="御朱印を記録" subtitle="いただいた御朱印を写真で残します" backHref="/goshuin" eyebrow="NEW GOSHUIN" />

      <form onSubmit={submit} className="space-y-4 px-4 py-4">
        <section className="wa-card p-4">
          <label className="text-[0.8rem] font-semibold" htmlFor="photo">
            御朱印の写真 <span className="text-shu">*</span>
          </label>
          <div className="mt-2 flex gap-3">
            <div className="goshuin-frame h-[124px] w-[94px] shrink-0">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="選択した御朱印" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[0.7rem] text-sumi-mute">未選択</div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <input
                ref={fileRef}
                id="photo"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
              />
              <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
                写真を選ぶ
              </button>
              <p className="text-[0.7rem] leading-snug text-sumi-mute">
                8MBまでの JPEG / PNG / WebP。アップロード時に自動で最適化します。
              </p>
              {compressing && (
                <p className="flex items-center gap-1.5 text-[0.72rem] text-shu-deep" role="status" aria-live="polite">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-shu/30 border-t-shu" />
                  画像を最適化しています…
                </p>
              )}
              {compressed && !compressing && (
                <p className="text-[0.72rem] text-mori">
                  {formatBytes(compressed.originalBytes)} → <strong>{formatBytes(compressed.compressedBytes)}</strong>
                  {" "}（長辺{compressed.width}×{compressed.height}px）
                </p>
              )}
              {file && (
                <button type="button" className="text-[0.72rem] text-sumi-mute underline" onClick={resetPhoto}>
                  選択を解除
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="wa-card space-y-2 p-4">
          <p className="text-[0.78rem] font-semibold">写真の自動圧縮について</p>
          <p className="text-[0.72rem] leading-relaxed text-sumi-mute">
            写真は保存容量節約と通信量削減のため、アップロード時に自動圧縮されます。
          </p>
          <ul className="space-y-1 text-[0.72rem] leading-relaxed text-sumi-mute">
            <li>・長辺1600pxへ自動縮小</li>
            <li>・画質を維持したまま最適化</li>
            <li>・御朱印や参拝写真は十分な画質で保存</li>
            <li>・元画像より容量を大幅削減</li>
          </ul>
          <Link href="/help/photos" className="inline-block text-[0.74rem] text-shu underline">
            写真圧縮について（詳しく見る）
          </Link>
        </section>

        <section className="wa-card space-y-3 p-4">
          <div>
            <label className="text-[0.8rem] font-semibold" htmlFor="shrine">
              神社 <span className="text-shu">*</span>
            </label>
            <select id="shrine" className="field mt-1" value={shrineId} onChange={(e) => setShrineId(e.target.value)}>
              <option value="">選択してください</option>
              {orderedShrines.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.prefecture}｜{s.name}
                </option>
              ))}
            </select>
            {shrineId && (
              <p className="mt-1 text-[0.72rem] text-sumi-mute">
                {shrineById(shrineId)?.address}
              </p>
            )}
          </div>

          <div>
            <label className="text-[0.8rem] font-semibold" htmlFor="date">
              授与日
            </label>
            <input
              id="date"
              type="date"
              className="field mt-1"
              value={visitedDate}
              onChange={(e) => setVisitedDate(e.target.value)}
              max={toDateInputValue()}
            />
          </div>

          <div>
            <label className="text-[0.8rem] font-semibold" htmlFor="memo">
              メモ（任意）
            </label>
            <textarea
              id="memo"
              className="field mt-1"
              rows={3}
              maxLength={300}
              placeholder="例：早朝参拝。御朱印は授与所でいただきました。"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
            <p className="mt-1 text-right text-[0.68rem] text-sumi-mute">{memo.length}/300</p>
          </div>
        </section>

        {error && (
          <p className="rounded-xl border border-shu/30 bg-[#fdf1ef] px-3 py-2 text-[0.84rem] text-shu-deep">{error}</p>
        )}

        <button type="submit" className="btn btn-primary w-full" disabled={busy || compressing}>
          {compressing ? "画像を最適化しています…" : busy ? "保存しています…" : "御朱印帳に保存する"}
        </button>
        <p className="pb-2 text-center text-[0.7rem] text-sumi-mute">
          写真は本人だけが閲覧できます。長辺1600px・品質85%で保存します。
        </p>
      </form>
    </div>
  );
}
