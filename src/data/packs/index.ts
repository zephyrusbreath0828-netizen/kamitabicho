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
import kyushuJson from "./kyushu.json";
import deitiesShikoku from "./deities-shikoku.json";
import benefitsShikoku from "./benefits-shikoku.json";
import historyShikoku from "./history-shikoku.json";
import deitiesChugoku from "./deities-chugoku.json";
import benefitsChugoku from "./benefits-chugoku.json";
import historyChugoku from "./history-chugoku.json";
import deitiesKinki from "./deities-kinki.json";
import benefitsKinki from "./benefits-kinki.json";
import historyKinki from "./history-kinki.json";
import deitiesChubu from "./deities-chubu.json";
import benefitsChubu from "./benefits-chubu.json";
import historyChubu from "./history-chubu.json";
import deitiesKanto from "./deities-kanto.json";
import benefitsKanto from "./benefits-kanto.json";
import historyKanto from "./history-kanto.json";
import { BENEFITS } from "@/data/masters";
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
  kyushu: kyushuJson as PackShrine[],
};

/** パックが存在する地域ID */
export const PACK_REGIONS = Object.keys(RAW) as string[];

export function hasPack(regionId: string): boolean {
  return (RAW[regionId]?.length ?? 0) > 0;
}

/** パックをアプリの神社型へ変換（未設定項目は空で埋める） */
export function packShrines(regionId: string): ShrineV2[] {
  return applySubMasters(packRows(RAW[regionId] ?? [], regionId));
}

function packRows(rows: PackShrine[], regionId: string): ShrineV2[] {
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
        region: r.region || regionId,
        deities: [],
        benefits: [],
        source: r.source,
        data_version: 1,
      }) as unknown as ShrineV2,
  );
}

/** 管理画面で登録したパック（JSON文字列）を神社配列へ変換 */
export function packShrinesFromJson(json: string, regionId: string): ShrineV2[] {
  const rows = JSON.parse(json) as PackShrine[];
  return applySubMasters(packRows(rows, regionId));
}

/* ============================================================
   v2.0 別マスタ（祭神 / 御利益 / 由緒）
   ------------------------------------------------------------
   神社データ（<region>.json）とは分離して管理する。
   deities-<region>.json / benefits-<region>.json / history-<region>.json
   を追加するだけで、他地方へ同じ仕組みを展開できる。
   ============================================================ */

type DeityRow = { shrine_id: string; deities: string[] };
type BenefitRow = { shrine_id: string; benefits: string[] };
type HistoryRow = { shrine_id: string; history: string };

type SubMaster = {
  deities: Map<string, string[]>;
  benefits: Map<string, string[]>;
  history: Map<string, string>;
};

const SUB_SOURCES: Record<string, { deities: DeityRow[]; benefits: BenefitRow[]; history: HistoryRow[] }> = {
  shikoku: {
    deities: deitiesShikoku as DeityRow[],
    benefits: benefitsShikoku as BenefitRow[],
    history: historyShikoku as HistoryRow[],
  },
  chugoku: {
    deities: deitiesChugoku as DeityRow[],
    benefits: benefitsChugoku as BenefitRow[],
    history: historyChugoku as HistoryRow[],
  },
  kinki: {
    deities: deitiesKinki as DeityRow[],
    benefits: benefitsKinki as BenefitRow[],
    history: historyKinki as HistoryRow[],
  },
  chubu: {
    deities: deitiesChubu as DeityRow[],
    benefits: benefitsChubu as BenefitRow[],
    history: historyChubu as HistoryRow[],
  },
  kanto: {
    deities: deitiesKanto as DeityRow[],
    benefits: benefitsKanto as BenefitRow[],
    history: historyKanto as HistoryRow[],
  },
};

const BENEFIT_ID_BY_NAME = new Map(BENEFITS.map((b) => [b.name, b.id]));

/** 御利益名 → 御利益ID（未登録名は b_<name> で自動採番） */
export function benefitIdOfName(name: string): string {
  return BENEFIT_ID_BY_NAME.get(name) ?? `b_${name}`;
}

/** 祭神名 → 祭神ID（deities.json と同じ d_<name> 規約） */
export function deityIdOfName(name: string): string {
  return `d_${name}`;
}

const SUB_MASTERS: Record<string, SubMaster> = Object.fromEntries(
  Object.entries(SUB_SOURCES).map(([regionId, src]) => [
    regionId,
    {
      deities: new Map(src.deities.map((r) => [r.shrine_id, r.deities])),
      benefits: new Map(src.benefits.map((r) => [r.shrine_id, r.benefits])),
      history: new Map(src.history.map((r) => [r.shrine_id, r.history])),
    },
  ]),
);

/** 別マスタを持つ地域ID */
export const SUB_MASTER_REGIONS = Object.keys(SUB_MASTERS);

/** 別マスタの登録件数（管理画面・説明用） */
export function subMasterCounts(regionId: string) {
  const s = SUB_MASTERS[regionId];
  return s ? { deities: s.deities.size, benefits: s.benefits.size, history: s.history.size } : null;
}

/**
 * 神社配列に別マスタ（祭神・御利益・由緒）を合成する。
 * 既存フィールドは変更せず、該当行がある神社のみ追加する（追加方式）。
 */
export function applySubMasters<T extends ShrineV2>(shrines: T[]): T[] {
  const sources = Object.values(SUB_MASTERS);
  if (!sources.length) return shrines;
  return shrines.map((s) => {
    let next: T | null = null;
    for (const sm of sources) {
      const d = sm.deities.get(s.id);
      const b = sm.benefits.get(s.id);
      const h = sm.history.get(s.id);
      if (!d && !b && !h) continue;
      next = next ?? { ...s };
      if (d) next.deities = d.map(deityIdOfName);
      if (b) next.benefits = b.map(benefitIdOfName);
      if (h) next.description = h;
    }
    return next ?? s;
  });
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
