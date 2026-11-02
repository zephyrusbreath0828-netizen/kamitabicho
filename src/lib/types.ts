/**
 * 神旅帳 v1.1 ドメイン型定義
 *
 * Firestore コレクション（仕様準拠）
 *   users/{uid}        uid / nickname / photo_url / created_at (+ 拡張フィールド)
 *   visits/{visitId}   user_id / shrine_id / visit_datetime / latitude / longitude
 *   goshuin/{id}       user_id / shrine_id / image_url / memo / created_at
 *   favorites/{id}     user_id / shrine_id / created_at
 *   shrines/{id}       神社マスタ（管理用・読み取り専用）
 *
 * v1.0（MVP）との互換:
 *   - visits は旧 visit_history コレクションの visited_at も読み取り可能
 *   - goshuin は旧 photo_url も読み取り可能
 *   - 旧バージョンのフィールド名は *Legacy 型として定義し、正規化関数で吸収する
 */

/** users/{uid} */
export type UserProfile = {
  uid: string;
  /** 表示名（ニックネーム） */
  nickname: string;
  /** Firebase Storage のダウンロードURL / Google の photoURL / デモは data URL */
  photo_url: string | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  /** デモユーザーかどうか（Firestore には保存しない） */
  is_demo?: boolean;
  /** 実績の解放履歴 { achievementId: ISO } — v1.3 のランキング集計に利用 */
  achievements?: Record<string, string>;
  /** データ移行の実行履歴（二重移行防止） */
  migration?: MigrationState;
  /** ドキュメント構造のバージョン（将来のマイグレーション用） */
  schema_version?: number;
  /* ---- v1.2 追加（既存フィールドは不変） ---- */
  points?: PointsState;
  benefits?: Record<string, string>;
  deities?: Record<string, string>;
};

export type MigrationState = {
  /** localStorage からの移行完了日時 */
  local_storage_at?: string;
  /** 旧 visit_history コレクションからの移行完了日時 */
  from_visit_history_at?: string;
  /** 移行した件数（記録用） */
  counts?: { visits?: number; goshuin?: number; profile?: boolean };
};

/** shrines/{shrineId} */
export type Shrine = {
  id: string;
  name: string;
  prefecture: string;
  address: string;
  latitude: number;
  longitude: number;
  /** ご祭神 */
  main_deity: string;
  /** 由緒・説明 */
  description: string;
  image_url: string;
  /** 訪問記録数（集計値） */
  visit_count: number;
  /** 電話番号（未登録の場合は null） */
  phone?: string | null;
  /** 公式サイトURL（未登録の場合は null） */
  url?: string | null;
};

/** visits/{visitId} — GPS 参拝記録 */
export type Visit = {
  id: string;
  user_id: string;
  shrine_id: string;
  /** 参拝日時 ISO 8601（仕様の visit_datetime） */
  visit_datetime: string;
  /** チェックイン時の端末位置 */
  latitude: number;
  longitude: number;
  /** 神社からの距離(m)。300m 以内のみ登録可能 */
  distance_m: number;
  created_at?: string;
  /** v1.2: 同期状態（未設定は synced とみなす） */
  status?: VisitStatus;
  synced_at?: string;
};

/** 旧 visit_history の形（読み取り互換用） */
export type LegacyVisitRecord = Partial<Visit> & {
  visited_at?: string;
  shrine_name?: string;
  shrine_prefecture?: string;
};

/** goshuin/{id} — 御朱印帳 */
export type Goshuin = {
  id: string;
  user_id: string;
  shrine_id: string;
  /** 御朱印写真のURL（Storage / デモは data URL） */
  image_url: string;
  memo: string;
  created_at: string;
  /** 授与日 YYYY-MM-DD（御朱印帳の並び替え・表示用） */
  visited_date?: string;
};

/** 旧 goshuin の形（photo_url 互換） */
export type LegacyGoshuinRecord = Partial<Goshuin> & {
  photo_url?: string;
  shrine_name?: string;
  visited_date?: string;
};

