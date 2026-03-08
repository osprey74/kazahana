# Remaining Work Items

## Spec Phase 2 (Core)
- [x] Image lightbox (Phase 2 item 6)
- [x] Virtual scrolling with react-virtuoso for timeline (memory optimization)
  - 適用済み（8画面）: TimelineView, FeedView, NotificationList, ProfileView (Posts/Likes/Media), FollowersList, FollowingList, SearchView (PostResults/UserResults)
  - 未適用（2画面、対応不要）: ThreadView（スレッドは通常数十件以下のツリー構造で仮想化の恩恵が少ない）、PostListModal（モーダル内 max-h-[70vh] 制約付きリストで「もっと読む」ボタン方式のため一度に表示される件数が少ない）
- [x] "N new posts" bar at top of timeline (※ 既読位置マーカーで同等機能実装済みのため対応不要)
- [x] Pull-to-refresh (→ Beyond Spec「手動リロード」に統合済み: タブクリック / F5 / ヘッダーリロードボタン)
- [x] Link card (OGP preview) for `app.bsky.embed.external`
- [x] Quote post embed display for `app.bsky.embed.record`

## Spec Phase 3 (Post/Notification)
- [x] Image attachment in posts (with alt text)
- [x] Rich text input: auto-detect mentions, URLs, hashtags and generate facets (実装済み: usePost.ts で detectFacets 実行)
- [x] Mention click → navigate to profile, hashtag click → search
- [x] Mention auto-complete: `@` input triggers `searchActorsTypeahead` dropdown with keyboard navigation

## Spec Phase 4 (Profile/Search/Polish)
- [x] OS notifications via `tauri-plugin-notification` (background system notifications)
- [x] Auto-start on OS boot via `tauri-plugin-autostart` (optional setting)

## Spec Section 9 (Build/Distribution)
- [x] Production build (`npm run tauri build`) — v1.0.0 Windows x64 (NSIS / MSI)
- [x] CI/CD with GitHub Actions (Section 9.3) — `.github/workflows/release.yml`
- [ ] Auto-update via `tauri-plugin-updater` — コード署名導入後に実装

## Bluesky API Features (kazahana scope)
- [x] List feed viewing (`getListFeed`)
- [x] Follower / following lists (`getFollowers` / `getFollows`)
- [x] Custom feed viewing (`getFeed` / `getFeedGenerator` / `getSuggestedFeeds`)
- [x] Liked posts list (`getActorLikes`)
- [x] Liked-by users on a post (`getLikes`)
- [x] Reposted-by users on a post (`getRepostedBy`)
- [x] Quotes list on a post (`getQuotes`)
- [x] Post deletion (`deleteRecord` for posts)
- [x] Quote post embed display (`app.bsky.embed.record`)
- [x] Quote post creation (compose with `app.bsky.embed.record`)
- [x] Video posting (`uploadVideo` / `app.bsky.embed.video`)
- [x] Thread gate (reply restriction settings)
- [x] Post gate (quote restriction settings)
- [x] Hide individual posts (Preferences hidden posts)
- [x] Mute thread notifications (`muteThread` / `unmuteThread`)
- [x] Bookmarks (`createBookmark` / `deleteBookmark` / `getBookmarks`)
- [x] Direct messages (`chat.bsky.convo.*`)
- [x] Report posts/users (`com.atproto.moderation.createReport`)
- [x] Mute/Block users (`muteActor` / `unmute`, `app.bsky.graph.block`)
- [x] Copy post link / share
- [x] Starter Packs viewing (profile tab + detail view)
- [x] Post language tag auto-assignment (`langs` field from app language setting)
- [x] Pinned post display on profile (`getAuthorFeed` with `includePins`, `reasonPin` UI indicator)
- [ ] Starter Packs search tab in search view (`searchStarterPacks`) — API未提供 (Bluesky側で404、lexiconのみ存在)

## i18n (Additional Languages)
- [x] Portuguese (pt)
- [x] German (de)
- [x] Traditional Chinese (zh-TW)
- [x] Simplified Chinese (zh-CN)
- [x] French (fr)
- [x] Korean (ko)
- [x] Spanish (es)
- [x] Russian (ru)
- [x] Indonesian (id)

