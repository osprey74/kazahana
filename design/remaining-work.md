# Remaining Work Items

## Spec Phase 2 (Core)
- [x] Image lightbox (Phase 2 item 6)
- [ ] Virtual scrolling with react-virtuoso for timeline (memory optimization)
- [ ] "N new posts" bar at top of timeline (※ 既読位置マーカーで同等機能実装済みのためペンディング)
- [ ] Pull-to-refresh (→ Beyond Spec「手動リロード」に統合)
- [x] Link card (OGP preview) for `app.bsky.embed.external`
- [x] Quote post embed display for `app.bsky.embed.record`

## Spec Phase 3 (Post/Notification)
- [x] Image attachment in posts (with alt text)
- [x] Rich text input: auto-detect mentions, URLs, hashtags and generate facets (実装済み: usePost.ts で detectFacets 実行)
- [ ] Mention click → navigate to profile, hashtag click → search
- [ ] Mention auto-complete: `@` input triggers `searchActorsTypeahead` dropdown with keyboard navigation

## Spec Phase 4 (Profile/Search/Polish)
- [ ] OS notifications via `tauri-plugin-notification` (background system notifications)
- [ ] Auto-start on OS boot via `tauri-plugin-autostart` (optional setting)

## Spec Section 9 (Build/Distribution)
- [ ] Production build (`npm run tauri build`)
- [ ] CI/CD with GitHub Actions (Section 9.3, marked as future)

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
- [ ] Video posting (`uploadVideo` / `app.bsky.embed.video`)
- [x] Thread gate (reply restriction settings)
- [x] Post gate (quote restriction settings)
- [ ] Hide individual posts (Preferences hidden posts)
- [ ] Mute thread notifications (`muteThread` / `unmuteThread`)
- [ ] Bookmarks (`createBookmark` / `deleteBookmark` / `getBookmarks`)
- [ ] Direct messages (`chat.bsky.convo.*`)
- [ ] Report posts/users (`com.atproto.moderation.createReport`)

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

## Beyond Spec (Potential Improvements)
- [ ] Session auto-refresh robustness (401 error retry)
- [ ] Rate limit handling (429 response backoff with `ratelimit-reset` header)
- [ ] Follow/unfollow functionality verification
- [ ] Image lightbox swipe gestures (touch/trackpad)
- [ ] Settings: display current API rate limit consumption
- [x] Notification tab: clickable user icon/name to navigate to profile
- [x] Thread detail view: show "liked by" and "reposted by" lists
- [x] Replace reply/RT/like text icons with icon font
- [ ] Settings: add "timeline reload interval" and "reload post count" options
- [x] Home/Notifications/Profile tabs: add manual reload/refresh (Pull-to-refresh統合。リロードボタン / タブクリック / キーボードショートカット等)
- [ ] Home/Notifications/Profile tabs: infinite scroll to load older posts
- [x] Profile: add "Likes" and "Media" tabs (liked posts list, media-only timeline)
- [ ] Profile: add "Lists" tab (user-created lists)
- [x] Fix dark mode text color (black text unreadable, change to white/light)
- [x] Notification tab: show source post for like/reply/repost notifications
- [ ] Thread composition: draft-based thread creation UI (↓+ button to add drafts, navigable draft list with collapsed prev/next posts, click to edit any draft, submit all at once on "投稿" press, sequential API submission for reply chain)
- [x] Compose: link card generation from URL in post text (manual trigger via "リンクカード生成" button, OGP fetch via tauri-plugin-http)
- [ ] Search history: persist up to 200 entries across app restarts (localStorage/Zustand persist), individual delete and clear all buttons
- [x] Official website via GitHub Pages
