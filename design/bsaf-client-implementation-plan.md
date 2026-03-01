# kazahana BSAF クライアント実装計画

- 作成日: 2026-03-01
- ブランチ: `feature/bsaf-client`
- BSAF 仕様バージョン: v1

## 設計方針まとめ

### 決定事項

| # | 項目 | 決定 |
|---|------|------|
| 1 | Bot登録方法 | JSON ファイル読み込み + URL 貼付の両方 |
| 2 | フィルタ展開 UI | 案A: クリックでアコーディオン展開（同一画面内） |
| 3 | Bot 登録解除 | 解除ボタン設置、自動アンフォローも実行 |
| 4 | 設定画面の配置 | フィード設定とモデレーションの間 |
| 5 | マスタートグル OFF 時 | データ保持、フィルタリングのみ停止（再有効化で即復帰） |
| 6 | フィルタ初期状態 | 全て ON（全投稿表示、ユーザーが絞る） |
| 7 | URL 入力 UI | URL テキストフィールド + 取得ボタンを主導線、下に「ファイルから読み込む」リンク |
| 8 | エラーハンドリング | トースト通知 or インラインエラーメッセージ |
| 9 | JSON 自動更新 | アプリ起動時にチェック、サイレント更新 |
| 10 | フィルタラベル言語 | Bot Definition JSON のラベルをそのまま表示 |

---

## Phase 1: 型定義 & BSAF Store

### 目的
BSAF の基盤となるデータ型と状態管理を作成する。

### 新規ファイル

#### `src/types/bsaf.ts`
Bot Definition JSON のスキーマに対応する TypeScript 型定義。

```typescript
/** BSAF Bot Definition JSON のスキーマ */
export interface BsafBotDefinition {
  bsaf_schema: string;       // "1.0"
  updated_at: string;        // ISO 8601
  self_url: string;          // JSON の配布 URL

  bot: {
    handle: string;
    did: string;
    name: string;
    description: string;
    source: string;
    source_url?: string;
  };

  filters: BsafFilter[];
}

export interface BsafFilter {
  tag: string;               // "type" | "value" | "target" など
  label: string;             // UI 表示用ラベル（JSON 提供言語）
  options: BsafFilterOption[];
}

export interface BsafFilterOption {
  value: string;             // タグ値（例: "earthquake", "5+", "jp-kanto"）
  label: string;             // UI 表示用ラベル
}

/** 登録済み Bot のストレージ形式 */
export interface BsafRegisteredBot {
  definition: BsafBotDefinition;
  filterSettings: Record<string, string[]>;
  // key = filter.tag (例: "type", "value", "target")
  // value = 有効化されたオプション値の配列
  registeredAt: string;      // ISO 8601
  lastCheckedAt: string;     // self_url の最終チェック日時
}

/** パース済み BSAF タグ */
export interface BsafParsedTags {
  version: string;           // "v1"
  type: string;
  value: string;
  time: string;
  target: string;
  source: string;
}
```

#### `src/stores/bsafStore.ts`
BSAF 関連の状態管理。localStorage で永続化。

```
State:
  bsafEnabled: boolean                    — マスタートグル
  registeredBots: BsafRegisteredBot[]     — 登録済み Bot リスト

Actions:
  setBsafEnabled(enabled: boolean)        — トグル切替
  registerBot(definition: BsafBotDefinition) — Bot 登録（全フィルタ ON で初期化）
  unregisterBot(did: string)              — Bot 登録解除
  updateBotDefinition(did, definition)    — JSON 更新時の差し替え
  setFilterOptions(did, tag, values[])    — フィルタ設定変更
  setLastCheckedAt(did, timestamp)        — 更新チェック日時記録

Persistence:
  kazahana-bsaf-enabled                   — boolean
  kazahana-bsaf-bots                      — JSON.stringify(registeredBots)
```

### 変更ファイル
なし（新規ファイルのみ）

---

## Phase 2: BSAF ユーティリティ関数

### 目的
JSON バリデーション、タグパーサー、重複検出ロジックを実装する。

