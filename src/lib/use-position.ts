"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentPosition } from "@/lib/geo";

/* position-store（旧 src/lib/position-store.ts を統合） */


/**
 * 位置情報の共有ストア
 * ホーム画面で取得した現在地を、神社詳細のチェックイン判定でも使い回す。
 * 動作確認用に「テスト位置」を設定して神社の座標を擬似現在地にできる。
 */
type PositionSource = "gps" | "test";

type StoredPosition = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  source: PositionSource;
  label: string;
  updated_at: number;
};

const KEY = "kamitabicho:position";
const listeners = new Set<(p: StoredPosition | null) => void>();
let current: StoredPosition | null = null;

function emit() {
  listeners.forEach((cb) => cb(current));
}

function readStoredPosition(): StoredPosition | null {
  if (current) return current;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    current = raw ? (JSON.parse(raw) as StoredPosition) : null;
  } catch {
    current = null;
  }
  return current;
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    if (current) window.sessionStorage.setItem(KEY, JSON.stringify(current));
    else window.sessionStorage.removeItem(KEY);
  } catch {
    /* ストレージ不可の環境ではメモリのみで動作 */
  }
  emit();
}

function setPosition(pos: Omit<StoredPosition, "updated_at">) {
  current = { ...pos, updated_at: Date.now() };
  persist();
}

function clearPosition() {
  current = null;
  persist();
}

function subscribePosition(cb: (p: StoredPosition | null) => void) {
  listeners.add(cb);
  cb(readStoredPosition());
  return () => {
    listeners.delete(cb);
  };
}


/**
 * 現在地を扱うフック。
 * - locate(): GPS から取得（約15秒タイムアウト）
 * - useTestPosition(): 動作確認用に神社座標などを擬似現在地として設定
 */
export function usePosition() {
  const [position, setPositionState] = useState<StoredPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribePosition(setPositionState), []);

  const locate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      setPosition({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
        source: "gps",
        label: "現在地（GPS）",
      });
      return readStoredPosition();
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { position, loading, error, locate, clear: clearPosition };
}

/** テスト用の擬似現在地（「すぐに試せる」ための補助機能） */
export function useTestPosition() {
  const setTest = useCallback(
    (latitude: number, longitude: number, label: string) => {
      setPosition({ latitude, longitude, accuracy: 5, source: "test", label });
    },
    [],
  );
  const clearTest = useCallback(() => clearPosition(), []);
  return { setTest, clearTest };
}
