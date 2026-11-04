"use client";

/**
 * 端末内データベース（IndexedDB / Dexie）
 *
 * 役割:
 *  1. 地域データをダウンロードして保存（オフライン検索の元データ）
 *  2. オフライン時の参拝記録を一時保存（未同期キュー）
 *  3. 同期メタ情報（最終同期日時・件数）の保持
 *
 * 既存の localStorage（デモモードのデータ）とは独立しており、削除・上書きしない。
 * SSR では初期化しない（ブラウザでのみ動作）。
 */
import Dexie, { type Table } from "dexie";
import type { Benefit, Deity, DownloadedRegion, PendingVisit, RegionId, ShrineV2 } from "@/lib/types";

export type MetaRow = { key: string; value: string };

type LocalShrine = ShrineV2 & { region_id: RegionId };

class KamitabichoDB extends Dexie {
  shrines!: Table<LocalShrine, string>;
  deities!: Table<Deity, string>;
  benefits!: Table<Benefit, string>;
  meta!: Table<MetaRow, string>;
  pendingVisits!: Table<PendingVisit, string>;

  constructor() {
    super("kamitabicho");
    // バージョンは将来のスキーマ変更で上げる（既存ストアは保持される）
    this.version(1).stores({
      shrines: "id, prefecture, region_id, name, city",
      deities: "id, name",
      benefits: "id, name, category",
      meta: "key",
      pendingVisits: "id, shrine_id, created_at, status",
    });
  }
}

let dbInstance: KamitabichoDB | null = null;

/** ブラウザでのみ DB を返す（SSR では null） */
export function getDb(): KamitabichoDB | null {
  if (typeof window === "undefined") return null;
  if (!dbInstance) dbInstance = new KamitabichoDB();
  return dbInstance;
}

const KEY_DOWNLOADS = "downloads";
/** 地域の保存状態ミラー（IndexedDB が使えない環境でも状態を保持する） */
const KEY_STATES = "kamitabicho:region-states:v1";

export type SavedRegionState = { shrine_count: number; version: number; saved_at: string };

export function readRegionStates(): Record<string, SavedRegionState> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY_STATES) ?? "{}") as Record<string, SavedRegionState>;
  } catch {
    return {};
  }
}

function writeRegionStates(map: Record<string, SavedRegionState>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_STATES, JSON.stringify(map));
  } catch {
    /* 容量超過などは無視（IndexedDB 側が正） */
  }
}

function setRegionState(regionId: string, value: SavedRegionState | null): void {
  const map = readRegionStates();
  if (value) map[regionId] = value;
  else delete map[regionId];
  writeRegionStates(map);
}
const KEY_LAST_SYNC = "last_sync_at";

/** IndexedDB が使えるか（プライベートブラウズ等で失敗する場合がある） */
export async function isLocalDbAvailable(): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await db.open();
    return true;
  } catch {
    return false;
  }
}

/* ---------------- 地域データ ---------------- */

export async function listDownloads(): Promise<DownloadedRegion[]> {
  const db = getDb();
  if (!db) return [];
  const row = await db.meta.get(KEY_DOWNLOADS);
  if (!row) return [];
  try {
    return JSON.parse(row.value) as DownloadedRegion[];
  } catch {
    return [];
  }
}

async function writeDownloads(list: DownloadedRegion[]): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.meta.put({ key: KEY_DOWNLOADS, value: JSON.stringify(list) });
}

/**
 * 地域データを保存する（既存の同地域データは置き換え）
 * @returns 保存件数
 */
