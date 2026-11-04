/**
 * 地域データパック（OpenStreetMap 由来）
 *
 * 配布パックは `src/data/packs/<region>.json` に置く。
 * Firestore に同地域の神社があればそちらを優先し、無い場合（デモ・オフライン・初期状態）は
 * この同梱パックを使う。将来 kinki / chugoku … を追加する場合は JSON を足すだけでよい。
 */
import shikokuJson from "./shikoku.json";
import chugokuJson from "./chugoku.json";
import kinkiJson from "./kinki.json";
import chubuJson from "./chubu.json";
import type { ShrineV2 } from "@/lib/types";

export type PackShrine = {
  id: string;
  name: string;
  prefecture: string;
  city: string;
  latitude: number;
  longitude: number;
  address: string;
  region: string;
  source: string;
  source_ref?: string;
  created_at: string;
  updated_at: string;
};

const RAW: Record<string, PackShrine[]> = {
  shikoku: shikokuJson as PackShrine[],
  chugoku: chugokuJson as PackShrine[],
  kinki: kinkiJson as PackShrine[],
  chubu: chubuJson as PackShrine[],
};

/** パックが存在する地域ID */
export const PACK_REGIONS = Object.keys(RAW) as string[];

export function hasPack(regionId: string): boolean {
  return (RAW[regionId]?.length ?? 0) > 0;
}

/** パックをアプリの神社型へ変換（未設定項目は空で埋める） */
export function packShrines(regionId: string): ShrineV2[] {
  const rows = RAW[regionId] ?? [];
  return rows.map(
    (r) =>
      ({
        id: r.id,
        name: r.name,
        prefecture: r.prefecture,
        address: r.address || r.prefecture,
        latitude: r.latitude,
        longitude: r.longitude,
        coord_accuracy: "exact",
        main_deity: "",
        description: "",
        image_url: "",
        visit_count: 0,
        city: r.city || "",
        region: r.region,
        deities: [],
        benefits: [],
        source: r.source,
        data_version: 1,
      }) as unknown as ShrineV2,
  );
}

export function packCount(regionId: string): number {
  return RAW[regionId]?.length ?? 0;
}

/**
 * 地域の神社数（唯一の正はパック JSON の件数）
 *
 * regions.json の shrine_count は表示に使わない。
 * パック JSON が無い地域のみ、渡された fallback（標準マスタ件数など）を使う。
 */
export function regionShrineCount(regionId: string, fallback = 0): number {
  const n = packCount(regionId);
  return n > 0 ? n : fallback;
}

/** 地域一覧の shrine_count をパック JSON の件数で確定させる */
export function withPackCounts<T extends { id: string; shrine_count?: number }>(regions: T[]): T[] {
  return regions.map((r) => ({ ...r, shrine_count: regionShrineCount(r.id, r.shrine_count ?? 0) }));
}