## Multi-Account Support
- [ ] Session store refactor: single session → multi-account array (`accounts[]` + `currentDid`)
- [ ] Agent management: シングルトン維持＋セッション差し替え方式（下記設計検討結果参照）
- [ ] authStore redesign: `accounts[]`, `switchAccount(did)`, `addAccount()`, `removeAccount(did)`
- [ ] Account switcher UI in AppLayout header
- [ ] Settings: account management section (add/remove/switch)
- [ ] Login form: "Add Account" flow after initial login
- [ ] Query cache isolation per account (invalidate on switch)
- [ ] i18n strings for account management (ja/en + 全11ロケール)
- Note: OAuth対応は後日。現段階ではアプリパスワード方式でのマルチアカウント

### 設計検討結果 (2026-03-01)

#### 現状分析
- `AtpAgent` はシングルトン (`src/lib/agent.ts`)、`getAgent()` で取得
- セッションは Tauri Store (`kazahana-store.json`) に単一キー `"session"` で保存 (`src/lib/session.ts`)
- authStore (`src/stores/authStore.ts`) は単一 `profile` / `isLoggedIn` のみ
- React Query キー（30+種）にアカウント識別子なし
- `getAgent()` を直接呼ぶファイル: 14フック + 10コンポーネント = 24ファイル

#### 設計判断

**1. Agent管理: シングルトン維持（`Map<did, AtpAgent>` は不採用）**
- 単一 `AtpAgent` を維持し、アカウント切替時にセッションを差し替える
- 理由: Map方式は並行セッションリフレッシュ管理が複雑。シングルトン維持なら24ファイルへの変更不要
- バックグラウンド通知ポーリング（非アクティブアカウント）は v2 で軽量 fetch ベースで対応可能

**2. Query Cache: 切替時にクリア（キープレフィックス方式は不採用）**
- `queryClient.clear()` をアカウント切替時に実行（1行で完結）
- 理由: キープレフィックス方式は14フックファイル全てに変更が必要で変更量大・リグレッションリスク高
- 切替後のデータ再取得は1-2秒（アプリ起動時と同等UX）

**3. 設定スコープ**
- グローバル（変更不要）: theme, language, pollInterval, desktopNotification, autoStart, videoVolume, showVia, closeAction, imageOpenMode → `settingsStore.ts` 変更不要
- アカウント別（DIDスコープ化）: feedStore (currentFeed, hiddenFeeds, feedOrder, showAllInQuickJump), searchHistoryStore (history)

**4. 通知ポーリング: アクティブアカウントのみ（v1）**

#### 変更ファイル一覧
- 新規作成 (2): `src/lib/queryClient.ts`, `src/components/account/AccountSwitcher.tsx`
- 大幅変更 (3): `src/stores/authStore.ts`, `src/lib/session.ts`, `src/components/settings/SettingsView.tsx`
- 中程度 (5): `src/stores/feedStore.ts`, `src/stores/searchHistoryStore.ts`, `src/components/layout/AppLayout.tsx`, `src/components/auth/LoginForm.tsx`, `src/App.tsx`
- 軽微 (3): `src/lib/agent.ts`, `src/lib/constants.ts`, `src/hooks/useTimeline.ts`
- i18n (11): 全ロケールファイル
- 変更不要: 14フック, 10コンポーネント, `chatAgent.ts`（既存DID不一致チェックが切替を自動処理）, `settingsStore.ts`

#### エッジケース対応方針
- 既存ユーザーアップグレード: `migrateFromSingleSession()` で旧 `"session"` キーから新形式へ自動移行
- 非アクティブアカウントのセッション期限切れ: `switchAccount()` で `resumeSession` 失敗時にエラー表示＋削除→再ログイン促進
- 同一アカウント二重追加: DID重複チェックでブロック
- 切替時: `/` に遷移、composeModal を閉じる、タイムラインモジュールステートをリセット

#### 詳細設計書
- `C:\Users\ospre\.claude\plans\modular-jumping-curry.md` に Phase 1-9 の詳細実装計画を記載

## BSAF Reference Client Integration
- [x] Bot Definition JSON import (parse, validate schema, auto-follow bot account)
- [x] Bot registration via URL fetch and local file dialog
- [x] Bot unregistration with auto-unfollow
- [x] Dynamic filter settings UI generation from `filters` array (multi-select per type/value/target)
- [x] Tag-based filtering logic (`tags` field parsing, match against user-enabled options)
- [x] Duplicate detection and collapsing (type + value + time + target match across bots)
- [x] `self_url` update check on app startup (compare `updated_at`, refresh filter UI)
- [x] BSAF settings screen (master toggle, registered bots list, per-bot accordion filter config)
- [x] BSAF store with localStorage persistence (bsafEnabled, registeredBots, filterSettings)
- [x] i18n strings for BSAF features (全11言語)
- Spec: https://github.com/osprey74/bsaf-protocol/blob/main/docs/bsaf-spec.md
- Implementation plan: `design/bsaf-client-implementation-plan.md`
- Branch: `feature/bsaf-client`