### 新規ファイル

#### `src/lib/bsaf.ts`

```
関数:
  validateBotDefinition(json: unknown): BsafBotDefinition | null
    — JSON のバリデーション（bsaf_schema, bot, filters の必須フィールド検証）
    — 不正な場合は null を返す

  parseBsafTags(tags: string[]): BsafParsedTags | null
    — 投稿の tags 配列から BSAF タグをパース
    — "bsaf:v1" がなければ null
    — 各 "key:value" を分解して構造化

  shouldShowBsafPost(parsed: BsafParsedTags, bot: BsafRegisteredBot): boolean
    — パース済みタグとユーザーのフィルタ設定を照合
    — bot.filterSettings の各タグで、該当値が有効リストに含まれるか判定
    — 全フィルタをパスした場合のみ true

  isBsafDuplicate(a: BsafParsedTags, b: BsafParsedTags): boolean
    — type + value + time + target が一致 & source が異なるなら重複

  fetchBotDefinitionFromUrl(url: string): Promise<BsafBotDefinition>
    — URL から JSON をフェッチ & バリデーション
    — Tauri の HTTP プラグイン (fetch) を使用
    — エラー時は throw
```

---

## Phase 3: 設定画面 — BSAF セクション追加

### 目的
SettingsView にマスタートグルと Bot 管理画面へのリンクを追加する。

### 変更ファイル

#### `src/components/settings/SettingsView.tsx`

「Show Via」セクション (L246-258) と `<hr>` (L260) の間に BSAF セクションを挿入:

```
配置場所: L258 の後、L260 の <hr> の前

追加内容:
  {/* BSAF */}
  <section className="mb-6">
    <h3>BSAF</h3>
    <label>                                         ← チェックボックス
      <input type="checkbox" checked={bsafEnabled} />
      kazahana を BSAF 対応クライアントにする
    </label>
    {bsafEnabled && (                               ← 条件付き表示
      <button onClick={() => navigate("/settings/bsaf")}>
        <Icon name="smart_toy" />
        BSAF 対応 Bot を管理する
        <Icon name="chevron_right" />
      </button>
    )}
  </section>
```

インポート追加: `useBsafStore`

#### `src/App.tsx`

ルート追加:
```
<Route path="/settings/bsaf" element={<BsafBotsView />} />
```

インポート追加: `BsafBotsView`

---

## Phase 4: BSAF Bot 管理画面

### 目的
Bot 登録・一覧・フィルタ設定・削除の画面を実装する。

### 新規ファイル

#### `src/components/settings/BsafBotsView.tsx`

