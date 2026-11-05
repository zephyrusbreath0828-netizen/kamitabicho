/**
 * v1.2 マスタの読み込み
 *
 * JSON を直接 import すると型解決が壊れるため、必ずこの .ts 経由で参照する。
 * Firestore に同じ ID のドキュメントがあれば、そちらの値で上書き（マージ）する。
 */
import shrinesJson from "./shrines.v2.json";
import deitiesJson from "./deities.json";
import benefitsJson from "./benefits.json";
import regionsJson from "./regions.json";
import type { Benefit, Deity, Region, ShrineV2 } from "@/lib/types";

export const SHRINES_V2 = shrinesJson as ShrineV2[];
export const DEITIES: Deity[] = deitiesJson as Deity[];
export const BENEFITS: Benefit[] = benefitsJson as Benefit[];
export const REGIONS: Region[] = regionsJson as Region[];

export const DEITY_BY_ID = new Map(DEITIES.map((d) => [d.id, d]));
export const BENEFIT_BY_ID = new Map(BENEFITS.map((b) => [b.id, b]));
export const REGION_BY_ID = new Map(REGIONS.map((r) => [r.id, r]));

/** 都道府県 → 地方ID */
export const PREFECTURE_TO_REGION: Record<string, Region["id"]> = Object.fromEntries(
  REGIONS.flatMap((r) => r.prefectures.map((p) => [p, r.id])),
);

export function regionOfPrefecture(prefecture: string): Region["id"] {
  return PREFECTURE_TO_REGION[prefecture] ?? "kanto";
}

/** JSON に無い地方IDへのフォールバック（将来の地域追加に備える） */
export function regionName(id: string): string {
  return REGION_BY_ID.get(id as Region["id"])?.name ?? id;
}