## Completed Fixes (2025-02-25)
Collaborator: よつぎnん / @yotsugin.bsky.social

- [x] AT Protocol reply record root参照修正 — composeStore.ts, PostActions.tsx, ComposeModal.tsxでreplyTo.rootを正しく伝播。過去の投稿でroot===parentとなっていた問題を今後の投稿で解消
- [x] ThreadView型ガード修正 — $type文字列比較からisThreadViewPost() SDK型ガードに変更
- [x] スレッド親投稿チェーンの収集と表示
- [x] React Hooks順序違反の修正 — useRef/useLayoutEffectが条件分岐後にあり白画面クラッシュしていた問題を修正
- [x] 通知タブからのポスト遷移修正 — reply/mention/quoteはnotification.uri、like/repostはreasonSubjectを使用
- [x] スレッド内投稿のクリック遷移 — 非ハイライト投稿クリックでそのスレッドビューに遷移可能に
- [x] 通知タブ「戻る」ボタン修正 — history.backからlocation.state.fromによる厳密な通知タブ遷移に変更

## Peripheral Tools (Browser Integration)
- [x] Custom URI protocol (`kazahana://compose?title=...&url=...`) via `tauri-plugin-deep-link`
  - OS にプロトコルハンドラを登録、ブックマークレットからワンクリックで投稿画面にページタイトル+URLを事前入力
  - 対象: ComposeModal / composeStore への初期テキスト注入、deep-link プラグイン導入、tauri.conf.json スキーム登録
- [x] ブックマークレット設置手順のユーザーガイド記載（EN/JA 両方）
  - `docs/en/guide/index.html`, `docs/ja/guide/index.html` にセクション追加
  - 内容: ブックマークレットのコード、ブラウザごとの設置手順、使い方

## Beyond Spec (Potential Improvements)