```
画面構成:

┌── ヘッダー ──────────────────────────────────┐
│ ← 戻る    BSAF 対応 Bot を管理する            │
└──────────────────────────────────────────────┘

┌── Bot 登録エリア ────────────────────────────┐
│ ┌────────────────────────────┐ ┌──────────┐ │
│ │ URL を入力...              │ │ 取得     │ │
│ └────────────────────────────┘ └──────────┘ │
│                                              │
│ 🔗 または JSON ファイルから読み込む            │
│                                              │
│ (エラーメッセージ: インライン表示)              │
│ (読込中: LoadingSpinner 表示)                 │
└──────────────────────────────────────────────┘

┌── 登録済み Bot リスト ───────────────────────┐
│                                              │
│ ▶ Japan Disaster Alerts  @jma-alert.bsky... │
│   (クリックで展開 ↓)                          │
│   ┌── フィルタ設定 ────────────────────────┐ │
│   │ アラートの種類                          │ │
│   │ [✅ 地震] [✅ 津波] [□ 噴火] ...       │ │
│   │                                        │ │
│   │ 重み                                   │ │
│   │ [□ 震度1] [✅ 震度5+] [✅ 震度6+] ...  │ │
│   │                                        │ │
│   │ 地域                                   │ │
│   │ [✅ 北海道] [✅ 関東] [□ 九州] ...      │ │
│   │                                        │ │
│   │ ソース: JMA                            │ │
│   │ 最終更新: 2026-02-24                   │ │
│   │                                        │ │
│   │ [登録を解除する]                        │ │
│   └────────────────────────────────────────┘ │
│                                              │
│ ▶ NWS Weather Alerts     @nws-bot.bsky...   │
│                                              │
└──────────────────────────────────────────────┘

(Bot 未登録の場合)
┌──────────────────────────────────────────────┐
│ 🤖 登録済みの BSAF 対応 Bot はありません      │
└──────────────────────────────────────────────┘

処理フロー:

[URL から取得]
  1. URL 入力 → 取得ボタン押下
  2. fetchBotDefinitionFromUrl(url) でフェッチ
  3. validateBotDefinition() でバリデーション
  4. 成功 → registerBot() + getAgent().follow(bot.did)
  5. 失敗 → インラインエラーメッセージ表示

[ファイルから読み込む]
  1. Tauri dialog.open() でファイルダイアログ
  2. ファイル読み込み → JSON.parse()
  3. validateBotDefinition() でバリデーション
  4. 以降同じ

[登録解除]
  1. 確認ダイアログ「この Bot の登録を解除しますか？」
  2. getAgent().deleteFollow(followRecord) でアンフォロー
  3. unregisterBot(did) でストアから削除

[アコーディオン展開]
  1. Bot 名クリック → 状態トグル (openBotDid)
  2. 展開時にフィルタ設定を表示
  3. チェックボックス操作 → setFilterOptions() でリアルタイム保存

フィルタチェックボックスの挙動:
  - 各フィルタグループの横に「全選択」「全解除」ボタン
  - チェック変更は即座に bsafStore に反映（保存ボタン不要）
```

---

## Phase 5: タイムラインフィルタリング

### 目的
タイムラインに表示される投稿に BSAF フィルタを適用する。

### 変更ファイル

#### `src/components/timeline/PostCard.tsx`

投稿の `tags` フィールドを確認し、BSAF フィルタリングを適用する。

```
変更箇所: PostCard 関数の先頭部分（モデレーション判定の後）

処理:
  1. bsafEnabled が false → スキップ（通常表示）
  2. record.tags を取得
  3. parseBsafTags(tags) で BSAF タグをパース
  4. パース失敗（非 BSAF 投稿）→ 通常表示
  5. registeredBots から post.author.did に一致する Bot を検索
  6. 一致する Bot がない → 通常表示（未登録 Bot の BSAF 投稿はフィルタしない）
  7. shouldShowBsafPost() で判定
  8. false → return null（非表示）

インポート追加: useBsafStore, parseBsafTags, shouldShowBsafPost
```

注: AT Protocol の `app.bsky.feed.post` レコードの `tags` フィールドは `record.tags` で参照可能。
PostCard.tsx の L33 で既に `record` をキャストしているので、`tags?: string[]` を追加する。

---

## Phase 6: 重複検出 & 折りたたみ

### 目的
複数 Bot が同一イベントを報告した際に重複を検出し折りたたむ。

### 変更ファイル

#### `src/hooks/useTimeline.ts`

```
変更箇所: items の useMemo 内（重複除去ロジック後）

処理:
  1. bsafEnabled が false → スキップ
  2. フィルタ済み items を走査
  3. 各 BSAF 投稿のタグをパース
  4. type + value + time + target をキーとしてグルーピング
  5. 同一キーの投稿が複数ある場合 → 最初の投稿に duplicateCount / duplicateAuthors を付与
  6. 2つ目以降の投稿にはマーカーを設定

結果の型拡張:
  items の各要素に追加メタデータ:
    _bsafDuplicateOf?: string   — 重複先の投稿 URI（この投稿はデフォルト非表示）
    _bsafDuplicateCount?: number — この投稿の重複数
    _bsafDuplicateAuthors?: string[] — 重複 Bot のハンドル一覧
```

#### `src/components/timeline/PostCard.tsx`

```
追加表示:
  _bsafDuplicateOf がある場合 → return null（非表示）
  _bsafDuplicateCount > 0 の場合 → 投稿下部に表示:
    「他 N 件の Bot も報告しています」（展開で一覧表示）
```

