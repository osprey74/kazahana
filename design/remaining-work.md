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
- [ ] Agent management: singleton → account-aware Map (`Map<did, AtpAgent>`)
- [ ] authStore redesign: `accounts[]`, `switchAccount(did)`, `addAccount()`, `removeAccount(did)`
- [ ] Account switcher UI in AppLayout header
- [ ] Settings: account management section (add/remove/switch)
- [ ] Login form: "Add Account" flow after initial login
- [ ] Query cache isolation per account (invalidate on switch)
- [ ] i18n strings for account management (ja/en)
- Note: OAuth対応は後日。現段階ではアプリパスワード方式でのマルチアカウント

## BSAF Reference Client Integration
- [ ] Bot Definition JSON import (parse, validate schema, auto-follow bot account)
- [ ] Dynamic filter settings UI generation from `filters` array (multi-select per type/value/target)
- [ ] Tag-based filtering logic (`tags` field parsing, match against user-enabled options)
- [ ] Duplicate detection and collapsing (type + value + time + target match across bots)
- [ ] `self_url` periodic update check (compare `updated_at`, refresh filter UI)
- [ ] BSAF settings screen (registered bots list, per-bot filter configuration)
- [ ] i18n strings for BSAF features (ja/en)
- Spec: https://github.com/osprey74/bsaf-protocol/blob/main/docs/bsaf-spec.md

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