- [x] Keyboard shortcut to open compose dialog from timeline view (`N` key — AppLayout keydown handler)
- [x] Session auto-refresh robustness (401 error retry)
- [x] Rate limit handling (429 response backoff with `ratelimit-reset` header)
- [x] Follow/unfollow functionality verification
- [x] Image lightbox swipe gestures (touch/trackpad)
- [x] Notification tab: clickable user icon/name to navigate to profile
- [x] Thread detail view: show "liked by" and "reposted by" lists
- [x] Replace reply/RT/like text icons with icon font
- [x] Settings: add "timeline reload interval" options (30/60/90/120秒の4オプション。取得件数オプションは取り下げ)
- [x] Home/Notifications/Profile tabs: add manual reload/refresh (Pull-to-refresh統合。リロードボタン / タブクリック / キーボードショートカット等)
- [x] Home/Notifications/Profile tabs: infinite scroll to load older posts
- [x] Profile: add "Likes" and "Media" tabs (liked posts list, media-only timeline)
- [x] Profile: add "Lists" tab (リストフィードはフィードセレクターで閲覧可能のため完了)
- [x] Fix dark mode text color (black text unreadable, change to white/light)
- [x] Notification tab: show source post for like/reply/repost notifications
- [x] Compose: link card generation from URL in post text (manual trigger via "リンクカード生成" button, OGP fetch via tauri-plugin-http)
- [x] Compose: Alt+Enter keyboard shortcut to submit post
- [x] Compose: auto-generate link card on paste when pasted text contains URL
- [x] Profile: loading/error states for likes tab on other users' profiles
- [x] Profile: followers/following page title shows target user's handle instead of "あなた"
- [x] Login: custom handle history with individual delete (Tauri Store, autoComplete="off")
- [x] Search history: persist up to 200 entries across app restarts (localStorage/Zustand persist), individual delete and clear all buttons
- [x] Official website via GitHub Pages
- [x] Settings: フィードの並べ替え機能 — 「表示するフィードを設定」画面で上下ボタンによる並べ替え、表示/非表示グループ分け表示 (要望者: あやがね / @ayagane.magical-pritt.jp)
- [x] ウィンドウサイズ・位置の保存と復元 — 終了時にウィンドウサイズと画面上の配置位置を保存し、次回起動時に復元 (tauri-plugin-window-state) (要望者: あやがね / @ayagane.magical-pritt.jp)
- [x] タスクトレイアイコン操作改善 — 左クリックでウィンドウ復元／最前面配置、右クリックメニューに「Open Window」「Minimize」「Exit」を実装 (要望者: あやがね / @ayagane.magical-pritt.jp)
- [x] 閉じるボタン動作設定 — 設定画面に「閉じるボタンで終了」「閉じるボタンで最小化」オプションを追加。最小化選択時の注意書き表示 (要望者: あやがね / @ayagane.magical-pritt.jp)
- [x] macOS Dockアイコンからのウィンドウ復元 — タスクトレイ最小化時にDockアイコンをクリックしてもウィンドウが復元されない問題を修正 (バグ報告者: あやがね / @ayagane.magical-pritt.jp)
- [x] OS別の閉じるボタン設定テキスト — macOSでは「Dockに格納する」、Windows/Linuxでは「タスクトレイに最小化する」と表示するようOS判定を追加
- [x] 通知スレッド表示時の下部余白 — 最新スレッドの下にウィンドウ高さの半分の余白を挿入し、ポストがアプリ中心までスクロールアップできるようにする
- [x] ブックマークレット連携時のOGP画像サイズエラー — Chromeブックマークレットから記事（例: https://www.gizmodo.jp/2026/02/rokid-smart-ai-glass.html ）を連携し投稿ボタンをクリックすると「投稿に失敗しました This file is too large. It is 1.2MB but the maximum size is 976.56KB.」エラーが発生する
- [x] ブックマークレット投稿後に設定画面を開くと投稿フォームが再表示される — ブックマークレットから投稿後、設定画面を開くと直前にブックマークレットから送信された記事がペーストされた投稿フォームが開く
- [x] nキーで開いた投稿フォームをEscキーで閉じられるようにする
- [x] 操作マニュアルのキーバインド表記修正 — 「Alt+エンターキーの押下でも投稿を実行できます」を「Alt+エンターキー（Windows版）／Option+エンターキー（macOS版）の押下でも投稿を実行できます」に変更する
- [x] プロフィールのピン留め投稿表示 — `getAuthorFeed` に `includePins: true` を渡し、`reasonPin` 付き投稿をピンアイコン＋ラベルで先頭表示。全11言語対応

- [x] 検索ページのスティッキーヘッダー — 検索フィールド＋投稿/ユーザータブをsticky top-0でラップ
- [x] プロフィールページのスティッキーヘッダー — 投稿/いいね/メディア等のタブにsticky top-0を追加
- [x] 画像添付の圧縮ロジック改善 — 全入力経路（ペースト/ドラッグ＆ドロップ/ファイル選択）で圧縮を統一、圧縮中インジケータ表示、エラーメッセージ追加
- [x] 画像編集機能（回転） — 添付画像のプレビューに編集ボタン追加、90度単位の左右回転をCanvas APIで実装、全11言語対応
- [x] 画像編集機能（クロップ） — 元の比率/正方形/自由比率の3モードでクロップ、ドラッグ操作による選択領域指定、全11言語対応

## User Feedback (あやがね / @ayagane.magical-pritt.jp) — 2026-02-28

### 通知欄

- [x] いいね通知の♥マークに色をつけて、返信といいねの区別をつけやすくする
- [x] 通知欄のハンドルネーム以外の文字色を濃くして視認性を向上させる
- [x] 通知されたポストから返信・リポスト・いいね等のアクションボタンを操作できるようにする — NotificationActionsコンポーネント追加、reply/mention/quote通知のポストデータも取得対応
- [x] リポスト経由のいいね/リポスト通知で元ポストが表示されない問題の修正 — 他者のpostをいいね/リポスト後、フォロワーが同様のアクションをした際に「投稿が見つかりません」と表示される（リポスト元ポストのURI解決が必要）

### 投稿フォーム

- [x] 画像ファイルのドラッグ＆ドロップによる添付に対応する — ComposeModal全体にdrop/dragOverハンドラ追加、Tauri dragDropEnabled:false設定
- [x] クリップボードからのスクリーンショット画像ペーストに対応する — 1MB超画像の自動圧縮（OffscreenCanvas JPEG段階的品質低下）付き