---

## Phase 7: Bot Definition JSON 自動更新

### 目的
アプリ起動時に登録済み Bot の JSON を自動チェック・更新する。

### 新規ファイル

#### `src/lib/bsafUpdater.ts`

```
関数:
  checkBsafBotUpdates(): Promise<void>
    — 全登録 Bot の self_url をフェッチ
    — updated_at を比較し、新しければ updateBotDefinition() で更新
    — フィルタ設定は保持（新しいオプションは ON で追加、削除されたオプションは除去）
    — setLastCheckedAt() で最終チェック日時を記録
    — エラーはサイレント（console.warn のみ）
```

### 変更ファイル

#### `src/App.tsx`

```
AuthGate の useEffect 内（restoreSession 後）に追加:
  — ログイン完了後に checkBsafBotUpdates() を実行
  — bsafEnabled が true の場合のみ
```

---

## Phase 8: i18n 対応

### 目的
BSAF 関連の UI テキストを 11 言語に対応する。

### 変更ファイル: 全 11 ロケールファイル

追加するキー（`settings` オブジェクト内に追加）:

```json
// ja.json
"bsaf": {
  "title": "BSAF",
  "enableBsaf": "kazahana を BSAF 対応クライアントにする",
  "manageBots": "BSAF 対応 Bot を管理する",
  "manageTitle": "BSAF 対応 Bot を管理する",
  "urlPlaceholder": "Bot Definition JSON の URL を入力...",
  "fetch": "取得",
  "orLoadFile": "または JSON ファイルから読み込む",
  "noBots": "登録済みの BSAF 対応 Bot はありません",
  "unregister": "登録を解除する",
  "unregisterConfirm": "この Bot の登録を解除しますか？Bot のフォローも解除されます。",
  "source": "ソース",
  "lastUpdated": "最終更新",
  "lastChecked": "最終確認",
  "selectAll": "全選択",
  "deselectAll": "全解除",
  "duplicateBot": "この Bot は既に登録されています",
  "invalidJson": "無効な Bot Definition JSON です",
  "fetchFailed": "URL からの取得に失敗しました",
  "registered": "Bot を登録しました",
  "unregistered": "Bot の登録を解除しました",
  "followFailed": "Bot のフォローに失敗しました（登録は完了しています）",
  "duplicateReport": "他 {{count}} 件の Bot も報告しています",
  "botNotFound": "Bot アカウントが見つかりません"
}

// en.json
"bsaf": {
  "title": "BSAF",
  "enableBsaf": "Enable BSAF-compatible client features",
  "manageBots": "Manage BSAF bots",
  "manageTitle": "Manage BSAF Bots",
  "urlPlaceholder": "Enter Bot Definition JSON URL...",
  "fetch": "Fetch",
  "orLoadFile": "or load from JSON file",
  "noBots": "No BSAF bots registered",
  "unregister": "Unregister",
  "unregisterConfirm": "Unregister this bot? The bot will also be unfollowed.",
  "source": "Source",
  "lastUpdated": "Last updated",
  "lastChecked": "Last checked",
  "selectAll": "Select all",
  "deselectAll": "Deselect all",
  "duplicateBot": "This bot is already registered",
  "invalidJson": "Invalid Bot Definition JSON",
  "fetchFailed": "Failed to fetch from URL",
  "registered": "Bot registered",
  "unregistered": "Bot unregistered",
  "followFailed": "Failed to follow bot (registration completed)",
  "duplicateReport": "Also reported by {{count}} other bot(s)",
  "botNotFound": "Bot account not found"
}
```

他 9 言語 (de, es, fr, id, ko, pt, ru, zh-CN, zh-TW) にも同等のキーを追加。

---

## Phase 9: ドキュメント更新 & テスト

### 変更ファイル

#### `design/kazahana-spec.md`
- BSAF クライアント機能のセクションを追加
- 設定項目一覧に BSAF 関連を追記

