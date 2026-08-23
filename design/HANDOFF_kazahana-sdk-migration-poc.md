# HANDOFF: kazahana SDK 移行 PoC ＋ OP スレッド番号付け検証

- **作成日**: 2026-08-23 (JST)
- **対象**: kazahana (Desktop / Tauri v2 + React + TypeScript)
- **目的**: `@atproto/api` から公式推奨の新 SDK (`@atproto/lex` ベース) への移行可否を PoC で見極め、その過程で「OP スレッド番号付け」機能が実運用で動作するかを検証する
- **性質**: 調査・技術検証 (Proof of Concept)。本番コードへのマージは PoC 結果に基づく go/no-go 判断の後。

---

## 1. 背景

公式 Bluesky アプリは v1.131.0 (2026-08-18) で SDK を `@atproto/api` → 新 SDK へ移行済み。kazahana は現在 `@atproto/api ^0.20.16` を数十ファイルで深く参照している。

同時期の公式機能「OP スレッド番号付け」(PR #11472) は、同一著者の連続スレッドに `1/n` 形式の通し番号を表示する機能。番号は **AppView (サーバー) が feed レスポンスに付与**し、クライアントは読み取って表示するだけ。

## 2. PoC 設計を左右する重要発見 (一次情報確認済み)

1. **新 SDK の正体は `@atproto/lex`**
   - 公式が「新規プロジェクトで推奨」とするのは `@atproto/lex`（Lexicon からの型生成付き type-safe XRPC クライアント）。
   - 社内リリースノート表記の `@bsky.app/sdk` は `@atproto/lex` をベースにした wrapper と推測。**導入前に正式パッケージ名を [docs.bsky.app](https://docs.bsky.app/) で再確認すること。**
   - `@atproto/api` は**レガシーとして存続**。`BskyAgent` 非推奨 → `AtpAgent`。

2. **`@atproto/lex` は低レイヤー。高レベルヘルパーは非同梱の可能性が高い**（= 移行の最大リスク）
   - kazahana が依存する以下が新 SDK に同等提供されるか**未確認**:
     - `RichText`（facet 自動検出・描画）… `src/lib/richtext.ts`
     - `moderatePost` / `moderateProfile` / `ModerationOpts` / `ModerationUI`（合成モデレーション）… `src/components/search/SearchView.tsx`, `NotificationList.tsx`, `ModerationContext.tsx`, `ContentWarning.tsx`
     - `ChatBskyConvoDefs` ほか chat / 独自 `chat.bsky.group.*` lexicon
   - → これらは当面 `@atproto/api` に残すハイブリッド構成か、自前再実装かの判断が要る。

3. **`opThreadPostIndex` / `opThreadPostCount` は canonical lexicon (main) に未定義**
   - サーバー側フィーチャーフラグ (`CanonicalPostNumberingEnable`) でゲート中。
   - → 「OP 番号が動くか」の検証は **SDK 移行とは独立**しており、まず**ランタイムでフィールドが飛んでくるか**を確認するのが本質。飛んでこなければ SDK に関係なく表示不可。

## 3. OP スレッド番号付け 公式実装まとめ (PR #11472)

- **データソース**: `FeedViewPost` トップレベルの `opThreadPostIndex` / `opThreadPostCount`。**選択中ポストにのみ**、かつ**同一著者の連続スレッド**に属する場合のみ設定。
- **導出**: 親 = `index - 1`、ルート = `1`、`index - 1 = 0`（自身がルート）は `undefined` に潰す。
- **表示** (`PostFeedItem.tsx`): ①本文末尾インラインサフィックス ②省略時は「Show more」横バッジ ③本文空ならスタンドアロンバッジ。
- **関連ファイル**: `feed-manip.ts`（導出・URI マップ）, `PostFeedItem.tsx`（描画）, `RichText.tsx`（サフィックスオフセット）。

## 4. PoC フロー（段階ゲート方式）

> 各ステージ末で go/no-go を判断。安いステージから実施し、早期に不確実性を潰す。

### Stage 0 — OP フィールド ランタイム実在プローブ（SDK 非依存・最優先・最安）
- **現行 `@atproto/api` のまま**、`getTimeline` / `getPostThread` の生レスポンスを `console.log` / JSON ダンプし、`opThreadPostIndex` / `opThreadPostCount` が実際に含まれるか確認。
- 同一著者の長いスレッド（公式で番号表示されている投稿）を対象 URI に指定して検証。
- **判定**:
  - フィールドが**来る** → OP 番号は実装可能。Stage 3 で表示するだけ。
  - フィールドが**来ない**（フラグ OFF のまま） → OP 番号は**現時点では実装不可**として保留。SDK 移行 PoC (Stage 1) のみ継続。
- **成果物**: 実レスポンスの JSON サンプル 1〜2 件（scratchpad に保存）。

### Stage 1 — SDK 移行スパイク（隔離ブランチ）
- ブランチ `spike/sdk-lex-poc` を切る（本番に混ぜない）。
- `@atproto/lex`（正式名は Stage 開始時に再確認）を追加し、**代表的な縦スライス 1 本**だけ移行:
  - **推奨スライス**: 「ログイン (`AtpAgent` 相当のセッション) → ホームタイムライン取得 → PostCard 描画」
  - 独自 PDS の DID 解決 / セッション管理 (`src/lib/session.ts`, `authStore.ts`) が新 SDK でどう表現されるかを必ず含める。
- **測定項目**: 型の使い勝手、生成型の import パス変更量、`AtpAgent` 相当クラスの有無、独自 PDS 対応の可否。

### Stage 2 — 高レベルヘルパー パリティ検証（Stage 1 と並行可）
- 新 SDK 単体で以下が賄えるか確認し、賄えなければ「`@atproto/api` 併存 or 自前実装」を決める:
  1. `RichText`（facet 検出・描画）
  2. `moderatePost` / `moderateProfile` / `ModerationOpts`
  3. `ChatBskyConvoDefs` / `chat.bsky.group.*` 独自 lexicon の型
- **判定**: フルヘルパー欠落が判明した場合、**ハイブリッド構成**（データ取得は lex、ヘルパーは api 併存）の是非を評価。

### Stage 3 — 移行スライス上で OP 番号表示（Stage 0 が「来る」の場合のみ）
- Stage 1 の移行済みタイムラインで `opThreadPostIndex` / `opThreadPostCount` を読み、PostCard にバッジ表示。
- **防御的実装**: フィールドが `undefined` のときは何も出さない（フラグ OFF 環境でも壊れない）。
- 公式ロジック（親 = index-1、ルート = 1、0 は undefined）を移植。

### Decision Gate — フル移行 go/no-go
- Stage 1〜2 の摩擦・パリティ結果とヘルパー欠落コストを総合評価。
- **go**: 段階移行計画（ファイル群単位）を別 HANDOFF で起票。
- **no-go / 保留**: `@atproto/api` 継続。OP 番号のみ Stage 3 の成果を本番へ切り出し可否を検討。

## 5. リスク登録簿

| リスク | 影響 | 緩和策 |
|---|---|---|
| `@atproto/lex` に RichText/moderation ヘルパーが無い | 移行コスト大 | Stage 2 で早期確認、ハイブリッド構成を許容 |
| 独自 PDS のセッション/DID 解決が新 SDK で非対応 | 独自 PDS ログイン退行 | Stage 1 スライスに必ず含める |
| `opThreadPostIndex` が実運用で飛んでこない | OP 番号実装不可 | Stage 0 で SDK 非依存に先行確認 |
| 正式パッケージ名が `@bsky.app/sdk` と異なる | 導入で詰まる | Stage 1 開始時に公式 docs 再確認 |
| `chat.bsky.group.*` 独自 lexicon の型欠落 | グループチャット退行 | Stage 2 のパリティ項目に含む |

## 6. 完了条件 (PoC Exit)
- Stage 0 の JSON サンプルと OP フィールド実在の結論。
- Stage 1 スライスが新 SDK で動作 or 不能理由の明文化。
- Stage 2 ヘルパーパリティ表（有/無/代替案）。
- Decision Gate の go/no-go 判断と根拠。

## 6.5 Stage 0 結果（2026-08-23 実施・完了）

> 稼働アプリのセッションではなく、`opThreadPostIndex` を配信するのと同一の**公開 AppView (`public.api.bsky.app`)** に対し `getAuthorFeed` を直接クエリして検証。

**結論: OP 番号フィールドは本番で実在。SDK 移行とは独立に実装可能。ただし現行 SDK では未型付け。**

1. ✅ **フィールドは本番 AppView レスポンスに実在**
   - `bsky.app` / `pfrazee.com` の feed で `opThreadPostIndex` / `opThreadPostCount` を各 4 件検出（`jay.bsky.team` は該当スレッド無しで 0 件）。
   - **配置**: `feedViewPost` の**トップレベル**（`post` / `reply` / `reason` と同階層）。PR #11472 の記述通り。
   - **値**: 1 始まり。実例 → `idx=1/count=2`(ルート), `idx=2/count=2`(自己リプライ継続, `reply` 有り), `idx=1/count=6`。`reason`(リポスト)付き item にも付与される。
   - サンプル: `scratchpad/feed_pfrazee.json`
2. ⚠️ **`@atproto/api@0.20.16` の型定義には未収録**（`node_modules/@atproto/api` 内で `opThreadPost` 一致 0 件）。
   - → ランタイムでは飛んでくるが型が無い。**型拡張（module augmentation）または安全なキャストで読む**必要あり。
3. 🔀 **含意（方針への影響）**: OP 番号付けは **SDK 移行を待たず現行 `@atproto/api` のまま今すぐ実装可能**。`@atproto/lex` 移行は独立トラックとして純粋にその是非で評価できる（OP 番号のブロッカーではない）。

**改定した進め方**:
- **トラック A（軽量・即実装可）**: OP 番号付け。現行 SDK ＋型拡張 ＋ PostCard バッジ。防御的実装（フィールド未定義時は非表示）。→ Stage 3 相当を単独で先行実施できる。
- **トラック B（別途評価）**: `@atproto/lex` 移行 PoC（Stage 1 / 2 / Gate）。OP 番号とは切り離して技術的メリットで判断。

## 6.6 トラック A 実装記録（2026-08-23・Desktop 完了）

- **新規**: `src/lib/opThread.ts` — 暫定フィールドを 1 箇所に閉じた局所アクセサ `getOpThreadNumbering(feedItem)`。オプショナル型キャスト＋防御（`count>=2` かつ `1<=index<=count` のときのみ返す。未定義は `null`＝非表示）。
- **改修**: `src/components/timeline/PostCard.tsx` — 著者メタ行（時刻の隣）に `forum` アイコン＋`index/count` バッジを表示。`title` は i18n `post.opThread`（`defaultValue` 指定によりロケールファイル追加不要）。
- **ランタイム透過の確定確認**: `@atproto/xrpc@dist/xrpc-client.js` は `resBody`(生パース)を `XRPCResponse` にそのまま返す。`assertValidXrpcOutput` は検証のみで戻り値破棄・`resBody` 非再代入。lexicon は追加プロパティを拒否しない → `opThreadPost*` は剥がれず `feedItem` に到達。`useTimeline` も `res.data.feed` を再構築せず透過。
- **検証**: `npx tsc -b` 通過（exit 0）、`eslint` 通過（exit 0）。
- **未実施（要実機）**: 稼働アプリ＋認証セッションでのバッジ表示の目視確認（ヘッドレス環境のため不可）。
- **未対応**: iOS / Android パリティ、`docs/PLATFORM_MATRIX.md`・README 機能リスト更新（本 PoC の範囲外。実施可否は要判断）。

## 6.7 トラック B（SDK 移行）Stage 1・2 結果（2026-08-23 実施）

> スタンドアロン検証プロジェクト（`scratchpad/lex-spike/`）で 3 パッケージを実インストールし、kazahana の縦スライス（Client＋セッション＋timeline＋RichText＋moderation）を新 API で再現、`tsc --noEmit` で型検証。

**結論: 移行は機構的に成立、パリティ完全確認。ただし auth 依存が preview のため「即時フル移行」は非推奨。パスは実証済み・低技術リスク。**

### 前提の修正（研究による）
- 移行先は **`@bsky/sdk`(1.0.1) + `@atproto/lex`(0.3.6) + `@atproto/lex-password-session`(0.2.0, preview)** の 3 点セット。`@bsky.app/sdk` は存在しない（404）。
- `AtpAgent` 廃止 → **`Client`**（`@atproto/lex`）。`agent.xxx()` sugar/fluent は全廃 → `client.call(action, input)`。

### 検証済み（tsc exit 0 で通過）
- インストール成功（80 packages・脆弱性 0）。**Node v24.13.1 で ≥22 制約クリア**、ESM も問題なし。
- `PasswordSession.login/resume` の `onUpdated`/`onDeleted` が kazahana の `saveSession`/`clearSession` に 1:1 対応。**独自 PDS は `service` 指定で対応**。
- `new Client(session, { service: "did:web:api.bsky.app#bsky_appview" })` で現行 `configureProxy` を代替。
- `client.call(app.bsky.feed.getTimeline, {...})` 成立。**Track A の `opThreadPost*` も読める**。
- `RichText.resolve(text, { resolver: client })` 成立、`moderatePost(post, opts).ui("contentList")` 成立。
- **`chat.bsky.group.*`(16) / `chat.bsky.convo.*`(47) / `chat.bsky.embed.joinLink` すべて `@bsky/sdk` に同梱** → kazahana は独自ローカル lexicon を持たない（BSAF は `record.tags` パース）ため **#4472 は非該当**。

### 実測で判明した摩擦点（blast radius: 58 ファイル / 157 `agent.` 呼び出し）
1. **`client.call()` は本体を直接返す（`res.data` ラッパー無し）** → 現行の `res.data.xxx` 全箇所が変更対象。
2. 呼び出し規約: `agent.getTimeline({})` → `client.call(app.bsky.feed.getTimeline, {})`（fluent/sugar 約 93 箇所）。
3. import 再マップ（58 ファイル）: `@atproto/api` → `@atproto/lex` / `@atproto/lex-password-session` / `@bsky/sdk/{lexicons,richtext,moderation}`。
4. `RichText`: `new RichText({text}); rt.detectFacets(agent)` → `RichText.resolve(text,{resolver:client})`（7 ファイル、シグネチャ変更）。
5. セッション型: `AtpSessionData`→`SessionData`、`AtpSessionEvent`/`persistSession`（イベント）→ `onUpdated`/`onDeleted`（コールバック）。
6. 型名前空間: `AppBskyFeedDefs.FeedViewPost` → `app.bsky.feed.defs.FeedViewPost`（16 型名）。branded 型（`DidString`/`AtUriString`）境界で要 assert。

### Parity 判定（kazahana の実使用ベース）
| 能力 | 判定 | 所在 |
|---|---|---|
| RichText / detectFacets | ✅ 確認 | `@bsky/sdk/richtext`（resolver 引数化） |
| moderation（moderatePost 等） | ✅ 確認 | `@bsky/sdk/moderation` |
| chat.bsky.group/convo/embed | ✅ 確認 | `@bsky/sdk/lexicons`（全同梱） |
| 独自 PDS セッション | ✅ 確認（preview） | `@atproto/lex-password-session` |
| 独自ローカル lexicon (#4472) | N/A | kazahana は未定義のため非該当 |

## 6.8 Decision Gate — 判定: 条件付き GO（時期は延期推奨）

- **技術的実現性**: ✅ 実証済み。パリティ完全、API 形状は型で確認、独自 lexicon 不要、Node/ESM クリア。
- **コスト**: 中〜大の**機械的**書き換え（58 ファイル / 157 箇所 / `res.data` 除去 / RichText・セッションのシグネチャ変更）。段階移行可能（agent・session 層 → hooks → components）。
- **主要リスク**: **`@atproto/lex-password-session` が preview (0.2.0)**。出荷アプリの認証土台を preview 依存に置くのは時期尚早。
- **便益**: 現時点でユーザー向け便益は無し。将来の新フィールドが `@bsky/sdk` 先行提供される流れへの追従＋型安全性が主便益。

**推奨**: **フル移行は `@atproto/lex-password-session` の stable 化まで延期**。それまで `@atproto/api` を継続（OP 番号等は現行 SDK で対応可能＝トラック A で実証済み）。トリガーは ①auth パッケージ stable 化、または ②`@bsky/sdk` 先行提供の新機能が実際にブロッカー化、のいずれか。着手時は本 Stage 1 の agent/session スライスを起点に段階移行する。ハイブリッド（api と lex 併存）は不要（api 単体で機能するため）。

## 7. 参照
- 公式リリース: https://github.com/bluesky-social/social-app/releases （v1.131.0 で SDK 移行）
- OP 番号 PR: https://github.com/bluesky-social/social-app/pull/11472
- `@atproto/lex`: https://www.npmjs.com/package/@atproto/lex
- TS API refactor: https://docs.bsky.app/blog/ts-api-refactor
- kazahana 現状: `package.json` (`@atproto/api ^0.20.16`), `src/lib/richtext.ts`, `src/lib/session.ts`, `src/components/**`