### トップ画面UI

- [x] フィードやリストへのクイックジャンプ機能 — ヘッダー設定ボタン左横にリストアイコン追加、ドロップダウンでホーム/フィード/リスト一覧から直接切替
- [x] 公式ピン留め以外のフィードも表示できるようにする — 非ピン留めフィードをフィード一覧に表示、クイックジャンプに「全て表示/表示中のみ」切替設定追加
- [x] 画像クリック時の表示方法選択オプション — 設定画面に「アプリ内で表示」/「ブラウザで開く」ラジオボタン追加（11言語対応）
- [x] リストやフィードの並べ替えをドラッグ操作に対応する — @dnd-kit導入、ドラッグハンドル付きSortableFeedRowコンポーネント、表示/非表示グループ内並べ替え
- [x] 翻訳ボタンまたは翻訳メニューの追加 — PostMenuに翻訳ボタン追加、Google翻訳ウェブサイトへポストテキストを渡して翻訳（openUrl使用）
- [x] ホーム・フィードのタイムラインスクロール時にタブタイトルを固定表示（スティッキーヘッダー） — FeedSelectorをsticky top-0でラップ

### プロフィール

- [x] プロフィール画面から投稿フォームを開く（ボタン／Nキー）と表示中ユーザーへのメンションを自動挿入する — Nキー＋FABボタン両対応、自分のプロフィールでは通常投稿

### 検索

- [x] プロフィールタブで表示中ユーザーのポスト検索に対応する — 投稿タブに検索バー追加、`app.bsky.feed.searchPosts` の `author` パラメータ使用、300msデバウンス

### チャット

- [x] リアクションボタン（絵文字スタンプ）の追加 — クイック絵文字ピッカー（❤️👍😂😮😢🎉）、リアクション表示（グループ化・カウント・自分のリアクションハイライト）、トグル操作対応
- [x] メッセージの時系列を昇順に変更 — API返却順を.reverse()で時系列昇順化、スティッキーヘッダー、入力欄下に50vh余白、過去メッセージ読み込み時のスクロール位置補正

## Bug Reports (あやがね / @ayagane.magical-pritt.jp) — 2026-03-01

- [x] リポスト経由の通知クリックで「投稿が見つかりません」と表示される — reasonSubjectがリポストレコードURI（app.bsky.feed.repost）の場合、ThreadViewに渡す前に解決済み元ポストURIを使用するよう修正（NotificationItem.tsx handleClick）
- [x] 通知のアクションボタン（返信・リポスト・いいね）が一部の通知で表示されない — reply/mention/quote通知でsubjectPost lookupがreasonSubject（親ポスト）で検索していたが、fetchはnotification.uriで行っていたためミスマッチ発生。reason種別に応じたlookupキー分岐に修正（NotificationList.tsx）

## Improvements (2026-03-02)

- [x] like-via-repost / repost-via-repost 通知の表示対応 — Bluesky公式設定「リポストへのいいね」「リポストのリポスト」有効時の通知reason（`like-via-repost` / `repost-via-repost`）に対応。アイコン・ラベル・色・displayText・URI解決・デスクトップ通知カウント・i18n（EN/JA）を追加（NotificationItem.tsx, useNotifications.ts, notifications.ts, en.json, ja.json）
- [x] デバッグコード除去 — `lib.rs` open_devtools無条件呼び出し、`useThread.ts` console.log/warn/error、`NotificationItem.tsx` console.log/warnを除去
- [x] DMリアクションボタンの常時表示化 — チャットメッセージのリアクション追加ボタン・削除ボタンをホバー時のみ表示から常時表示に変更（MessageBubble.tsx）
- [x] ポスト詳細画面のテキスト選択コンテキストメニューに「Webで検索」を追加 — 既存メニュー（コピー/全て選択/再読み込み）に選択テキストをブラウザで検索する機能を追加
- [x] DMメッセージ内のURL文字列をクリッカブルにする — メッセージテキスト内のURLを検出しリンク化、クリックで外部ブラウザを開く
- [x] DMメッセージ内のハッシュタグをクリッカブルにする — TLのポストと同様にハッシュタグを検出しリンク化、クリックでそのハッシュタグの検索結果を表示
- [x] デモページへのリンクを日本語README・日本語ドキュメントに設置 — `README.ja.md` と `docs/ja/guide/index.html` からデモページへたどれるようリンクを追加
