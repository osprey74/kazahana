## What's New / 新機能・変更点

### English

#### 🐛 Fixes / 🎨 UX Improvements

**Better discoverability for group chat join requests**

In v3.4.0 the only place that surfaced unread join requests was the badge inside `DMThreadView`, so you had to open each group you owned to find out where requests were waiting. v3.4.1 fixes this on two layers:

- **DM tab badge now includes unread join requests** — `useUnreadDMs` aggregates each conversation's `unreadCount` together with `groupConvo.unreadJoinRequestCount` (the lexicon returns this field only for owners), so the red badge on the messages tab gives a single at-a-glance signal that something in your chats needs attention. The badge updates within the existing 30 s poll window, and is also invalidated immediately when `updateJoinRequestsRead` is called so it drops as soon as you open the requests screen.
- **Per-conversation indicator in the messages list** — `ConversationItem` now renders a bold, primary-colored "{count} pending join requests" line between the group title row and the message preview, matching the existing Android implementation in `MessagesScreen.kt`. This lets you tell at a glance which group has pending requests without entering each one.

The pre-existing join request indicators (the badge in `DMThreadView`'s header and the "{count} pending" link in `GroupSettingsView`) are unchanged.

#### 🌐 i18n

- New key `messages.group.joinRequestsBadge` added to `ja` / `en` (matching the existing `messages.group.*` locale coverage from earlier group chat phases).

---

### 日本語

#### 🐛 修正 / 🎨 UX 改善

**グループチャット参加申請の発見性を改善**

v3.4.0 では未読の参加申請を確認できるのは `DMThreadView` 内のバッジだけだったため、自分が owner のグループを 1 つずつ開かないと申請の所在を把握できませんでした。v3.4.1 ではこの導線を 2 層で改善しています：

- **DM タブのバッジに未読参加申請数を合算** — `useUnreadDMs` で各会話の `unreadCount` に加え `groupConvo.unreadJoinRequestCount`（lexicon 仕様により owner にのみサーバが返却するフィールド）を合算するようにしました。これによりメッセージタブの赤バッジ 1 つで「自分のチャットで対応すべきもの」全体を一目で把握できます。既存の 30 秒ポーリングで更新されるほか、`updateJoinRequestsRead`（参加申請画面オープン時に呼ばれる）の成功時にも即座に invalidate されるため、申請画面を開いた瞬間にバッジが減ります。
- **会話リスト内に per-group インジケータを追加** — `ConversationItem` のグループタイトル行とメッセージプレビュー行の間に、太字 + primary 色で「{count} 件の参加申請」を表示するようになりました。Android 版の `MessagesScreen.kt` と同じ意匠です。各グループを開かなくても、リストを見るだけでどのグループに申請が溜まっているかを一目で把握できます。

既存の参加申請インジケータ（`DMThreadView` ヘッダの赤バッジ、`GroupSettingsView` 内の「{count} 件の保留中」リンク）は変更ありません。

#### 🌐 多言語対応

- 新規キー `messages.group.joinRequestsBadge` を `ja` / `en` に追加（先行 Phase の `messages.group.*` と同じく 2 言語のみのカバレッジ）。