/** favorites/{uid_shrineId} */
export type Favorite = {
  user_id: string;
  shrine_id: string;
  created_at: string;
};

/** ログイン中のセッションユーザー */
export type SessionUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isDemo: boolean;
};

/** 新規訪問記録の入力 */
export type NewVisitInput = {
  /** 同期の冪等性のため、クライアント生成IDを指定できる（v1.2） */
  id?: string;
  user_id: string;
  shrine_id: string;
  latitude: number;
  longitude: number;
  distance_m: number;
  visit_datetime?: string;
  /** オフライン登録の同期状態（既存ドキュメントは未設定＝synced） */
  status?: VisitStatus;
};

/** 新規御朱印の入力 */
export type NewGoshuinInput = {
  user_id: string;
  shrine_id: string;
  visited_date: string;
  memo: string;
  file?: File | null;
  image_url?: string;
};

/** localStorage から移行するデータ */
export type MigrationPayload = {
  profile: { nickname?: string; photo_url?: string | null } | null;
  visits: Array<{
    shrine_id: string;
    visit_datetime: string;
    latitude: number;
    longitude: number;
    distance_m: number;
  }>;
  goshuin: Array<{
    shrine_id: string;
    image_url: string;
    memo: string;
    created_at: string;
    visited_date?: string;
  }>;
};

export type MigrationResult = {
  performed: boolean;
  visits: number;
  goshuin: number;
  profile: boolean;
  skippedReason?: string;
};

/** バックエンド共通インターフェース（Firebase / デモ） */
export type BackendMode = "firebase" | "demo";

export interface Backend {
  mode: BackendMode;
  /** 直近の listShrines() の取得元 */
  shrineSource: "firestore" | "bundled";
  describe(): string;
  onAuthChange(cb: (user: SessionUser | null) => void): () => void;
  signInWithGoogle(): Promise<SessionUser>;
  signInAsDemo(nickname?: string): Promise<SessionUser>;
  signOut(): Promise<void>;
  getUserProfile(uid: string): Promise<UserProfile | null>;
  saveUserProfile(profile: UserProfile): Promise<void>;
  listShrines(): Promise<Shrine[]>;
  getShrine(id: string): Promise<Shrine | null>;
  listVisits(uid: string): Promise<Visit[]>;
  addVisit(input: NewVisitInput): Promise<Visit>;
  deleteVisit(visitId: string): Promise<void>;
  listGoshuin(uid: string): Promise<Goshuin[]>;
  addGoshuin(input: NewGoshuinInput): Promise<Goshuin>;
  deleteGoshuin(goshuinId: string): Promise<void>;
  listFavorites(uid: string): Promise<string[]>;
  setFavorite(uid: string, shrineId: string, on: boolean): Promise<void>;
  uploadImage(uid: string, kind: "goshuin" | "avatar", file: File): Promise<string>;
  /** 初回ログイン時のデータ移行（冪等） */
  migrateLocalData(uid: string, payload: MigrationPayload): Promise<MigrationResult>;
  /** 実績の解放を保存する */
  saveAchievements(uid: string, unlocked: Record<string, string>): Promise<void>;
  /* ---- v1.2 追加（既存実装には影響しない追加メソッド） ---- */
  /** ページネーション対応の神社検索 */
  searchShrines(params: ShrineSearchParams): Promise<ShrineSearchResult>;
  listDeities(): Promise<Deity[]>;
  listBenefits(): Promise<Benefit[]>;
  listRegions(): Promise<Region[]>;
  /** 神徳ポイントのスナップショット保存（users.points を追加フィールドとして更新） */
  savePoints(uid: string, points: PointsState): Promise<void>;
  /** 御利益・祭神の収集状態を保存 */
  saveCollection(uid: string, kind: "benefits" | "deities", items: Record<string, string>): Promise<void>;
  /** v1.0 の visit_history を visits へコピー移行（Firebase のみ） */
  migrateLegacyVisitHistory?(uid: string): Promise<number>;
}

/* ============================================================
   v1.2 追加定義（既存型は変更しない・追加のみ）
   ============================================================ */