export async function saveRegion(
  regionId: RegionId,
  regionName: string,
  shrines: ShrineV2[],
  deities: Deity[],
  benefits: Benefit[],
  version = 1,
): Promise<number> {
  const db = getDb();
  if (!db) throw new Error("端末のデータベースを利用できません。");
  const now = new Date().toISOString();
  const rows: LocalShrine[] = shrines.map((s) => ({ ...s, region_id: (s.region ?? regionId) as RegionId }));

  await db.transaction("rw", db.shrines, db.deities, db.benefits, db.meta, async () => {
    // 同地域の旧データを削除してから入れる（重複・古いデータを残さない）
    const oldIds = await db.shrines.where("region_id").equals(regionId).primaryKeys();
    if (oldIds.length) await db.shrines.bulkDelete(oldIds);
    await db.shrines.bulkPut(rows);
    if (deities.length) await db.deities.bulkPut(deities);
    if (benefits.length) await db.benefits.bulkPut(benefits);

    const list = await listDownloads();
    const next: DownloadedRegion[] = [
      ...list.filter((r) => r.region_id !== regionId),
      {
        region_id: regionId,
        name: regionName,
        shrine_count: rows.length,
        downloaded_at: now,
        last_synced_at: now,
        version,
      },
    ];
    await db.meta.put({ key: KEY_DOWNLOADS, value: JSON.stringify(next) });
    await db.meta.put({ key: KEY_LAST_SYNC, value: now });
  });
  setRegionState(regionId, { shrine_count: rows.length, version, saved_at: now });
  return rows.length;
}

export async function removeRegion(regionId: RegionId): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.transaction("rw", db.shrines, db.meta, async () => {
    const ids = await db.shrines.where("region_id").equals(regionId).primaryKeys();
    if (ids.length) await db.shrines.bulkDelete(ids);
    const list = await listDownloads();
    await db.meta.put({
      key: KEY_DOWNLOADS,
      value: JSON.stringify(list.filter((r) => r.region_id !== regionId)),
    });
  });
  setRegionState(regionId, null);
}

export async function clearAllLocalData(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.transaction("rw", db.shrines, db.deities, db.benefits, db.meta, async () => {
    await db.shrines.clear();
    await db.deities.clear();
    await db.benefits.clear();
    await db.meta.clear();
  });
  writeRegionStates({});
}

/** 保存済みの神社数（全地域合計） */
export async function localShrineCount(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  return db.shrines.count();
}

export async function getLastSyncAt(): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const row = await db.meta.get(KEY_LAST_SYNC);
  return row?.value ?? null;
}

export async function touchLastSync(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.meta.put({ key: KEY_LAST_SYNC, value: new Date().toISOString() });
}

/** 保存済みデータを全件取得（検索・近傍検索用） */
/** 管理画面で登録したパックの実データを保存する（キー: pack:<region>） */
export async function savePackData(regionId: string, json: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.meta.put({ key: `pack:${regionId}`, value: json });
}

export async function getPackData(regionId: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const row = await db.meta.get(`pack:${regionId}`);
  return row?.value ?? null;
}

export async function allLocalShrines(): Promise<ShrineV2[]> {
  const db = getDb();
  if (!db) return [];
  return db.shrines.toArray();
}

export async function getLocalShrine(id: string): Promise<ShrineV2 | null> {
  const db = getDb();
  if (!db) return null;
  return (await db.shrines.get(id)) ?? null;
}

/* ---------------- 未同期の参拝記録 ---------------- */

export async function queueVisit(visit: PendingVisit): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("端末のデータベースを利用できません。");
  await db.pendingVisits.put(visit);
}

export async function listPendingVisits(): Promise<PendingVisit[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.pendingVisits.toArray();
  return rows.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
}

export async function pendingCount(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  return db.pendingVisits.count();
}

export async function removePending(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.pendingVisits.delete(id);
}

export async function clearPending(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.pendingVisits.clear();
}

/** 保存済みマスタ（図鑑のオフライン表示用） */
export async function localDeities(): Promise<Deity[]> {
  const db = getDb();
  if (!db) return [];
  return db.deities.toArray();
}

export async function localBenefits(): Promise<Benefit[]> {
  const db = getDb();
  if (!db) return [];
  return db.benefits.toArray();
}
