"use client";

/**
 * PWA インストール導線
 * - Android / Chrome: beforeinstallprompt を捕捉してボタン表示
 * - iOS Safari: 共有 → ホーム画面に追加 の手順を案内
 * どちらも「閉じる」で 30 日間は再表示しない。
 */
import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };

const DISMISS_KEY = "kamitabicho:install-dismissed";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function dismissedRecently(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    return raw ? Date.now() - Number(raw) < THIRTY_DAYS : false;
  } catch {
    return false;
  }
}

export default function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || dismissedRecently()) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS は beforeinstallprompt が無いため、Safari のときだけ手順を案内する
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (isIos) {
      setShowIos(true);
      setVisible(true);
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-[86px] z-40 mx-auto max-w-[520px] anim-in print:hidden">
      <div className="wa-card flex items-start gap-2 border-kin/40 px-3 py-2.5">
        <span className="mt-[2px] text-kin" aria-hidden>
          ⛩
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.84rem] font-bold">神旅帳をホーム画面に追加</p>
          <p className="text-[0.74rem] leading-snug text-sumi-mute">
            {showIos
              ? "Safari の共有ボタン →「ホーム画面に追加」でアプリのように使えます。"
              : "アプリのように起動でき、オフラインでも御朱印帳を閲覧できます。"}
          </p>
          {event && (
            <button
              className="btn btn-outline btn-sm mt-1.5"
              onClick={async () => {
                await event.prompt();
                dismiss();
              }}
            >
              インストールする
            </button>
          )}
        </div>
        <button onClick={dismiss} className="shrink-0 px-1 text-sumi-mute" aria-label="閉じる">
          ✕
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   PWA: Service Worker の登録（旧 components/ServiceWorkerRegister.tsx）
   ============================================================ */

/**
 * PWA: Service Worker の登録
 *
 * - 本番ビルドでのみ登録（開発時はキャッシュ事故を避ける）
 * - 更新が見つかったら新しい SW を有効化し、1回だけ通知する
 */

export function ServiceWorkerRegister() {
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;
    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        // 新しい SW が見つかった場合のハンドリング
        reg.addEventListener("updatefound", () => {
          const incoming = reg.installing;
          if (!incoming) return;
          incoming.addEventListener("statechange", () => {
            if (incoming.state === "installed" && navigator.serviceWorker.controller) {
              if (!cancelled) setUpdated(true);
            }
          });
        });
        // 24時間ごとに更新確認（PWA の陳腐化防止）
        window.setInterval(() => void reg.update(), 24 * 60 * 60 * 1000);
      } catch (e) {
        console.warn("[神旅帳] Service Worker の登録に失敗しました", e);
      }
    };

    if (document.readyState === "complete") void register();
    else window.addEventListener("load", register);
    return () => {
      cancelled = true;
      window.removeEventListener("load", register);
    };
  }, []);

  if (!updated) return null;
  return (
    <div className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-[520px] rounded-xl border border-kin-soft/60 bg-paper px-3 py-2 text-[0.82rem] shadow-lg">
      <div className="flex items-center gap-2">
        <p className="flex-1 leading-snug">新しいバージョンがあります。</p>
        <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>
          更新
        </button>
      </div>
    </div>
  );
}
