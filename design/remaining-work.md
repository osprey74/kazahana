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

## Beyond Spec (Potential Improvements)

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
- [x] Search history: persist up to 200 entries across app restarts (localStorage/Zustand persist), individual delete and clear all buttons
- [x] Official website via GitHub Pages