/**
 * 地方区分ID
 * Firestore の regions コレクションで追加できるため、固定列挙にせず文字列で扱う
 * （アプリ更新なしで kinki / chugoku … を追加できる）
 */
export type RegionId = string;

/** regions/{regionId} */
export type Region = {
  id: RegionId;
  name: string;
  order: number;
  prefectures: string[];
  /** 収録神社数（実データに基づく） */
  shrine_count: number;
  updated_at?: string;
  /** v1.2: データ版数（Firestore 側で更新すると端末側に更新通知が出る） */
  version?: number;
  /** v1.2: 配布状態（available=配布中 / preparing=準備中） */
  release?: "available" | "preparing";  /** ダウンロードサイズ（概算バイト） */
  download_size?: number;
  /** データ配布元 */
  source?: string;
};

/** deities/{deityId} — 祭神マスタ */
export type Deity = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  /** この祭神を祀る神社数（マスタ集計値） */
  shrine_count?: number;
};

/** benefits/{benefitId} — 御利益マスタ */
export type Benefit = {
  id: string;
  name: string;
  category: string;
  description: string;
};

/**
 * 神社（v1.2 拡張）
 * 既存フィールドは v1.0 から不変。追加フィールドはすべて optional。
 */
export type ShrineV2 = Shrine & {
  city?: string;
  region?: RegionId;
  /** 祭神IDの配列（deities マスタ参照） */
  deities?: string[];
  /** 御利益IDの配列（benefits マスタ参照） */
  benefits?: string[];
  source?: string;
  data_version?: number;
};

/** 参拝記録の同期状態（既存ドキュメントは未設定＝synced とみなす） */
export type VisitStatus = "pending" | "synced";

/** visits の拡張（status は追加フィールド） */
export type VisitV2 = Visit & {
  status?: VisitStatus;
  /** オフライン登録を同期した日時 */
  synced_at?: string;
};

/** ローカル保存された参拝記録（未同期キュー） */
export type PendingVisit = Visit & {
  status: "pending";
  shrine_name: string;
  shrine_prefecture: string;
  created_at: string;
};

/** 神徳ポイントの内訳 */
export type PointBreakdown = {
  /** 通常参拝 +100 × 回数 */
  visits: number;
  /** 御朱印登録 +50 × 枚数 */
  goshuin: number;
  /** 新都道府県参拝 +300 × 都道府県数 */
  prefectures: number;
  /** 制覇ボーナス（地域・県） */
  conquest: number;
  total: number;
};

/** 神徳ランク */
export type RankDef = {
  id: string;
  name: string;
  min: number;
  /** 次のランクまでの残ポイント（最上位は 0） */
  next?: { name: string; remaining: number };
};

/** users/{uid}.points（追加フィールド） */
export type PointsState = {
  total: number;
  rank_id: string;
  breakdown: PointBreakdown;
  updated_at: string;
};

/** rewards/{rewardId} — ポイント台帳（監査・将来のランキング用） */
export type RewardEntry = {
  id: string;
  user_id: string;
  type: "visit" | "goshuin" | "new_prefecture" | "conquest" | "bonus";
  points: number;
  ref_id: string;
  created_at: string;
};

/** 収集状態（御利益・祭神） */
export type CollectionState = {
  /** { benefitId / deityId: 初回取得日時 } */
  items: Record<string, string>;
  updated_at: string;
};

/** 端末に保存済みの地域データ */
export type DownloadedRegion = {
  region_id: RegionId;
  name: string;
  shrine_count: number;
  downloaded_at: string;
  last_synced_at: string;
  /** 端末に保存した時点のマスタ版数 */
  version?: number;
};

/** 検索パラメータ（ページネーション対応） */
export type ShrineSearchParams = {
  query?: string;
  prefecture?: string;
  region?: RegionId;
  /** 現在地（指定時は近い順） */
  near?: { latitude: number; longitude: number } | null;
  page?: number;
  pageSize?: number;
};

export type ShrineSearchResult = {
  items: ShrineV2[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  /** 検索に使ったデータソース（画面に明示） */
  source: "firestore" | "local" | "bundled";
};
