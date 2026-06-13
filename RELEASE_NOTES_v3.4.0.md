# kazahana v3.4.0

## English

### ✨ New Features

#### Bluesky v1.124 Group Chat Support

This release brings full client-side support for the group chat feature that Bluesky officially launched in v1.124.0 (released 2026-06-10). All four implementation phases described in the cross-platform handoff are now complete on Desktop.

**Receiving and viewing groups (Phase 1)**

- **`groupConvo` rendering** — Conversation list shows group name, member count, lock status, and a group default avatar alongside existing 1:1 DMs. Last-message previews handle `MessageView` / `DeletedMessageView` / `SystemMessageView` distinctly.
- **System message timeline** — A new `SystemMessage.tsx` renders all 12 system message variants (member join / leave / added / removed, lock / unlock / permanent lock, group edit, join link create / edit / enable / disable). Member DIDs resolve against `convo.members` and fall back to a short DID.
- **Group join link card** — A new `JoinLinkEmbed.tsx` renders `chat.bsky.embed.joinLink#view` with separate states for active / disabled / invalid links.
- **`acceptConvo` / `leaveConvo`** — Implemented via new hooks. Leave confirmation copy switches to "Leave this group?" for group convos.
- **`listConvoRequests`** — Unified incoming + outgoing requests view replaces the previous `listConvos status:request` flow.
- **Lock-aware composer** — Locked groups hide the message input and display a notice. `locked-permanently` shows a distinct copy.

**Joining via invite link (Phase 2)**

- **In-app routing of `bsky.app/chat/<code>`** — A new `resolveInAppRoute()` helper rewrites Bluesky invite URLs that appear in post rich-text facets, OGP cards, and chat message links into the internal `/chat/:code` route.
- **`JoinLinkView` preview screen** — Mounted at `/chat/:code`. Calls `getJoinLinkPreviews` and displays group name, member count, owner, join CTA, and live status banner.
- **`requestJoin` flow** — On `status: joined` the user is taken straight into the new conversation; on `status: pending` a "request sent" banner appears. Six errors (`ConvoLocked`, `FollowRequired`, `InvalidCode`, `LinkDisabled`, `MemberLimitReached`, `UserKicked`) are mapped to localized messages.
- **`withdrawJoinRequest`** — Pending requests can be withdrawn from the preview screen.

**Owner operations (Phase 3)**

- **New group creation modal** — Group name (≤50 graphemes) plus member selection (≤49, powered by `searchActorsTypeahead`). Seven error conditions from `createGroup` are localized.
- **Group settings screen** — `/messages/:convoId/settings` covers name edit, paginated member list, member add/remove, lock toggle, and leave. Owner role is resolved from `convo.members` `GroupConvoMember.role`.
- **Invite link management** — Create / edit (joinRule + requireApproval) / enable / disable / copy / open-in-browser, all integrated into the settings screen.
- **Join request approval screen** — `/messages/:convoId/requests` lists join requests with approve / reject actions; opening the screen auto-marks requests as read via `updateJoinRequestsRead`.
- **Send-join-link hook** — `useSendJoinLinkMessage` is available; the chat picker UI is not yet implemented, so for now sharing is done by pasting the invite URL as plain text (which still resolves in-app).
- **Entry points** — A stacked "New group" FAB appears in the messages screen; the empty DM list state also offers a "New group" button.

**Privacy preferences (Phase 4, new in this release)**