#### `design/remaining-work.md`
- BSAF タスクを完了マークに変更
- 進捗サマリーを更新

#### `README.md` / `README.ja.md`
- 機能リストに BSAF 対応を追記

#### `docs/en/` / `docs/ja/`
- ユーザーガイドに BSAF 設定の使い方を追記

### 動作確認項目

- [ ] BSAF トグル ON/OFF で設定リンクの表示/非表示
- [ ] URL からの Bot 登録（正常系 + 各種エラー）
- [ ] ファイルからの Bot 登録（正常系 + 各種エラー）
- [ ] 重複登録の防止
- [ ] フィルタ UI の動的生成
- [ ] フィルタチェックボックスの即時保存
- [ ] 全選択/全解除ボタン
- [ ] Bot 登録解除 + アンフォロー
- [ ] タイムラインフィルタリング（BSAF 投稿の表示/非表示）
- [ ] 非 BSAF 投稿が影響を受けないこと
- [ ] 重複検出 & 折りたたみ表示
- [ ] Bot Definition JSON の自動更新チェック
- [ ] BSAF 無効時にフィルタリングがスキップされること
- [ ] ダークモード対応
- [ ] 11 言語の i18n テキスト表示

---

## ファイル変更サマリー

### 新規ファイル (5)
| ファイル | 内容 |
|---------|------|
| `src/types/bsaf.ts` | BSAF 型定義 |
| `src/stores/bsafStore.ts` | BSAF 状態管理 (Zustand) |
| `src/lib/bsaf.ts` | バリデーション・パーサー・フィルタロジック |
| `src/lib/bsafUpdater.ts` | JSON 自動更新チェック |
| `src/components/settings/BsafBotsView.tsx` | Bot 管理画面 |

### 変更ファイル (17+)
| ファイル | 変更内容 |
|---------|---------|
| `src/App.tsx` | ルート追加 + 起動時更新チェック |
| `src/components/settings/SettingsView.tsx` | BSAF セクション追加 |
| `src/components/timeline/PostCard.tsx` | BSAF フィルタ & 重複表示 |
| `src/hooks/useTimeline.ts` | 重複検出ロジック |
| `src/i18n/locales/ja.json` | BSAF i18n キー追加 |
| `src/i18n/locales/en.json` | BSAF i18n キー追加 |
| `src/i18n/locales/de.json` | BSAF i18n キー追加 |
| `src/i18n/locales/es.json` | BSAF i18n キー追加 |
| `src/i18n/locales/fr.json` | BSAF i18n キー追加 |
| `src/i18n/locales/id.json` | BSAF i18n キー追加 |
| `src/i18n/locales/ko.json` | BSAF i18n キー追加 |
| `src/i18n/locales/pt.json` | BSAF i18n キー追加 |
| `src/i18n/locales/ru.json` | BSAF i18n キー追加 |
| `src/i18n/locales/zh-CN.json` | BSAF i18n キー追加 |
| `src/i18n/locales/zh-TW.json` | BSAF i18n キー追加 |
| `design/kazahana-spec.md` | 仕様追記 |
| `design/remaining-work.md` | タスク更新 |
| `README.md` / `README.ja.md` | 機能リスト追記 |

---

## 実装順序と依存関係

```
Phase 1 (型定義 & Store)
  ↓
Phase 2 (ユーティリティ関数)
  ↓
Phase 3 (設定画面 BSAF セクション)  ← Phase 1 に依存
  ↓
Phase 4 (Bot 管理画面)              ← Phase 1, 2, 3 に依存
  ↓
Phase 5 (タイムラインフィルタ)       ← Phase 1, 2 に依存
  ↓
Phase 6 (重複検出)                  ← Phase 5 に依存
  ↓
Phase 7 (自動更新)                  ← Phase 1, 2 に依存
  ↓
Phase 8 (i18n)                     ← Phase 3, 4 に依存（キーが確定してから）
  ↓
Phase 9 (ドキュメント & テスト)      ← 全 Phase 完了後
```

注: Phase 5 と Phase 7 は Phase 4 完了後に並行作業可能。
