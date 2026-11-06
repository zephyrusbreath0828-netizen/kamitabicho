/**
 * Firebase 初期化（クライアント SDK v12 / modular）
 *
 * 使用サービス: Authentication / Cloud Firestore のみ。
 * 画像は Firebase Storage を使わず Cloudinary へアップロードする（src/lib/cloudinary.ts）。
 *
 * NEXT_PUBLIC_FIREBASE_* が揃っているときだけ初期化する。
 * 未設定でもアプリはデモモードで動作する。
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

/** 必須3項目が揃っていれば Firebase モードが利用可能 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase が未設定です。.env.local に NEXT_PUBLIC_FIREBASE_* を設定してください。");
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFbAuth(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp());
  return auth;
}

export function getDb(): Firestore {
  if (!db) db = getFirestore(getFirebaseApp());
  return db;
}

/** Firestore コレクション名 */
export const COLLECTIONS = {
  users: "users",
  shrines: "shrines",
  visits: "visits",
  goshuin: "goshuin",
  favorites: "favorites",
  /* v1.2 追加コレクション（既存名は変更しない） */
  deities: "deities",
  benefits: "benefits",
  regions: "regions",
  rewards: "rewards",
  achievementLog: "achievements",
  /** v1.0 の旧コレクション（移行元。新規書き込みはしない） */
  legacyVisitHistory: "visit_history",
} as const;


/* ============================================================
   開発・動作確認用ツールの表示可否（旧 lib/dev-tools.ts）
   ============================================================ */
/**
 * 開発・動作確認用ツールの表示可否
 *
 * 対象:
 *   - 神社の座標を擬似現在地として設定する「テスト位置」（チェックインの流れを実機なしで確認）
 *   - ?autologin=1 によるデモユーザーの自動作成／サンプルデータ投入
 *
 * 既定:
 *   - Firebase 未接続（デモモード）では有効：すぐ試せることを優先
 *   - Firebase 接続時は無効：本番利用者に検証用UIを見せない
 *
 * 明示的に切り替えたい場合は NEXT_PUBLIC_ENABLE_DEMO_TOOLS=true / false を設定する。
 */

export function devToolsEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_ENABLE_DEMO_TOOLS;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return !isFirebaseConfigured;
}

/** ?demo=1 が指定されているか（Firebase 設定済みでもデモモードで起動する） */
export function isForceDemoRequested(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("demo") === "1";
}