- **`allowGroupInvites` setting UI** — A new **Chat** section in the Settings screen lets you choose who can invite you to group chats: **Everyone** / **People you follow** / **No one**.
- **`chat.bsky.actor.declaration` persistence** — Reads and writes the `self` declaration record on your PDS, preserving any existing `allowIncoming` value (defaulting it to `"all"` when no record exists so the lexicon's required field is satisfied).

### 🌐 i18n (11 languages)

Added five new keys for the Chat privacy section (`settings.chatPrivacy`, `settings.allowGroupInvites`, `settings.allowGroupInvitesOption.{all,following,none}`, `settings.allowGroupInvitesHint`, `settings.allowGroupInvitesError`) across all locales: de, en, es, fr, id, ja, ko, pt, ru, zh-CN, zh-TW. Earlier phases also added the `messages.joinLink.*` keys in ja / en.

### 🔧 Maintenance

- **`@atproto/api`** upgraded from `^0.20.11` to `^0.20.14` to pull in the full set of `chat.bsky.group.*` codegen, `chat.bsky.embed.joinLink`, `groupConvo`, and `systemMessageView` types.
- **CI/CD** — The macOS Tauri build matrix was removed from `.github/workflows/release.yml`. Going forward, GitHub Actions builds Windows binaries only; macOS users should install the Mac App Store version (Catalyst build from `kazahana-ios`).

### 📝 Documentation

- README (EN/JA) feature list now includes group chat.
- `docs/PLATFORM_MATRIX.md` section 8 was renamed to "Direct Messages & Group Chat" and rows for groupConvo display, system messages, join-link embed, invite URL handling, join request approval, lock operations, and `allowGroupInvites` privacy settings were filled in for Desktop.

### 📚 References

- [HANDOFF_kazahana-group-chat.md](https://github.com/osprey74/kazahana/blob/main/HANDOFF_kazahana-group-chat.md) — Cross-platform implementation handoff
- [Bluesky social-app v1.124.0 release](https://github.com/bluesky-social/social-app/releases/tag/1.124.0)
- [atproto PR #4854 — group chat lexicons](https://github.com/bluesky-social/atproto/pull/4854)
- [chat.bsky lexicons (atproto/main)](https://github.com/bluesky-social/atproto/tree/main/lexicons/chat/bsky)

---

## 日本語

### ✨ 新機能

#### Bluesky v1.124 グループチャット対応

このリリースで、Bluesky 公式 v1.124.0（2026-06-10 リリース）で正式公開されたグループチャット機能のクライアント側対応が完了しました。クロスプラットフォーム HANDOFF に定義された 4 つの実装フェーズすべてが Desktop で完走しています。

**受信・表示（Phase 1）**

- **`groupConvo` 表示** — 会話一覧で既存の 1:1 DM と並べてグループ名・メンバー数・ロック状態アイコン・グループ用デフォルトアバターを表示。lastMessage の `MessageView` / `DeletedMessageView` / `SystemMessageView` をそれぞれ別プレビューで描画します。
- **システムメッセージのタイムライン描画** — 新規 `SystemMessage.tsx` で 12 種すべて（メンバー追加 / 削除 / 参加 / 退出 / ロック / アンロック / 永続ロック / グループ名編集 / 招待リンク作成・編集・有効化・無効化）に対応。メンバー DID は `convo.members` から解決し、未解決時は短縮 DID を表示します。
- **グループ招待リンクカード** — 新規 `JoinLinkEmbed.tsx` が `chat.bsky.embed.joinLink#view` を描画。有効 / 無効化済み / 不正の 3 状態を区別表示します。
- **`acceptConvo` / `leaveConvo`** — 新規フック追加。退出確認ダイアログは group 時に「グループから退出しますか？」へ自動切替されます。
- **`listConvoRequests`** — incoming + outgoing 統合の参加リクエスト一覧。旧 `listConvos status:request` 方式は廃止しました。
- **ロック対応の入力欄** — ロック中のグループはメッセージ入力欄を非表示にし「このグループはロックされています」を表示。`locked-permanently` は別文言で区別します。

**招待リンクからの参加（Phase 2）**

- **`bsky.app/chat/<code>` の in-app 解決** — 新規 `resolveInAppRoute()` ヘルパーで、投稿のリッチテキスト facet・OGP リンクカード・チャットメッセージ内のリンクに含まれる Bluesky 招待 URL を内部ルート `/chat/:code` へ書き換えます。
- **`JoinLinkView` プレビュー画面** — `/chat/:code` に紐付け。`getJoinLinkPreviews` を呼んでグループ名・メンバー数・オーナー・参加 CTA・状態バナーを表示します。
- **`requestJoin` フロー** — `status: joined` 時は新しい会話画面へ自動遷移、`pending` 時は「申請を送信しました」バナーを表示。エラー 6 種（`ConvoLocked` / `FollowRequired` / `InvalidCode` / `LinkDisabled` / `MemberLimitReached` / `UserKicked`）はローカライズ文言にマッピング済みです。
- **`withdrawJoinRequest`** — 保留中の参加申請をプレビュー画面から取り下げ可能。

**owner 操作（Phase 3）**

- **新規グループ作成モーダル** — グループ名（≤50 grapheme）+ メンバー選択（≤49 名、`searchActorsTypeahead` ベース）。`createGroup` の 7 種エラーをローカライズ表示します。
- **グループ設定画面** — `/messages/:convoId/settings` でグループ名編集・メンバー一覧（ページング）・追加・削除・ロック切替・退出を一元化。owner 判定は `convo.members` 内の `GroupConvoMember.role` で行います。
- **招待リンク管理** — 作成 / 編集（joinRule + requireApproval）/ 有効化 / 無効化 / コピー / ブラウザで開く、すべて設定画面に統合。
- **参加申請承認画面** — `/messages/:convoId/requests` で `listJoinRequests` の一覧表示と承認・拒否操作。画面オープン時に `updateJoinRequestsRead` で自動既読化します。
- **招待リンク embed 送信フック** — `useSendJoinLinkMessage` 追加。チャット選択ピッカー UI は未実装ですが、当面は招待 URL を通常テキストとして貼ることで in-app 解決経由で参加 UI に到達できます。
- **エントリーポイント** — メッセージ画面の FAB に「新規グループ」ボタンを追加（既存 DM 用 FAB の上に積層）。DM リスト空状態にも併設。

**プライバシー設定（Phase 4・本リリースの新規実装）**

- **`allowGroupInvites` 設定 UI** — 設定画面に「チャット」セクションを新設し、グループ招待を受け取る相手を **全員 / フォロー中の人のみ / 誰からも受け取らない** から選択できます。
- **`chat.bsky.actor.declaration` への永続化** — ユーザーの PDS 上の `self` 宣言レコードを読み書きします。既存の `allowIncoming` 値は保持し、未登録時は lexicon 必須フィールドを満たすため自動的に `"all"` を補完します。

### 🌐 多言語対応（11 言語）

チャットプライバシーセクション用の新規キー 5 種（`settings.chatPrivacy` / `settings.allowGroupInvites` / `settings.allowGroupInvitesOption.{all,following,none}` / `settings.allowGroupInvitesHint` / `settings.allowGroupInvitesError`）を全 11 言語（de / en / es / fr / id / ja / ko / pt / ru / zh-CN / zh-TW）に追加しました。先行する Phase でも `messages.joinLink.*` キーが ja / en に追加されています。

### 🔧 メンテナンス

- **`@atproto/api`** を `^0.20.11` → `^0.20.14` にアップデート。`chat.bsky.group.*` 17 endpoint の codegen、`chat.bsky.embed.joinLink`、`groupConvo`、`systemMessageView` 等の新規型をすべて取り込みました。
- **CI/CD** — `.github/workflows/release.yml` から macOS Tauri ビルドマトリクスを撤去しました。今後 GitHub Actions は Windows バイナリのみをビルドします。macOS 利用者は Mac App Store 版（`kazahana-ios` Catalyst ビルド）をご利用ください。

### 📝 ドキュメント

- README（EN / JA）の機能リストにグループチャットを追加。
- `docs/PLATFORM_MATRIX.md` セクション 8 を「ダイレクトメッセージ・グループチャット」へ改名し、groupConvo 表示・システムメッセージ・joinLink embed・招待 URL の in-app 解決・参加申請承認・ロック操作・`allowGroupInvites` プライバシー設定の各行を Desktop で埋めました。

### 📚 関連リソース

- [HANDOFF_kazahana-group-chat.md](https://github.com/osprey74/kazahana/blob/main/HANDOFF_kazahana-group-chat.md) — 3 プラットフォーム実装 HANDOFF
- [Bluesky social-app v1.124.0 リリース](https://github.com/bluesky-social/social-app/releases/tag/1.124.0)
- [atproto PR #4854 — group chat lexicons](https://github.com/bluesky-social/atproto/pull/4854)
- [chat.bsky lexicons（atproto/main）](https://github.com/bluesky-social/atproto/tree/main/lexicons/chat/bsky)
