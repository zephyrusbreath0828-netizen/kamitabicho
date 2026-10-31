/**
 * 神社検索（v1.2）
 *
 * - ページネーション対応（大量データでも一定のメモリ・描画量）
 * - 現在地が分かる場合は近い順を優先
 * - Firestore が落ちている／オフラインの場合は端末データへ自動フォールバック
 */
import { distanceMeters } from "@/lib/geo";
import type { ShrineSearchParams, ShrineSearchResult, ShrineV2 } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 20;

function norm(s: string): string {
  return s.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}

/** 検索対象の文字列を作る（名前・都道府県・市区町村・祭神名・御利益名） */
function haystack(s: ShrineV2, deityNames: Map<string, string>, benefitNames: Map<string, string>): string {
  const d = (s.deities ?? []).map((id) => deityNames.get(id) ?? "").join(" ");
  const b = (s.benefits ?? []).map((id) => benefitNames.get(id) ?? "").join(" ");
  return norm([s.name, s.prefecture, s.city ?? "", s.address, s.main_deity ?? "", d, b].join(" "));
}

export type SearchContext = {
  deityNames: Map<string, string>;
  benefitNames: Map<string, string>;
};

/** 配列に対する検索（オフライン・デモ・フォールバックで共用） */
export function searchInArray(
  all: ShrineV2[],
  params: ShrineSearchParams,
  ctx: SearchContext,
  source: ShrineSearchResult["source"],
): ShrineSearchResult {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? DEFAULT_PAGE_SIZE));
  const q = params.query ? norm(params.query) : "";

  let rows = all.filter((s) => {
    if (params.prefecture && s.prefecture !== params.prefecture) return false;
    if (params.region && s.region !== params.region) return false;
    if (q) return haystack(s, ctx.deityNames, ctx.benefitNames).includes(q);
    return true;
  });

  // 並び替え: 現在地 → 近い順 / それ以外 → ID順（安定）
  if (params.near) {
    const near = params.near;
    rows = rows
      .map((s) => ({
        s,
        d: distanceMeters(near, { latitude: s.latitude, longitude: s.longitude }),
      }))
      .sort((a, b) => a.d - b.d)
      .map((x) => x.s);
  } else {
    rows = [...rows].sort((a, b) => a.id.localeCompare(b.id));
  }

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);
  return { items, total, page, pageSize, hasMore: start + items.length < total, source };
}

/** ページ番号をリセットすべき変更か（フィルタ変更時） */
export function isFilterChange(prev: ShrineSearchParams, next: ShrineSearchParams): boolean {
  return (
    prev.query !== next.query ||
    prev.prefecture !== next.prefecture ||
    prev.region !== next.region ||
    Boolean(prev.near) !== Boolean(next.near)
  );
}
