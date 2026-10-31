/**
 * v1.2 マスタデータ生成（既存 shrines.json を壊さず、拡張版を出力する）
 *
 * 入力: src/data/shrines.json（v1.0 からの100社・既存フィールドはそのまま）
 * 出力: src/data/shrines.v2.json / deities.json / benefits.json / regions.json
 *
 * 方針:
 *  - 既存フィールド（id/name/prefecture/address/latitude/longitude/main_deity/description/image_url/visit_count）は変更しない
 *  - 追加フィールド（city / region / deities / benefits）だけを足す
 *  - 御利益は「広く知られた由緒」のみを明示テーブルで付与し、それ以外は空配列
 *    （推測で付与すると誤情報になるため。運営が Firestore 側で追記できる）
 */
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "src/data/shrines.json";
const shrines = JSON.parse(readFileSync(SRC, "utf8"));

const PREF_TO_REGION = {
  北海道: "hokkaido",
  青森県: "tohoku", 岩手県: "tohoku", 宮城県: "tohoku", 秋田県: "tohoku", 山形県: "tohoku", 福島県: "tohoku",
  茨城県: "kanto", 栃木県: "kanto", 群馬県: "kanto", 埼玉県: "kanto", 千葉県: "kanto", 東京都: "kanto", 神奈川県: "kanto",
  新潟県: "chubu", 富山県: "chubu", 石川県: "chubu", 福井県: "chubu", 山梨県: "chubu", 長野県: "chubu",
  岐阜県: "chubu", 静岡県: "chubu", 愛知県: "chubu",
  三重県: "kinki", 滋賀県: "kinki", 京都府: "kinki", 大阪府: "kinki", 兵庫県: "kinki", 奈良県: "kinki", 和歌山県: "kinki",
  鳥取県: "chugoku", 島根県: "chugoku", 岡山県: "chugoku", 広島県: "chugoku", 山口県: "chugoku",
  徳島県: "shikoku", 香川県: "shikoku", 愛媛県: "shikoku", 高知県: "shikoku",
  福岡県: "kyushu", 佐賀県: "kyushu", 長崎県: "kyushu", 熊本県: "kyushu", 大分県: "kyushu",
  宮崎県: "kyushu", 鹿児島県: "kyushu", 沖縄県: "kyushu",
};

