/**
 * v1.2 マスタの読み込み（v2.7 で JSON を同梱化しファイル数を削減）
 *
 * 神社（標準100社）は shrines.v2.json、祭神・御利益・地方はこのファイル内に定義する。
 * Firestore に同じ ID のドキュメントがあれば、そちらの値で上書き（マージ）する。
 */
import shrinesJson from "./shrines.v2.json";
import type { Benefit, Deity, Region, RegionId, ShrineV2 } from "@/lib/types";

export const SHRINES_V2 = shrinesJson as ShrineV2[];

export const DEITIES: Deity[] = [
  {
    "id": "d_伊弉諾尊",
    "name": "伊弉諾尊",
    "description": "伊弉諾尊（伊佐須美神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 6
  },
  {
    "id": "d_大己貴命",
    "name": "大己貴命",
    "description": "大己貴命（太平山三吉神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 5
  },
  {
    "id": "d_伊弉冉尊",
    "name": "伊弉冉尊",
    "description": "伊弉冉尊（伊佐須美神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 5
  },
  {
    "id": "d_応神天皇",
    "name": "応神天皇",
    "description": "応神天皇（明治神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 5
  },
  {
    "id": "d_神功皇后",
    "name": "神功皇后",
    "description": "神功皇后（鶴岡八幡宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 5
  },
  {
    "id": "d_比売神",
    "name": "比売神",
    "description": "比売神（鶴岡八幡宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 4
  },
  {
    "id": "d_市杵島姫命",
    "name": "市杵島姫命",
    "description": "市杵島姫命（松尾大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 4
  },
  {
    "id": "d_少彦名命",
    "name": "少彦名命",
    "description": "少彦名命（太平山三吉神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 3
  },
  {
    "id": "d_田心姫命",
    "name": "田心姫命",
    "description": "田心姫命（日光二荒山神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 3
  },
  {
    "id": "d_大山咋神",
    "name": "大山咋神",
    "description": "大山咋神（日枝神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 3
  },
  {
    "id": "d_彦火火出見尊",
    "name": "彦火火出見尊",
    "description": "彦火火出見尊（箱根神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 3
  },
  {
    "id": "d_天照大神",
    "name": "天照大神",
    "description": "天照大神（雄山神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 3
  },
  {
    "id": "d_伊邪那岐命",
    "name": "伊邪那岐命",
    "description": "伊邪那岐命（出羽三山神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 2
  },
  {
    "id": "d_伊邪那美命",
    "name": "伊邪那美命",
    "description": "伊邪那美命（出羽三山神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 2
  },
  {
    "id": "d_稲荷大神",
    "name": "稲荷大神",
    "description": "稲荷大神（千代保稲荷神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 2
  },
  {
    "id": "d_天照大御神",
    "name": "天照大御神",
    "description": "天照大御神（明治神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 2
  },
  {
    "id": "d_須佐之男命",
    "name": "須佐之男命",
    "description": "須佐之男命（氷川神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 2
  },
  {
    "id": "d_木花咲耶姫命",
    "name": "木花咲耶姫命",
    "description": "木花咲耶姫命（箱根神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 2
  },
  {
    "id": "d_高龗神",
    "name": "高龗神",
    "description": "高龗神（大山阿夫利神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 2
  },
  {
    "id": "d_八幡大神",
    "name": "八幡大神",
    "description": "八幡大神（寒川神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 2
  },
  {
    "id": "d_大物主神",
    "name": "大物主神",
    "description": "大物主神（日吉大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 2
  },
  {
    "id": "d_日本武尊",
    "name": "日本武尊",
    "description": "日本武尊（建部大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 2
  },
  {
    "id": "d_菅原道真公",
    "name": "菅原道真公",
    "description": "菅原道真公（北野天満宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 2
  },
  {
    "id": "d_玉依姫命",
    "name": "玉依姫命",
    "description": "玉依姫命（下鴨神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 2
  },
  {
    "id": "d_天児屋根命",
    "name": "天児屋根命",
    "description": "天児屋根命（枚岡神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 2
  },
  {
    "id": "d_熊野夫須美大神",
    "name": "熊野夫須美大神",
    "description": "熊野夫須美大神（熊野速玉大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 2
  },
  {
    "id": "d_大吉備津彦命",
    "name": "大吉備津彦命",
    "description": "大吉備津彦命（吉備津神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 2
  },
  {
    "id": "d_湍津姫命",
    "name": "湍津姫命",
    "description": "湍津姫命（厳島神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 2
  },
  {
    "id": "d_大国魂神",
    "name": "大国魂神",
    "description": "大国魂神（北海道神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_大那牟遅神",
    "name": "大那牟遅神",
    "description": "大那牟遅神（北海道神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_少彦名神",
    "name": "少彦名神",
    "description": "少彦名神（北海道神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_顕国魂神",
    "name": "顕国魂神",
    "description": "顕国魂神（岩木山神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_多都比売神",
    "name": "多都比売神",
    "description": "多都比売神（岩木山神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_宇賀能売神",
    "name": "宇賀能売神",
    "description": "宇賀能売神（岩木山神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_品陀和気命",
    "name": "品陀和気命",
    "description": "品陀和気命（盛岡八幡宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_大帯比売命",
    "name": "大帯比売命",
    "description": "大帯比売命（盛岡八幡宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_息長帯比売命",
    "name": "息長帯比売命",
    "description": "息長帯比売命（盛岡八幡宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_塩土老翁神",
    "name": "塩土老翁神",
    "description": "塩土老翁神（鹽竈神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_武甕槌神",
    "name": "武甕槌神",
    "description": "武甕槌神（鹽竈神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_経津主神",
    "name": "経津主神",
    "description": "経津主神（鹽竈神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_三吉霊神",
    "name": "三吉霊神",
    "description": "三吉霊神（太平山三吉神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_月読命",
    "name": "月読命",
    "description": "月読命（出羽三山神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_二荒山大神_大己貴命",
    "name": "二荒山大神（大己貴命",
    "description": "二荒山大神（大己貴命（日光二荒山神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_味耜高彦根命_",
    "name": "味耜高彦根命）",
    "description": "味耜高彦根命）（日光二荒山神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_徳川家康公_東照大権現_",
    "name": "徳川家康公（東照大権現）",
    "description": "徳川家康公（東照大権現）（日光東照宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_火産霊神",
    "name": "火産霊神",
    "description": "火産霊神（榛名神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_埴山姫神",
    "name": "埴山姫神",
    "description": "埴山姫神（榛名神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_金山彦命",
    "name": "金山彦命",
    "description": "金山彦命（南宮大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_大毘古命",
    "name": "大毘古命",
    "description": "大毘古命（伊佐須美神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_建沼河別命",
    "name": "建沼河別命",
    "description": "建沼河別命（伊佐須美神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_武甕槌大神",
    "name": "武甕槌大神",
    "description": "武甕槌大神（鹿島神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_経津主大神",
    "name": "経津主大神",
    "description": "経津主大神（香取神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_天照皇大神",
    "name": "天照皇大神",
    "description": "天照皇大神（東京大神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_豊受大神",
    "name": "豊受大神",
    "description": "豊受大神（東京大神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_平将門命",
    "name": "平将門命",
    "description": "平将門命（神田明神のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_土師真中知命",
    "name": "土師真中知命",
    "description": "土師真中知命（浅草神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_檜前浜成命",
    "name": "檜前浜成命",
    "description": "檜前浜成命（浅草神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_檜前武成命",
    "name": "檜前武成命",
    "description": "檜前武成命（浅草神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_稲田姫命",
    "name": "稲田姫命",
    "description": "稲田姫命（氷川神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_八意思兼命",
    "name": "八意思兼命",
    "description": "八意思兼命（秩父神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_知知夫彦命",
    "name": "知知夫彦命",
    "description": "知知夫彦命（秩父神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_素盞嗚尊",
    "name": "素盞嗚尊",
    "description": "素盞嗚尊（川越氷川神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_奇稲田姫命",
    "name": "奇稲田姫命",
    "description": "奇稲田姫命（川越氷川神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_瓊瓊杵尊",
    "name": "瓊瓊杵尊",
    "description": "瓊瓊杵尊（箱根神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_大山祇大神",
    "name": "大山祇大神",
    "description": "大山祇大神（大山阿夫利神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_大雷神",
    "name": "大雷神",
    "description": "大雷神（大山阿夫利神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_寒川比古命",
    "name": "寒川比古命",
    "description": "寒川比古命（寒川神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_寒川比女命",
    "name": "寒川比女命",
    "description": "寒川比女命（寒川神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_天香山命",
    "name": "天香山命",
    "description": "天香山命（彌彦神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_菊理媛神",
    "name": "菊理媛神",
    "description": "菊理媛神（白山比咩神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_前田利家公",
    "name": "前田利家公",
    "description": "前田利家公（尾山神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_芳春院",
    "name": "芳春院",
    "description": "芳春院（尾山神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_伊奢沙別命",
    "name": "伊奢沙別命",
    "description": "伊奢沙別命（氣比神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_仲哀天皇",
    "name": "仲哀天皇",
    "description": "仲哀天皇（氣比神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_木花開耶姫命",
    "name": "木花開耶姫命",
    "description": "木花開耶姫命（北口本宮冨士浅間神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_武田信玄公",
    "name": "武田信玄公",
    "description": "武田信玄公（武田神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_建御名方神",
    "name": "建御名方神",
    "description": "建御名方神（諏訪大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_八坂刀売神",
    "name": "八坂刀売神",
    "description": "八坂刀売神（諏訪大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_天手力雄命",
    "name": "天手力雄命",
    "description": "天手力雄命（戸隠神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_穂高見命",
    "name": "穂高見命",
    "description": "穂高見命（穂高神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_浅間大神_木花之佐久夜毘売命_",
    "name": "浅間大神（木花之佐久夜毘売命）",
    "description": "浅間大神（木花之佐久夜毘売命）（富士山本宮浅間大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_徳川家康公",
    "name": "徳川家康公",
    "description": "徳川家康公（久能山東照宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_大山祇命",
    "name": "大山祇命",
    "description": "大山祇命（三嶋大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_積羽八重事代主神",
    "name": "積羽八重事代主神",
    "description": "積羽八重事代主神（三嶋大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_熱田大神_草薙剣_",
    "name": "熱田大神（草薙剣）",
    "description": "熱田大神（草薙剣）（熱田神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_建速須佐之男命",
    "name": "建速須佐之男命",
    "description": "建速須佐之男命（津島神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_天津彦根命",
    "name": "天津彦根命",
    "description": "天津彦根命（多度大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_天目一箇命",
    "name": "天目一箇命",
    "description": "天目一箇命（多度大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_猿田彦大神",
    "name": "猿田彦大神",
    "description": "猿田彦大神（椿大神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_豊受大御神",
    "name": "豊受大御神",
    "description": "豊受大御神（伊勢神宮（外宮）のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_宇迦之御魂大神",
    "name": "宇迦之御魂大神",
    "description": "宇迦之御魂大神（伏見稲荷大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_素戔嗚尊",
    "name": "素戔嗚尊",
    "description": "素戔嗚尊（八坂神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_櫛稲田姫命",
    "name": "櫛稲田姫命",
    "description": "櫛稲田姫命（八坂神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_八柱御子神",
    "name": "八柱御子神",
    "description": "八柱御子神（八坂神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_桓武天皇",
    "name": "桓武天皇",
    "description": "桓武天皇（平安神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_孝明天皇",
    "name": "孝明天皇",
    "description": "孝明天皇（平安神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_賀茂建角身命",
    "name": "賀茂建角身命",
    "description": "賀茂建角身命（下鴨神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_賀茂別雷大神",
    "name": "賀茂別雷大神",
    "description": "賀茂別雷大神（上賀茂神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_住吉三神",
    "name": "住吉三神",
    "description": "住吉三神（住吉大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_大鳥連祖神",
    "name": "大鳥連祖神",
    "description": "大鳥連祖神（大鳥大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_稚日女尊",
    "name": "稚日女尊",
    "description": "稚日女尊（生田神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_楠木正成公",
    "name": "楠木正成公",
    "description": "楠木正成公（湊川神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_事代主神",
    "name": "事代主神",
    "description": "事代主神（長田神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_武甕槌命",
    "name": "武甕槌命",
    "description": "武甕槌命（春日大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_経津主命",
    "name": "経津主命",
    "description": "経津主命（春日大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_大物主大神",
    "name": "大物主大神",
    "description": "大物主大神（大神神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_布都御魂大神",
    "name": "布都御魂大神",
    "description": "布都御魂大神（石上神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_神武天皇",
    "name": "神武天皇",
    "description": "神武天皇（橿原神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_媛蹈鞴五十鈴媛命",
    "name": "媛蹈鞴五十鈴媛命",
    "description": "媛蹈鞴五十鈴媛命（橿原神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_国常立尊",
    "name": "国常立尊",
    "description": "国常立尊（玉置神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_家津美御子大神",
    "name": "家津美御子大神",
    "description": "家津美御子大神（熊野本宮大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_速玉大神",
    "name": "速玉大神",
    "description": "速玉大神（熊野本宮大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_夫須美大神",
    "name": "夫須美大神",
    "description": "夫須美大神（熊野本宮大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_熊野速玉大神",
    "name": "熊野速玉大神",
    "description": "熊野速玉大神（熊野速玉大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_日前大神",
    "name": "日前大神",
    "description": "日前大神（日前神宮・國懸神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_國懸大神",
    "name": "國懸大神",
    "description": "國懸大神（日前神宮・國懸神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_丹生都比売大神",
    "name": "丹生都比売大神",
    "description": "丹生都比売大神（丹生都比売神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_武内宿禰命",
    "name": "武内宿禰命",
    "description": "武内宿禰命（宇倍神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_大国主大神",
    "name": "大国主大神",
    "description": "大国主大神（出雲大社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_安徳天皇",
    "name": "安徳天皇",
    "description": "安徳天皇（赤間神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_大麻比古大神",
    "name": "大麻比古大神",
    "description": "大麻比古大神（大麻比古神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_天太玉命",
    "name": "天太玉命",
    "description": "天太玉命（大麻比古神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_崇徳天皇",
    "name": "崇徳天皇",
    "description": "崇徳天皇（金刀比羅宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_大山積大神",
    "name": "大山積大神",
    "description": "大山積大神（大山祇神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_味鋤高彦根神",
    "name": "味鋤高彦根神",
    "description": "味鋤高彦根神（土佐神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_一言主神",
    "name": "一言主神",
    "description": "一言主神（土佐神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_諏訪大神",
    "name": "諏訪大神",
    "description": "諏訪大神（諏訪神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_森崎大神",
    "name": "森崎大神",
    "description": "森崎大神（諏訪神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_住吉大神",
    "name": "住吉大神",
    "description": "住吉大神（諏訪神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_健磐龍命ほか十二神",
    "name": "健磐龍命ほか十二神",
    "description": "健磐龍命ほか十二神（阿蘇神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_比売大神",
    "name": "比売大神",
    "description": "比売大神（宇佐神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_豊玉姫命",
    "name": "豊玉姫命",
    "description": "豊玉姫命（青島神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_塩筒大神",
    "name": "塩筒大神",
    "description": "塩筒大神（青島神社のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_天饒石国饒石天津日高彦火瓊瓊杵尊",
    "name": "天饒石国饒石天津日高彦火瓊瓊杵尊",
    "description": "天饒石国饒石天津日高彦火瓊瓊杵尊（霧島神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_天津日高彦穂穂出見尊",
    "name": "天津日高彦穂穂出見尊",
    "description": "天津日高彦穂穂出見尊（鹿児島神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_豊玉比売命",
    "name": "豊玉比売命",
    "description": "豊玉比売命（鹿児島神宮のご祭神）",
    "imageUrl": null,
    "shrine_count": 1
  },
  {
    "id": "d_倭迹迹日百襲媛命",
    "name": "倭迹迹日百襲媛命",
    "description": "孝霊天皇の皇女。祟神を鎮める巫女的な性格を持ち、厄除けの神として信仰される。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_石土毘古神",
    "name": "石土毘古神",
    "description": "石鎚山の神。力強く岩を司る山岳神で、開運・厄除けの信仰を集める。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_一言主大神",
    "name": "一言主大神",
    "description": "一言だけ願いを叶えると伝わる神。土佐神社の主祭神で、厄除け・開運の神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_味鋺高彦根神",
    "name": "味鋺高彦根神",
    "description": "大国主神の子神。雷・剣の神として知られ、武勇と開運を司る。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_大宜都比売命",
    "name": "大宜都比売命",
    "description": "阿波国に伝わる食物の女神。粟・五穀を司り、衣食住の守護神とされる。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_菅原道真",
    "name": "菅原道真",
    "description": "学問・文芸の神として信仰される天神。天満宮の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_宇迦之御魂神",
    "name": "宇迦之御魂神",
    "description": "稲荷神。五穀豊穣・商売繁盛・金運の神として全国で祀られる。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_底筒男命",
    "name": "底筒男命",
    "description": "住吉三神の一柱。航海・海上安全を守る海神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_中筒男命",
    "name": "中筒男命",
    "description": "住吉三神の一柱。航海・海上安全を守る海神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_表筒男命",
    "name": "表筒男命",
    "description": "住吉三神の一柱。航海・海上安全を守る海神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_火之迦具土神",
    "name": "火之迦具土神",
    "description": "火の神。愛宕・秋葉神社に祀られ、火防・厄除けの神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_別雷神",
    "name": "別雷神",
    "description": "賀茂神社の祭神。雷を司り、厄除け・開運・縁結びの神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_大山祇神",
    "name": "大山祇神",
    "description": "山の神。三島神社・大山祇神社に祀られ、海上安全・五穀豊穣の神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_武内宿禰",
    "name": "武内宿禰",
    "description": "第12代景行天皇から第16代仁徳天皇まで五代の天皇に仕えた忠臣。長寿の神として信仰される。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_稲田比売命",
    "name": "稲田比売命",
    "description": "素盞嗚尊の妻神。八岐大蛇退治の後に夫婦となった。縁結び・家内安全の神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_徳川家康",
    "name": "徳川家康",
    "description": "江戸幕府初代将軍。東照宮の祭神として国家安泰・開運の神とされる。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_神直日神",
    "name": "神直日神",
    "description": "直毘神の一柱。禍を直し福に転じる神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_玉依媛命",
    "name": "玉依媛命",
    "description": "賀茂建角身命の娘。賀茂別雷神の母神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_賀茂別雷神",
    "name": "賀茂別雷神",
    "description": "雷を司る神。上賀茂神社の祭神で、厄除けの信仰を集める。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_藤原鎌足",
    "name": "藤原鎌足",
    "description": "大化の改新の中心人物。藤原氏の祖。談山神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_蛭児大神",
    "name": "蛭児大神",
    "description": "えびす神。西宮神社の祭神で、商売繁盛の神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_國懸神",
    "name": "國懸神",
    "description": "國懸神宮の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_月読尊",
    "name": "月読尊",
    "description": "月を司る神。伊弉諾尊の子。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_清原頼業",
    "name": "清原頼業",
    "description": "平安末期の儒学者。車折神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_今木神",
    "name": "今木神",
    "description": "平野神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_北畠親房",
    "name": "北畠親房",
    "description": "南北朝時代の公卿。南朝の忠臣。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_北畠顕家",
    "name": "北畠顕家",
    "description": "南北朝時代の武将。北畠親房の子。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_酒解神",
    "name": "酒解神",
    "description": "酒造りの神。梅宮大社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_熱田大神",
    "name": "熱田大神",
    "description": "草薙神剣（天叢雲剣）の神霊。熱田神宮の祭神で、国土守護の神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_前田利家",
    "name": "前田利家",
    "description": "加賀藩の始祖。尾山神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_生島大神",
    "name": "生島大神",
    "description": "国土生成を司る神。生島足島神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_足島大神",
    "name": "足島大神",
    "description": "国土生成を司る神。生島足島神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_金山彦神",
    "name": "金山彦神",
    "description": "鉱山・金属の神。南宮大社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_五十瓊敷入彦命",
    "name": "五十瓊敷入彦命",
    "description": "第11代垂仁天皇の皇子。伊奈波神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_御歳大神",
    "name": "御歳大神",
    "description": "五穀豊穣を司る神。水無神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_大県大神",
    "name": "大県大神",
    "description": "大荒田命。大縣神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_大巳貴命",
    "name": "大巳貴命",
    "description": "大国主命の別名。尾張大国霊神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_武田信玄",
    "name": "武田信玄",
    "description": "甲斐の戦国大名。武田神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_明治天皇",
    "name": "明治天皇",
    "description": "第122代天皇。明治維新を断行し、近代日本の基礎を築いた。明治神宮の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_味耜高彦根命",
    "name": "味耜高彦根命",
    "description": "大国主神の子神。雷・剣の神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_二荒山大神",
    "name": "二荒山大神",
    "description": "日光山の神。勝道上人が開山した日光の地主神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_豊城入彦命",
    "name": "豊城入彦命",
    "description": "第10代崇神天皇の皇子。東国経営を担った。宇都宮二荒山神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_火雷神",
    "name": "火雷神",
    "description": "雷を司る神。榛名神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_赤城大神",
    "name": "赤城大神",
    "description": "赤城山の神。赤城神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_久那斗神",
    "name": "久那斗神",
    "description": "道の神。息栖神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_妙見尊星王",
    "name": "妙見尊星王",
    "description": "北極星・北斗七星を神格化した神。千葉神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_不動明王",
    "name": "不動明王",
    "description": "仏教の守護神。成田山新勝寺の本尊。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_帝釈天",
    "name": "帝釈天",
    "description": "仏教の守護神。柴又帝釈天の本尊。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_弘法大師",
    "name": "弘法大師",
    "description": "空海。真言宗の開祖。川崎大師の本尊。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_護国の英霊",
    "name": "護国の英霊",
    "description": "国難に殉じた人々の霊。靖国神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_宗吾",
    "name": "宗吾",
    "description": "佐倉惣五郎。年貢減免を訴えた義民。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_志波彦大神",
    "name": "志波彦大神",
    "description": "陸奥の古社・志波彦神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_倉稲魂神",
    "name": "倉稲魂神",
    "description": "稲荷神の別名。五穀豊穣・商売繁盛の神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_保食神",
    "name": "保食神",
    "description": "食物の神。五穀の起源を伝える。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_顕国玉神",
    "name": "顕国玉神",
    "description": "国土を司る神。岩木山神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_多都比姫神",
    "name": "多都比姫神",
    "description": "顕国玉神の妻神。岩木山神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_駒形大神",
    "name": "駒形大神",
    "description": "馬の神。陸中国一宮・駒形神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_大物忌大神",
    "name": "大物忌大神",
    "description": "鳥海山の神。出羽国一宮・大物忌神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_伊達政宗",
    "name": "伊達政宗",
    "description": "仙台藩初代藩主。青葉神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_阿弥陀如来",
    "name": "阿弥陀如来",
    "description": "西方極楽浄土の教主。定義如来の本尊。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_地蔵菩薩",
    "name": "地蔵菩薩",
    "description": "衆生を救う菩薩。恐山菩提寺の本尊。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_松前泰広",
    "name": "松前泰広",
    "description": "松前藩の祖。松前神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_日子波限建鵜葺草葺不合命",
    "name": "日子波限建鵜葺草葺不合命",
    "description": "彦火火出見尊の子。鵜戸神宮の祭神で、神武天皇の父。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_健磐龍命",
    "name": "健磐龍命",
    "description": "阿蘇山の開拓神。阿蘇神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_大幡主命",
    "name": "大幡主命",
    "description": "櫛田神社の祭神。博多の総鎮守。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_正哉吾勝勝速日天忍穂耳命",
    "name": "正哉吾勝勝速日天忍穂耳命",
    "description": "天照大神の子。天孫降臨の指令を受けた。英彦山神宮の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_田島大神",
    "name": "田島大神",
    "description": "田島神社の祭神。海上安全の神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_菊池武時",
    "name": "菊池武時",
    "description": "南北朝時代の武将。南朝の忠臣。菊池神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_懐良親王",
    "name": "懐良親王",
    "description": "南北朝時代の皇子。九州を治めた。八代宮の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_天津日高彦火火出見尊",
    "name": "天津日高彦火火出見尊",
    "description": "山幸彦。鹿児島神宮の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_島津斉彬",
    "name": "島津斉彬",
    "description": "薩摩藩第11代藩主。照国神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_開聞宮",
    "name": "開聞宮",
    "description": "枚聞神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_高千穂皇神",
    "name": "高千穂皇神",
    "description": "高千穂神社の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  },
  {
    "id": "d_熊野大神",
    "name": "熊野大神",
    "description": "末吉宮の祭神。",
    "imageUrl": null,
    "shrine_count": 0
  }
] as Deity[];

export const BENEFITS: Benefit[] = [
  {
    "id": "kaiun",
    "name": "開運",
    "category": "運勢",
    "description": "運気を開き、物事を良い方向へ導く御利益。"
  },
  {
    "id": "kenko",
    "name": "健康",
    "category": "身体",
    "description": "無病息災・病気平癒の御利益。"
  },
  {
    "id": "kinun",
    "name": "金運",
    "category": "財",
    "description": "商売繁盛・金運向上の御利益。"
  },
  {
    "id": "gakugyo",
    "name": "学業成就",
    "category": "学問",
    "description": "学業成就・合格祈願の御利益。"
  },
  {
    "id": "yakuyoke",
    "name": "厄除け",
    "category": "守護",
    "description": "災厄を払い、身を守る御利益。"
  },
  {
    "id": "enmusubi",
    "name": "縁結び",
    "category": "縁",
    "description": "良縁・夫婦和合・縁組の御利益。"
  },
  {
    "id": "kofuku",
    "name": "子宝",
    "category": "縁",
    "description": "子授け・安産・子育ての御利益。"
  },
  {
    "id": "shobai",
    "name": "商売繁盛",
    "category": "財",
    "description": "商いの興隆・事業発展の御利益。"
  },
  {
    "id": "gokoku",
    "name": "五穀豊穣",
    "category": "実り",
    "description": "農耕・漁業の実りと地域の安寧。"
  },
  {
    "id": "mamori",
    "name": "家内安全",
    "category": "守護",
    "description": "家族の平安と暮らしの安定。"
  },
  {
    "id": "kotsu",
    "name": "交通安全",
    "category": "守護",
    "description": "道中の無事と旅の安全。"
  },
  {
    "id": "geino",
    "name": "芸能上達",
    "category": "技芸",
    "description": "技芸・芸能・技術の上達。"
  },
  {
    "id": "anzan",
    "name": "安産",
    "category": "縁",
    "description": "安産・子授け・子育ての御利益。"
  },
  {
    "id": "byoki",
    "name": "病気平癒",
    "category": "身体",
    "description": "病気の平癒・無病息災の御利益。"
  },
  {
    "id": "kaijo",
    "name": "海上安全",
    "category": "守護",
    "description": "航海・漁業・海上交通の安全を守る御利益。"
  },
  {
    "id": "kokka",
    "name": "国家安泰",
    "category": "国",
    "description": "国家の安泰・世の平和を願う御利益。"
  },
  {
    "id": "supotsu",
    "name": "スポーツ成就",
    "category": "技芸",
    "description": "勝運・武勇・競技の成就の御利益。"
  },
  {
    "id": "shuzo",
    "name": "酒造安全",
    "category": "産業",
    "description": "酒造りの安全と繁栄の御利益。"
  },
  {
    "id": "buyu",
    "name": "武運長久",
    "category": "守護",
    "description": "武運・勝運・武勇の御利益。"
  }
] as Benefit[];

export const REGIONS: Region[] = [
  {
    "id": "hokkaido",
    "name": "北海道",
    "order": 1,
    "prefectures": [
      "北海道"
    ],
    "shrine_count": 835,
    "updated_at": "2026-11-01T00:00:00.000Z",
    "version": 1,
    "release": "available",
    "download_size": 0
  },
  {
    "id": "tohoku",
    "name": "東北地方",
    "order": 2,
    "prefectures": [
      "青森県",
      "岩手県",
      "宮城県",
      "秋田県",
      "山形県",
      "福島県"
    ],
    "shrine_count": 2684,
    "updated_at": "2026-11-01T00:00:00.000Z",
    "version": 1,
    "release": "available",
    "download_size": 0
  },
  {
    "id": "kanto",
    "name": "関東地方",
    "order": 3,
    "prefectures": [
      "茨城県",
      "栃木県",
      "群馬県",
      "埼玉県",
      "千葉県",
      "東京都",
      "神奈川県"
    ],
    "shrine_count": 4674,
    "updated_at": "2026-11-01T00:00:00.000Z",
    "version": 1,
    "release": "available",
    "download_size": 0
  },
  {
    "id": "chubu",
    "name": "中部地方",
    "order": 4,
    "prefectures": [
      "新潟県",
      "富山県",
      "石川県",
      "福井県",
      "山梨県",
      "長野県",
      "岐阜県",
      "静岡県",
      "愛知県"
    ],
    "shrine_count": 3819,
    "updated_at": "2026-11-04T00:00:00.000Z",
    "version": 1,
    "release": "available",
    "download_size": 1877719,
    "source": "openstreetmap"
  },
  {
    "id": "kinki",
    "name": "近畿地方",
    "order": 5,
    "prefectures": [
      "三重県",
      "滋賀県",
      "京都府",
      "大阪府",
      "兵庫県",
      "奈良県",
      "和歌山県"
    ],
    "shrine_count": 3555,
    "updated_at": "2026-11-04T00:00:00.000Z",
    "version": 1,
    "release": "available",
    "download_size": 1745065,
    "source": "openstreetmap"
  },
  {
    "id": "chugoku",
    "name": "中国地方",
    "order": 6,
    "prefectures": [
      "鳥取県",
      "島根県",
      "岡山県",
      "広島県",
      "山口県"
    ],
    "shrine_count": 1851,
    "updated_at": "2026-11-04T00:00:00.000Z",
    "version": 1,
    "release": "available",
    "download_size": 889952,
    "source": "openstreetmap"
  },
  {
    "id": "shikoku",
    "name": "四国地方",
    "order": 7,
    "prefectures": [
      "徳島県",
      "香川県",
      "愛媛県",
      "高知県"
    ],
    "shrine_count": 1079,
    "updated_at": "2026-11-04T00:00:00.000Z",
    "version": 1,
    "release": "available",
    "download_size": 515270,
    "source": "openstreetmap"
  },
  {
    "id": "kyushu",
    "name": "九州・沖縄地方",
    "order": 8,
    "prefectures": [
      "福岡県",
      "佐賀県",
      "長崎県",
      "熊本県",
      "大分県",
      "宮崎県",
      "鹿児島県",
      "沖縄県"
    ],
    "shrine_count": 1642,
    "updated_at": "2026-11-04T00:00:00.000Z",
    "version": 1,
    "release": "available",
    "download_size": 804050,
    "source": "openstreetmap"
  }
] as Region[];


/** 祭神の別名グループ（v2.11.2）: 図鑑の関連神社数を同一神格で合算する */
export const DEITY_GROUPS: string[][] = [
  ["大国主大神", "大国主命", "大己貴命", "大己貴神", "大物主大神", "大巳貴命"],
  ["天照大神", "天照大御神", "天照皇大神"],
  ["素盞嗚尊", "須佐之男命", "素戔嗚尊", "建速須佐之男命"],
  ["菅原道真公", "菅原道真"],
  ["宇迦之御魂神", "宇迦之御魂大神", "倉稲魂神", "稲荷大神"],
  ["応神天皇", "品陀和気命", "八幡大神"],
  ["木花開耶姫命", "木花咲耶姫命", "浅間大神_木花之佐久夜毘売命_", "木花之佐久夜毘売命"],
  ["大山祇神", "大山祇大神", "大山祇命", "大山積大神", "阿蘇大神"],
  ["武甕槌神", "武甕槌大神", "武甕槌命"],
  ["経津主神", "経津主大神", "経津主命"],
  ["月読命", "月読尊"],
  ["豊受大神", "豊受大御神"],
  ["事代主神", "積羽八重事代主神"],
  ["伊弉諾尊", "伊邪那岐命"],
  ["伊弉冉尊", "伊邪那美命"],
  ["少彦名命", "少彦名神"],
  ["賀茂別雷神", "賀茂別雷大神"],
  ["熱田大神", "熱田大神_草薙剣_"],
  ["徳川家康", "徳川家康公", "徳川家康公_東照大権現_"],
  ["武田信玄", "武田信玄公", "勝頼大神"],
  ["前田利家", "前田利家公"],
  ["味耜高彦根命", "味鋤高彦根神", "味鋺高彦根神"],
  ["比売神", "比売大神"],
  ["熊野大神", "熊野夫須美大神", "夫須美大神"],
  ["國懸大神", "國懸神"],
  ["顕国魂神", "顕国玉神", "大国魂神", "日本大国魂大神"],
  ["多都比姫神", "多都比売神"],
  ["健磐龍命", "健磐龍命ほか十二神", "健軍大神"],
  ["玉依姫命", "玉依媛命"],
  ["蛭児大神", "蛭子神"],
  ["金山彦命", "金山彦神"],
  ["瓊瓊杵尊", "天饒石国饒石天津日高彦火瓊瓊杵尊"],
  ["彦火火出見尊", "天津日高彦穂穂出見尊", "天津日高彦火火出見尊"],
  ["豊玉姫命", "豊玉比売命"],
  ["住吉三神", "底筒男命", "中筒男命", "表筒男命"],
  ["神功皇后", "息長足姫命", "息長足比売命", "大帯比売命", "息長帯比売命"],
  ["菊理媛神", "菊理媛命"],
];

const DEITY_GROUP_OF = new Map<string, string>(
  DEITY_GROUPS.flatMap((g) => g.map((n) => [n, g[0]] as const)),
);

/** 祭神IDを同一神格の代表IDへ寄せる（別名表記の関連社数を合算） */
export function deityGroupId(id: string): string {
  const name = id.replace(/^d_/, "");
  return `d_${DEITY_GROUP_OF.get(name) ?? name}`;
}


/** 祭神の神格・神徳・解説（v2.11.6 祭神詳細） */
export type DeityProfile = { rank: string; virtue: string; desc: string };

export const DEITY_PROFILES: Record<string, DeityProfile> = {
  天照大神: { rank: "太陽神／皇祖神", virtue: "開運・国家安泰・家内安全", desc: "太陽を神格化した皇祖神。高天原を統べる存在として、皇室の祖神に位置づけられる。伊勢神宮をはじめ各地の神明社に祀られ、国家の安泰と五穀の実りを願う信仰の中心となってきた。" },
  天照大御神: { rank: "太陽神／皇祖神", virtue: "開運・国家安泰・家内安全", desc: "太陽を神格化した皇祖神。高天原の主宰神であり、皇室の祖神とされる。天岩戸の神話に象徴されるように、光と生命の根源として崇敬されてきた。" },
  素盞嗚尊: { rank: "荒ぶる神／厄除けの神", virtue: "厄除け・開運・縁結び", desc: "伊弉諾尊の子で、八岐大蛇を退治した英雄神。荒々しい力とともに、疫病や災厄を祓う神として崇敬される。八坂神社や津島神社など祇園信仰の中心に祀られる。" },
  須佐之男命: { rank: "荒ぶる神／厄除けの神", virtue: "厄除け・開運・縁結び", desc: "八岐大蛇退治で知られる英雄神。出雲を中心に信仰を広げ、厄除けと縁結びの神として各地で祀られる。" },
  菅原道真: { rank: "学問神／天神", virtue: "学業成就・開運・厄除け", desc: "平安前期の学者・政治家で、没後に天神として祀られた。学問と芸術の神として崇敬され、天満宮・天神社の祭神として全国に広がる。" },
  菅原道真公: { rank: "学問神／天神", virtue: "学業成就・開運・厄除け", desc: "平安前期の学者・政治家。無実の罪で左遷された後、天神として祀られ、学問成就と厄除けの神として全国の天満宮に鎮まる。" },
  大国主大神: { rank: "国造りの神", virtue: "縁結び・開運・商売繁盛", desc: "出雲大社の主祭神。国土を開拓した国造りの神であり、縁結びの神として広く親しまれる。因幡の白兎の説話でも知られる。" },
  大己貴命: { rank: "国造りの神", virtue: "縁結び・開運・病気平癒", desc: "大国主神の別名。国土経営に尽くした神で、医薬・縁結びの神徳を持つとされる。" },
  大物主神: { rank: "蛇神／酒造の神", virtue: "商売繁盛・五穀豊穣・縁結び", desc: "三輪山を神体山とする大神神社の祭神。蛇神として水と酒の神徳を持ち、酒造・農耕の守護神として崇敬される。" },
  宇迦之御魂神: { rank: "稲荷神／食物神", virtue: "商売繁盛・五穀豊穣・金運", desc: "稲荷神の中心とされる食物・穀物の神。稲荷神社の祭神として全国に祀られ、商売繁盛と家業の隆盛を願う信仰を集める。" },
  応神天皇: { rank: "八幡神／武神", virtue: "武運長久・開運・厄除け", desc: "第15代天皇で、八幡神として神格化された。武運と国家鎮護の神として武家の崇敬を受け、全国の八幡宮に祀られる。" },
  神功皇后: { rank: "武神／安産の神", virtue: "安産・武運長久・開運", desc: "応神天皇の母。三韓出兵の伝承を持ち、武運と安産の神として八幡宮に配祀される。" },
  比売神: { rank: "縁結びの神", virtue: "縁結び・家内安全", desc: "八幡宮に配祀される女神。応神天皇の后神とされ、家内安全と縁結びの神徳を持つ。" },
  市杵島姫命: { rank: "宗像三女神／水の神", virtue: "海上安全・芸能上達・金運", desc: "宗像三女神の一柱で、水と航海を司る。弁財天と習合し、財宝・芸能の神としても崇敬される。" },
  木花開耶姫命: { rank: "富士山の神／安産の神", virtue: "安産・火防・家内安全", desc: "瓊瓊杵尊の妃で、富士山の神として浅間神社に祀られる。安産と火防の神徳で知られる。" },
  木花咲耶姫命: { rank: "富士山の神／安産の神", virtue: "安産・火防・家内安全", desc: "瓊瓊杵尊の妃。美と生命の神として、安産・子育ての守護神とされる。" },
  瓊瓊杵尊: { rank: "天孫／皇祖神", virtue: "開運・国家安泰・家内安全", desc: "天孫降臨の主神。日向の高千穂に降り、皇室の祖となったと伝わる。" },
  彦火火出見尊: { rank: "海幸彦の神", virtue: "海上安全・漁業・開運", desc: "瓊瓊杵尊の子で、海神の宮を訪れた説話を持つ。海の恵みと漁業の守護神として祀られる。" },
  伊弉諾尊: { rank: "国生みの神", virtue: "開運・国家安泰・家内安全", desc: "国生み・神生みを行った創世の神。禊ぎによって天照大神らを生んだとされる。" },
  伊弉冉尊: { rank: "国生みの神", virtue: "安産・家内安全", desc: "伊弉諾尊の妹神にして妃。国生みののち黄泉の国に赴き、命の根源と死を司る神として崇敬される。" },
  建御名方神: { rank: "諏訪神／武神", virtue: "五穀豊穣・武運長久・開運", desc: "大国主神の子で、諏訪大社の祭神。力比べの神話にみえる武勇の神であり、農耕と風水の守護神でもある。" },
  大山咋神: { rank: "山の神／地主神", virtue: "商売繁盛・家内安全・開運", desc: "比叡山の地主神で、日吉大社・松尾大社の祭神。農耕と商いの守護神として崇敬される。" },
  高龗神: { rank: "水神／雨の神", virtue: "五穀豊穣・開運・病気平癒", desc: "水を司る龍神。祈雨の神として貴船神社に祀られ、水の恵みと災いを司る。" },
  火産霊神: { rank: "火の神", virtue: "厄除け・家内安全・火防", desc: "火の神格。愛宕神社などに祀られ、火防と家内安全の神徳で知られる。" },
  火之迦具土神: { rank: "火の神", virtue: "厄除け・家内安全・火防", desc: "伊弉冉尊の子で、火の神。秋葉神社などに祀られ、火防の信仰を集める。" },
  菊理媛神: { rank: "縁結びの神", virtue: "縁結び・開運・家内安全", desc: "白山神社の祭神。伊弉諾尊と伊弉冉尊の仲を取り持ったとされ、縁結びの神として崇敬される。" },
  武甕槌神: { rank: "武神／雷神", virtue: "武運長久・開運・厄除け", desc: "鹿島神宮の祭神。国譲りの使者として知られ、武運と地震除けの神として崇敬される。" },
  経津主神: { rank: "武神", virtue: "武運長久・国家安泰", desc: "香取神宮の祭神。剣の神として国譲りに活躍し、武運長久の神徳を持つ。" },
  天児屋根命: { rank: "祭祀の神", virtue: "開運・学業成就・国家安泰", desc: "中臣氏の祖神で、春日大社に祀られる。祝詞と祭祀を司り、学問の神徳も持つ。" },
  底筒男命: { rank: "住吉三神／海の神", virtue: "海上安全・交通安全", desc: "住吉三神の一柱。航海の安全を守る神として、住吉神社の祭神となる。" },
  中筒男命: { rank: "住吉三神／海の神", virtue: "海上安全・交通安全", desc: "住吉三神の一柱。潮と航海を司り、海上安全の神徳を持つ。" },
  表筒男命: { rank: "住吉三神／海の神", virtue: "海上安全・交通安全", desc: "住吉三神の一柱。港と船を守る神として崇敬される。" },
  熊野大神: { rank: "熊野の神", virtue: "厄除け・開運・健康", desc: "熊野三山の神々の総称。修験道の霊場として、厄除けと開運の信仰を全国に広げた。" },
  事代主神: { rank: "福の神／海の神", virtue: "商売繁盛・海上安全・金運", desc: "大国主神の子で、託宣を司る神。恵比須神と習合し、商売と漁業の守護神として祀られる。" },
  少彦名命: { rank: "医薬の神", virtue: "健康・病気平癒・開運", desc: "大国主神とともに国土を開いた小柄な神。医薬・温泉・酒造の神徳を持ち、健康を願う信仰を集める。" },
  大山祇神: { rank: "山の神", virtue: "海上安全・五穀豊穣・開運", desc: "山を司る神で、三島神社・大山神社の祭神。山の恵みと海の安全を併せ願う信仰を集める。" },
  日本武尊: { rank: "武神", virtue: "武運長久・厄除け・開運", desc: "日本書紀に伝わる英雄。東国征討の伝承を持ち、武勇と厄除けの神として祀られる。" },
  月読命: { rank: "月の神", virtue: "開運・海上安全", desc: "天照大神の弟神で、夜と潮を司る。月の運行と航海の安全に関わる神とされる。" },
  豊受大神: { rank: "食物の神", virtue: "五穀豊穣・商売繁盛・健康", desc: "伊勢神宮外宮の祭神。食物と産業を司り、天照大神とともに伊勢の信仰を支える。" },
  猿田彦大神: { rank: "道開きの神", virtue: "開運・交通安全・厄除け", desc: "天孫降臨の際に道案内をした神。道開きと旅の安全の神として、辻や街道沿いに祀られる。" },
  安徳天皇: { rank: "水天宮の神", virtue: "安産・家内安全・水難除け", desc: "壇ノ浦で入水した天皇。水天宮の祭神として、安産と水の守護神として崇敬される。" },
  崇徳天皇: { rank: "御霊神", virtue: "厄除け・開運", desc: "保元の乱で配流された天皇。御霊として祀られ、災厄を祓う神として崇敬される。" },
  徳川家康: { rank: "東照大権現", virtue: "開運・武運長久・出世", desc: "江戸幕府の初代将軍。東照大権現として神格化され、開運と出世の神として崇敬される。" },
  明治天皇: { rank: "天皇神", virtue: "国家安泰・開運", desc: "近代日本の礎を築いた天皇。明治神宮に祀られ、国家の安泰と発展を願う信仰を集める。" },
  護国の英霊: { rank: "英霊", virtue: "国家安泰・武運長久", desc: "地域の戦没者を神として祀る。護国神社の祭神として、平和への願いとともに祭祀される。" },
  熱田大神: { rank: "剣の神", virtue: "武運長久・開運・家内安全", desc: "草薙剣を神体とする熱田神宮の祭神。三種の神器を守る神として崇敬される。" },
  塩土老翁神: { rank: "航海の神", virtue: "海上安全・開運・道開き", desc: "海と塩の神で、航海の導き手とされる。塩竈神社などに祀られる。" },
  伊奢沙別命: { rank: "食物の神", virtue: "海上安全・五穀豊穣", desc: "気比神宮の祭神。食物と海の恵みを司る神として崇敬される。" },
  日前大神: { rank: "太陽神", virtue: "開運・家内安全", desc: "日前神宮の祭神。太陽の霊威を伝える神として、開運と家内安全の神徳を持つ。" },
  丹生都比売大神: { rank: "水の神／金運の神", virtue: "開運・金運・海上安全", desc: "高野山の地主神。水と鉱物を司り、金運の神としても崇敬される。" },
  駒形大神: { rank: "馬の神", virtue: "五穀豊穣・開運・健康", desc: "馬を神格化した神。農耕と馬の守護神として、駒形神社に祀られる。" },
  金山彦命: { rank: "金属の神", virtue: "金運・商売繁盛・開運", desc: "鉱山と金属を司る神。鍛冶や鋳物の守護神として、また金運の神として崇敬される。" },
  御歳大神: { rank: "稲の神", virtue: "五穀豊穣・家内安全", desc: "稲の実りを司る神。大歳神社の祭神として、豊作と家業の繁栄を願う祭祀を受ける。" },
  今木神: { rank: "織物の神", virtue: "五穀豊穣・商売繁盛", desc: "平野神社の祭神。農耕と織物を司り、産業の守護神として崇敬される。" },
  蛭児大神: { rank: "福の神", virtue: "商売繁盛・金運・海上安全", desc: "恵比須神と習合する神。漁業と商いの繁栄をもたらす福神として、西宮神社などに祀られる。" },
  妙見尊星王: { rank: "北辰の神", virtue: "開運・厄除け・商売繁盛", desc: "北辰信仰の本尊。方位と運命を司る星神として、開運と厄除けの神徳を持つ。" },
  国常立尊: { rank: "天地開闢の神", virtue: "開運・国家安泰", desc: "天地開闢に現れた最初の神の一柱。万物の根源として、御嶽信仰などで祀られる。" },
  藤原鎌足: { rank: "中臣氏の祖", virtue: "開運・学業成就", desc: "大化の改新を主導した政治家。談山神社に祀られ、開運と学問の神として崇敬される。" },
  正哉吾勝勝速日天忍穂耳命: { rank: "天孫の系譜", virtue: "開運・家内安全", desc: "天照大神の子で、天孫降臨の父神。八王子神社などに祀られる。" },
  速玉大神: { rank: "熊野の神", virtue: "厄除け・開運・健康", desc: "熊野速玉大社の祭神。過去の罪穢れを祓う神として、厄除けの信仰を集める。" },
  事代主神_: { rank: "福の神", virtue: "商売繁盛", desc: "託宣を司る神。" },
};

/** 祭神名からプロフィールを引く（未登録は社名由来の説明で補う） */
export function deityProfileOf(name: string, fallbackDesc = ""): DeityProfile {
  const p = DEITY_PROFILES[name];
  if (p) return p;
  return { rank: "祭神", virtue: "—", desc: fallbackDesc || `${name}を祀る神社の祭神。` };
}


/** 御利益の詳細説明（v2.12.0 御利益図鑑） */
export const BENEFIT_LONG: Record<string, string> = {
  開運: "運気を開き、物事を良い方向へ導く御利益。新しいことを始める際や、節目の年に参拝されることが多い。",
  健康: "無病息災を願い、日々の暮らしを健やかに保つ御利益。長寿や体力の維持を願う信仰も含まれる。",
  金運: "財を呼び込み、暮らしを豊かにする御利益。商いの繁栄や蓄財、宝くじなどの金運向上を願う。",
  学業成就: "学業成就・合格祈願の御利益。受験や資格試験、進学を控えた人々が篤く信仰する。",
  厄除け: "災厄を払い、身を守る御利益。厄年や節目の年には、厄祓いの祈祷が行われる。",
  縁結び: "男女の縁、家族の縁、人との縁、仕事の縁などの良縁を結ぶ御利益。",
  子宝: "子授け・安産・子育ての御利益。命の誕生と成長を見守る信仰である。",
  商売繁盛: "商いの興隆・事業発展の御利益。開業や店舗の繁栄を願う人々が参拝する。",
  五穀豊穣: "農耕・漁業の実りと地域の安寧を願う御利益。収穫への感謝を捧げる祭礼と結びつく。",
  家内安全: "家族の平安と暮らしの安定を願う御利益。日々の生活の平穏を守る。",
  交通安全: "道中の無事と旅の安全を願う御利益。車や旅の安全祈願として親しまれる。",
  芸能上達: "技芸・芸能・技術の上達を願う御利益。芸事やものづくりに携わる人々が信仰する。",
  安産: "安産・子授け・子育ての御利益。母子の無事を願う信仰として各地に伝わる。",
  病気平癒: "病気の平癒・無病息災の御利益。療養中の回復を願って参拝される。",
  海上安全: "航海・漁業・海上交通の安全を守る御利益。海に生きる人々の信仰を集める。",
  国家安泰: "国家の安泰・世の平和を願う御利益。国土の守護を司る神社に受け継がれる。",
  スポーツ成就: "勝運・武勇・競技の成就を願う御利益。試合や大会を控えた人々が参拝する。",
  酒造安全: "酒造りの安全と繁栄を願う御利益。醸造の神を祀る神社に伝わる。",
  武運長久: "武運・勝運・武勇の御利益。武道や勝負事の成就を願う信仰である。",
};

/** 御利益の検索語（願い事・日常語 → 御利益名 / v2.12.0） */
export const BENEFIT_KEYWORDS: Record<string, string[]> = {
  縁結び: ["恋愛", "恋", "結婚", "婚活", "復縁", "良縁", "パートナー", "出会い", "夫婦", "縁"],
  金運: ["お金", "財運", "宝くじ", "富", "貯金", "金", "財"],
  商売繁盛: ["商売", "仕事運", "出世", "事業", "開業", "繁盛", "ビジネス", "商い", "販売"],
  学業成就: ["受験", "合格", "試験", "学業", "勉強", "進学", "資格", "学校", "成績"],
  健康: ["長寿", "無病", "体調", "健康", "体力", "養生"],
  病気平癒: ["病気", "治病", "完治", "療養", "回復", "入院"],
  安産: ["出産", "妊娠", "安産", "子授け", "マタニティ"],
  子宝: ["子宝", "子供", "こども", "子育て", "授かり"],
  交通安全: ["車", "ドライブ", "旅行", "旅", "事故", "道中", "交通安全"],
  開運: ["運気", "運", "開運", "金運", "好転", "転機"],
  厄除け: ["厄", "災い", "祓い", "厄年", "厄払い", "災難"],
  家内安全: ["家族", "家庭", "家内", "暮らし", "平安"],
  海上安全: ["海", "漁", "船", "航海", "漁業", "海上"],
  芸能上達: ["芸能", "芸術", "音楽", "技術", "上達", "習い事"],
  スポーツ成就: ["スポーツ", "試合", "勝負", "勝運", "大会", "必勝"],
  五穀豊穣: ["豊作", "農業", "収穫", "田畑", "米", "実り"],
  国家安泰: ["平和", "国", "世の中", "安泰"],
  武運長久: ["武道", "武術", "武運", "必勝", "剣道", "柔道"],
  酒造安全: ["酒", "酒造", "醸造", "蔵元"],
};

/** 御利益名 → 検索語（逆引き・包含判定用） */
export const BENEFIT_KEYWORD_LIST: Array<[string, string[]]> = Object.entries(BENEFIT_KEYWORDS);


/**
 * 御利益アイコン（v2.12.2）
 * 未定義の御利益は ⛩️ を自動適用するため、御利益を追加したらここに1行足すだけでよい。
 */
export const BENEFIT_ICONS: Record<string, string> = {
  縁結び: "💕",
  子宝: "👶",
  安産: "👶",
  金運: "💰",
  商売繁盛: "🏪",
  学業成就: "📚",
  厄除け: "🛡️",
  家内安全: "🏠",
  交通安全: "🚗",
  海上安全: "⚓",
  病気平癒: "❤️",
  健康: "🌿",
  芸能上達: "🎭",
  国家安泰: "🏯",
  五穀豊穣: "🌾",
  開運: "✨",
  スポーツ成就: "🏅",
  酒造安全: "🍶",
  武運長久: "⚔️",
};

/** 御利益名 → アイコン（未定義は ⛩️） */
export function benefitIconOf(name: string): string {
  return BENEFIT_ICONS[name] ?? "⛩️";
}

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

/* ============================================================
   地方・都道府県ユーティリティ（旧 lib/regions.ts）
   ============================================================ */
/**
 * 地方・都道府県ユーティリティ（v1.2）
 * 既存の PREFECTURES（src/data/shrines.ts）はそのまま利用できる。
 */

/** 八地方区分（仕様の並び順） */
export const REGION_LIST = [...REGIONS].sort((a, b) => a.order - b.order);

/** 地域IDから名前 */
export function regionLabel(id: RegionId | string | undefined): string {
  if (!id) return "全国";
  return REGION_LIST.find((r) => r.id === id)?.name ?? String(id);
}

/** 都道府県が属する地方 */
export function regionForPrefecture(prefecture: string): RegionId {
  return regionOfPrefecture(prefecture);
}

/** 配布中か（準備中の地域はダウンロード不可） */
export function isRegionAvailable(region: { release?: string } | undefined): boolean {
  return region?.release !== "preparing";
}

/** 保存済みデータに更新があるか */
export function hasRegionUpdate(
  master: { version?: number } | undefined,
  saved: { version?: number } | undefined,
): boolean {
  return Boolean(master) && (master?.version ?? 1) > (saved?.version ?? 0);
}

/** 表示用の件数フォーマット（4,200件） */
export function formatCount(n: number): string {
  return `${n.toLocaleString("ja-JP")}件`;
}

/**
 * 現在地から都道府県を推定する（外部APIを使わない方式）
 *
 * 保存済み・同梱の神社データのうち最も近いものの都道府県を採用する。
 * 県境付近では誤差が出るため、UI 側で「変更できます」と明示する。
 */
export function nearestPrefecture(
  position: { latitude: number; longitude: number },
  shrines: Array<{ prefecture: string; latitude: number; longitude: number }>,
): string | null {
  let best: { pref: string; d: number } | null = null;
  for (const s of shrines) {
    // 緯度経度の平面近似（数百kmスケールの比較には十分）
    const dy = (s.latitude - position.latitude) * 111;
    const dx = (s.longitude - position.longitude) * 111 * Math.cos((position.latitude * Math.PI) / 180);
    const d = Math.hypot(dx, dy);
    if (!best || d < best.d) best = { pref: s.prefecture, d };
  }
  return best?.pref ?? null;
}
