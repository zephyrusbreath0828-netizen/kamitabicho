/**
 * v1.2 マスタデータ（ご祭神・御利益・地方）を Firestore へ投入する
 *
 * 事前準備:
 *   1. Firebase コンソール > プロジェクトの設定 > サービスアカウント
 *      「新しい秘密鍵を生成」→ serviceAccountKey.json をプロジェクト直下に保存
 *   2. node scripts/seed-masters.mjs
 *
 * 使い方: node scripts/seed-masters.mjs [serviceAccountKey.json のパス]
 *
 * merges（既存フィールドを壊さない）で書き込みます。何度実行しても安全です。
 */
import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const keyPath = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS || "./serviceAccountKey.json";

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
} catch {
  console.error(`サービスアカウント鍵を読み込めませんでした: ${keyPath}`);
  console.error("Firebase コンソールで秘密鍵を生成し、パスを引数または環境変数で指定してください。");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
}

const db = getFirestore();

const targets = [
  ["deities", "src/data/deities.json"],
  ["benefits", "src/data/benefits.json"],
  ["regions", "src/data/regions.json"],
];

let total = 0;
for (const [collection, file] of targets) {
  const rows = JSON.parse(readFileSync(file, "utf8"));
  for (let i = 0; i < rows.length; i += 400) {
    const batch = db.batch();
    for (const row of rows.slice(i, i + 400)) {
      const { id, ...rest } = row;
      batch.set(db.collection(collection).doc(String(id)), { ...rest, updated_at: new Date().toISOString() }, { merge: true });
    }
    await batch.commit();
  }
  console.log(`${collection}: ${rows.length}件 書き込み完了`);
  total += rows.length;
}

console.log(`合計 ${total}件を Firestore へ投入しました。`);