const REGIONS = [
  { id: "hokkaido", name: "北海道", order: 1, prefectures: ["北海道"] },
  { id: "tohoku", name: "東北地方", order: 2, prefectures: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"] },
  { id: "kanto", name: "関東地方", order: 3, prefectures: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"] },
  { id: "chubu", name: "中部地方", order: 4, prefectures: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"] },
  { id: "kinki", name: "近畿地方", order: 5, prefectures: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] },
  { id: "chugoku", name: "中国地方", order: 6, prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"] },
  { id: "shikoku", name: "四国地方", order: 7, prefectures: ["徳島県", "香川県", "愛媛県", "高知県"] },
  { id: "kyushu", name: "九州沖縄", order: 8, prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"] },
];

/** 御利益マスタ（カテゴリは検索・絞り込みに使用） */
const BENEFITS = [
  { id: "kaiun", name: "開運", category: "運勢", description: "運気を開き、物事を良い方向へ導く御利益。" },
  { id: "kenko", name: "健康", category: "身体", description: "無病息災・病気平癒の御利益。" },
  { id: "kinun", name: "金運", category: "財", description: "商売繁盛・金運向上の御利益。" },
  { id: "gakugyo", name: "学業", category: "学問", description: "学業成就・合格祈願の御利益。" },
  { id: "yakuyoke", name: "厄除け", category: "守護", description: "災厄を払い、身を守る御利益。" },
  { id: "enmusubi", name: "縁結び", category: "縁", description: "良縁・夫婦和合・縁組の御利益。" },
  { id: "kofuku", name: "子宝", category: "縁", description: "子授け・安産・子育ての御利益。" },
  { id: "shobai", name: "商売繁盛", category: "財", description: "商いの興隆・事業発展の御利益。" },
  { id: "gokoku", name: "五穀豊穣", category: "実り", description: "農耕・漁業の実りと地域の安寧。" },
  { id: "mamori", name: "家内安全", category: "守護", description: "家族の平安と暮らしの安定。" },
  { id: "kotsu", name: "交通安全", category: "守護", description: "道中の無事と旅の安全。" },
  { id: "geino", name: "芸能上達", category: "技芸", description: "技芸・芸能・技術の上達。" },
];

/**
 * 御利益の初期キュレーション（由緒が広く知られている神社のみ）
 * ※ 運営は Firestore の shrines.benefits で追記・修正できる。ここは初期値。
 */
const CURATED_BENEFITS = {
  出雲大社: ["enmusubi", "kaiun"],
  太宰府天満宮: ["gakugyo", "yakuyoke"],
  "伏見稲荷大社": ["shobai", "gokoku", "kaiun"],
  "伊勢神宮（内宮）": ["kaiun", "mamori"],
  "明治神宮": ["kaiun", "mamori"],
  "熱田神宮": ["yakuyoke", "kaiun"],
  川崎大師: ["yakuyoke", "kenko"],
  "成田山新勝寺": ["yakuyoke", "kaiun"],
  浅草寺: ["kaiun", "yakuyoke"],
  "住吉大社": ["kaiun", "mamori"],
  "厳島神社": ["kaiun", "kotsu"],
  "日光東照宮": ["yakuyoke", "kaiun"],
  "鶴岡八幡宮": ["yakuyoke", "kaiun"],
  大宮氷川神社: ["enmusubi", "kaiun"],
  "多賀大社": ["kenko", "enmusubi"],
  伊勢神宮: ["kaiun", "mamori"],
};

const slug = (name) =>
  "d_" + name
    .replace(/[（）()・\s]/g, "_")
    .replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}a-zA-Z0-9_]/gu, "")
    .slice(0, 40);

/** 住所から市区町村を抽出（例: 札幌市中央区宮ヶ丘474 → 札幌市中央区） */
function extractCity(address, prefecture) {
  const cleaned = String(address).replace(prefecture, "").trim();
  const m = cleaned.match(/^(.+?[市区町村])/);
  if (m) return m[1];
  const gun = cleaned.match(/^(.+?郡.+?[町村])/);
  return gun ? gun[1] : cleaned.slice(0, 12);
}

const deityMap = new Map();
const out = shrines.map((s) => {
  const names = String(s.main_deity || "")
    .split(/[・、,]/)
    .map((n) => n.trim())
    .filter(Boolean);
  const deityIds = names.map((n) => {
    const id = slug(n);
    if (!deityMap.has(id)) {
      deityMap.set(id, {
        id,
        name: n,
        description: `${n}（${s.name}のご祭神）`,
        imageUrl: null,
        shrine_count: 0,
      });
    }
    deityMap.get(id).shrine_count += 1;
    return id;
  });
  return {
    ...s, // 既存フィールドはそのまま
    city: extractCity(s.address, s.prefecture),
    region: PREF_TO_REGION[s.prefecture] ?? "kanto",
    deities: deityIds,
    benefits: CURATED_BENEFITS[s.name] ?? [],
  };
});

// 地域ごとの件数（実データに基づく。推測値は入れない）
const regionDocs = REGIONS.map((r) => ({
  ...r,
  shrine_count: out.filter((s) => r.prefectures.includes(s.prefecture)).length,
  updated_at: new Date().toISOString(),
}));

writeFileSync("src/data/shrines.v2.json", JSON.stringify(out, null, 1) + "\n");
writeFileSync("src/data/deities.json", JSON.stringify([...deityMap.values()].sort((a, b) => b.shrine_count - a.shrine_count), null, 1) + "\n");
writeFileSync("src/data/benefits.json", JSON.stringify(BENEFITS, null, 1) + "\n");
writeFileSync("src/data/regions.json", JSON.stringify(regionDocs, null, 1) + "\n");

console.log(`shrines: ${out.length} / deities: ${deityMap.size} / benefits: ${BENEFITS.length} / regions: ${regionDocs.length}`);
for (const r of regionDocs) console.log(`  ${r.name}: ${r.shrine_count}件`);
console.log(`御利益が設定された神社: ${out.filter((s) => s.benefits.length > 0).length}件`);
