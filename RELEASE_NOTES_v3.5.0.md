# kazahana v3.5.0

## English

### ✨ New Features

#### In-chat message reply (Bluesky social-app v1.125.0 compatibility)

kazahana now supports the Bluesky in-chat reply feature shipped in social-app v1.125.0 (2026-06-17). You can reply to a specific message inside a DM or group conversation, and replies sent by others show the original message inline.

**Receive side:**

- When a message has `chat.bsky.convo.defs#replyRef` populated, kazahana renders an inline citation chip above the bubble with the original message preview.
- If the referenced message was later deleted, the chip falls back to an italic "Message deleted" placeholder via `chat.bsky.convo.defs#deletedMessageView`.
- Tapping the chip smoothly scrolls the original bubble into view and triggers a brief highlight animation so you can locate it at a glance.

**Send side:**

- The three-dot menu on every chat bubble (your own or someone else's) now exposes a **Reply** action. Selecting it surfaces a cancellable reply chip above the composer.
- The composer chip is forwarded to the `sendMessage` call via the new `messageInput.replyTo` field, requiring `@atproto/api >= 0.20.16`.
- When the reply target is deleted between selection and submit, the server returns `ReplyTargetNotFound`. kazahana surfaces this as an inline localized error banner so you can retry with a fresh target.

#### Mention facet empty-DID validation

When the AT Protocol `RichText.detectFacets()` helper fails to resolve a handle (network blip, suspended account, typo), it returns the facet with an empty `did` string. Until now, kazahana sent the record verbatim, which the server then rejected with `Invalid DID (got "")` — surfacing as a confusing "投稿に失敗しました" / "Failed to post" message with no recovery path.

v3.5.0 adds a `sanitizeFacets()` guard that strips mention features with empty DIDs (and drops the whole facet if nothing remains) at both DM and post send sites. The `@unresolved-handle` text simply degrades to plain text, and the send succeeds.

### 🔧 Maintenance

- `@atproto/api`: `^0.20.14` → `^0.20.16` (required for the new chat reply types).
- `docs/PLATFORM_MATRIX.md`: added two new rows under Section 8 for the reply receive / send capability, plus a new "Desktop 先行実装 (iOS / Android 未実装)" subsection in the parity summary.

### 🌐 i18n

- New keys `messages.reply.{replyingTo,action,cancel,targetNotFound}` and `common.menu` added to `ja` / `en` (matching the existing `messages.*` chat-feature locale coverage).

### 🔧 Cross-platform parity

Chat reply and mention-facet validation are Desktop-only in this release. iOS and Android will pick up the same capabilities in their next releases respectively, tracked in `docs/PLATFORM_MATRIX.md`.

---

## 日本語

### ✨ 新機能

#### チャット内メッセージ返信機能（Bluesky social-app v1.125.0 互換）

Bluesky social-app v1.125.0（2026-06-17 リリース）で導入されたチャット内メッセージ返信機能に対応しました。DM・グループ会話の中で特定のメッセージへ返信でき、相手から届いた返信投稿には引用元メッセージがインライン表示されます。

**受信側：**

- メッセージに `chat.bsky.convo.defs#replyRef` が含まれている場合、kazahana はバブル上部に返信元メッセージのプレビューチップを表示します。
- 引用元メッセージが後に削除されていた場合は `chat.bsky.convo.defs#deletedMessageView` を介して「メッセージが削除されました」のフォールバック表示に切り替わります。
- 返信元プレビューをタップすると、元のバブルへ平滑スクロールしハイライトアニメーションで強調表示するため、すぐに該当メッセージを見つけられます。

**送信側：**

- 各バブル（自分・相手問わず）の三点メニューに **「返信」** アクションを追加。選択すると入力欄上部にキャンセル可能な返信先チップが表示されます。
- 送信時に新しい `messageInput.replyTo` フィールドへ自動で `messageId` が付与されます。本機能には `@atproto/api >= 0.20.16` が必要です。
- 返信開始から送信までの間に対象メッセージが削除された場合、サーバから `ReplyTargetNotFound` が返ります。kazahana はこれをローカライズしたエラーバナーで通知するため、新しい対象を選び直して再送できます。

#### メンション facet 空 DID バリデーション

AT Protocol の `RichText.detectFacets()` はハンドル解決に失敗すると（ネットワーク不調・アカウント停止・タイポ等）、facet の `did` フィールドが空文字列のまま生成されます。これまで kazahana はそのままサーバへ送信していたため、サーバ側で `Invalid DID (got "")` として弾かれ、「投稿に失敗しました」と表示されるだけで原因も復旧手段も分からない状態でした。

v3.5.0 では `sanitizeFacets()` ガードを追加し、DM とポストの送信パスの両方で**空 DID のメンション feature を除外**（features が空になった facet ごとドロップ）します。`@未解決ハンドル` のテキストは単にプレーンテキスト扱いになり、送信は正常に完了します。

### 🔧 メンテナンス

- `@atproto/api`: `^0.20.14` → `^0.20.16`（新しいチャット返信型のため必須）
- `docs/PLATFORM_MATRIX.md`: Section 8 に返信機能（受信／送信）の 2 行を追加。差異サマリーに「Desktop 先行実装（iOS / Android 未実装）」セクションを新設

### 🌐 多言語対応

- 新規キー `messages.reply.{replyingTo,action,cancel,targetNotFound}` および `common.menu` を `ja` / `en` に追加（既存の `messages.*` チャット機能と同じ 2 言語カバレッジ）

### 🔧 マルチプラットフォーム対応について

チャット返信機能とメンション facet バリデーションは本リリースでは Desktop のみの対応です。iOS / Android については、各々の次回リリースにて順次対応予定です（`docs/PLATFORM_MATRIX.md` で追跡）。
