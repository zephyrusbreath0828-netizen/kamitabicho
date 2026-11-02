/**
 * 地域データパック（OpenStreetMap 由来）
 *
 * 配布パックは `src/data/packs/<region>.json` に置く。
 * Firestore に同地域の神社があればそちらを優先し、無い場合（デモ・オフライン・初期状態）は
 * この同梱パックを使う。将来 kinki / chugoku … を追加する場合は JSON を足すだけでよい。
 */
import shikokuJson from "./shikoku.json";
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
