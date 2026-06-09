# kazahana v3.3.0

## English

### ✨ New Features

#### Bluesky v1.123 Compatibility

This release brings kazahana up to parity with Bluesky's official v1.123 client (released 2026-06-06).

- **Up to 10 images per post** — When attaching 5 or more images, posts are automatically composed as `app.bsky.embed.gallery` (the new lexicon introduced in atproto PR #4827). 4 or fewer images continue to use the legacy `app.bsky.embed.images`, so backwards compatibility is preserved.
- **Image carousel for 5+ image posts** — Posts with 5 or more images are now displayed as a horizontal-scrolling carousel with image count badges (`3/10`), matching the official client's UX (social-app PR #10707). 4-image-or-fewer posts continue to use the existing grid layout.
- **Video upload up to 300 MB** — Raised from the previous 100 MB limit. The Bluesky video service transcodes oversize uploads down to fit the lexicon limit (still 100 MB at the lexicon level), so this is a server-side acceptance increase.

### ✨ UX Improvements

- **Compose modal upload progress overlay** — When posting with attachments, the modal now shows a semi-transparent overlay with a large spinner, status text, and a progress bar. Status messages adapt to the current phase:
  - Image upload: `Uploading image (3/10)` with progress bar
  - Video upload: `Uploading video... 45%` with progress bar
  - Video processing: `Processing video...`
  - Post finalization: `Finalizing post...`
- **Notification panel thumbnails** — Grouped notification thumbnails now scroll horizontally when there are 5 or more images, preventing overflow with a count badge on each thumbnail.
- **Bulk media save and original image size dialogs** — Now correctly recognize and operate on `app.bsky.embed.gallery` posts (5+ images).

### 🔧 Maintenance

- **`@atproto/api` updated** from `^0.20.5` to `^0.20.11`. The `AppBskyEmbedGallery` codegen was added in 0.20.9 via atproto PR #4827. Includes the latest chat lexicons as well.
- **Embed extraction helper consolidated** — The previously duplicated `getImages()` logic across `PostCard.tsx`, `ThreadView.tsx`, `NotificationItem.tsx`, `QuoteEmbed.tsx`, `GroupedNotificationItem.tsx`, and `PostActions.tsx` is now centralized in `src/lib/embed/gallery.ts`. This helper normalizes both legacy `embed.images#view` and the new `embed.gallery#view` (which uses a different `thumbnail` field name) into a unified `MediaImage` shape.

### 📝 Documentation

- README (EN/JA) feature list updated for 10-image posts, 300 MB video, and carousel display
- `design/kazahana-spec.md` updated with new content limits and posting/display feature rows
- `docs/{en,ja}/guide/index.md` user guides updated for image / video upload UX
- `docs/PLATFORM_MATRIX.md` updated:
  - Section 2 (Display): `app.bsky.embed.gallery` carousel row added
  - Section 4 (Posting): gallery composer row and 300 MB video row added
  - "Desktop ahead (iOS / Android not implemented)" subsection added to the diff summary

### 🌐 i18n (11 languages)

- New keys `compose.uploadingImage` and `compose.finalizingPost` added across all 11 locales (de, en, es, fr, id, ja, ko, pt, ru, zh-CN, zh-TW).

### 📚 References

- [HANDOFF_kazahana-bsky-v1.123.md](https://github.com/osprey74/kazahana/blob/main/HANDOFF_kazahana-bsky-v1.123.md) — Cross-platform implementation handoff
- [atproto PR #4827](https://github.com/bluesky-social/atproto/pull/4827) — `app.bsky.embed.gallery` lexicon
- [social-app PR #10707](https://github.com/bluesky-social/social-app/pull/10707) — Official client gallery implementation
- [social-app PR #10497](https://github.com/bluesky-social/social-app/pull/10497) — 300 MB video upload

---

## 日本語

### ✨ 新機能

#### Bluesky v1.123 対応

このリリースで、kazahana は Bluesky 公式 v1.123 クライアント（2026-06-06 リリース）と機能パリティに到達しました。

- **写真 10 枚投稿対応** — 5 枚以上の画像を添付すると、atproto PR #4827 で導入された新 lexicon `app.bsky.embed.gallery` 種別で自動的に投稿されます。4 枚以下は従来通り `app.bsky.embed.images` で投稿されるため後方互換は維持されます。
- **5 枚以上の画像投稿はカルーセル表示** — 5 枚以上の画像投稿は枚数バッジ（`3/10`）付きの横スクロールカルーセルで表示されます（social-app PR #10707 互換）。4 枚以下は既存のグリッドレイアウトを維持します。
- **動画アップロード 300 MB まで対応** — 従来の 100 MB から拡張。Bluesky 動画サービス側で lexicon 上限（100 MB）に合わせてトランスコードされるため、サーバの受容範囲拡大としての対応です。

### ✨ UX 改善

- **投稿モーダルにアップロード進捗オーバーレイ** — 添付付き投稿時、モーダルに半透明オーバーレイ + 大型スピナー + 状態テキスト + 進捗バーが表示されます。状態別表示：
  - 画像アップロード中: `画像をアップロード中 (3/10)` + 進捗バー
  - 動画アップロード中: `動画をアップロード中... 45%` + 進捗バー
  - 動画変換中: `変換処理中...`
  - 投稿準備中: `投稿を準備中...`
- **通知欄サムネイルの横スクロール対応** — グループ化された通知で 5 枚以上のサムネイルがある場合、はみ出さず横スクロールで表示。各サムネイルに枚数バッジを表示します。
- **画像・動画の一括保存 / 原本サイズ表示** — `app.bsky.embed.gallery` 投稿（5 枚以上）も正しく認識して動作するようになりました。

### 🔧 メンテナンス

- **`@atproto/api` を `^0.20.5` → `^0.20.11` にアップデート**。`AppBskyEmbedGallery` の codegen は 0.20.9（atproto PR #4827）で追加。最新の chat lexicons も同時取り込み。
- **Embed 抽出ヘルパの一元化** — `PostCard.tsx` / `ThreadView.tsx` / `NotificationItem.tsx` / `QuoteEmbed.tsx` / `GroupedNotificationItem.tsx` / `PostActions.tsx` の 6 ファイルで重複していた `getImages()` ロジックを `src/lib/embed/gallery.ts` に集約。Legacy `embed.images#view` と新 `embed.gallery#view`（`thumbnail` フィールド名が異なる）を統一 `MediaImage` 型に正規化します。

### 📝 ドキュメント

- README（EN/JA）の機能リストを「10 枚画像投稿」「300 MB 動画」「カルーセル表示」で更新
- `design/kazahana-spec.md` のコンテンツ上限・投稿作成・投稿表示セクション更新
- `docs/{en,ja}/guide/index.md` のユーザーガイド（画像・動画追加）更新
- `docs/PLATFORM_MATRIX.md` 更新:
  - セクション 2「投稿表示」に `app.bsky.embed.gallery` カルーセル行追加
  - セクション 4「投稿作成」に gallery 送信行・動画 300MB 行追加
  - 差異サマリーに「Desktop 先行実装（iOS / Android 未実装）」セクションを新設

### 🌐 多言語対応（11 言語）

- 新規キー `compose.uploadingImage` と `compose.finalizingPost` を全 11 言語（de, en, es, fr, id, ja, ko, pt, ru, zh-CN, zh-TW）に追加。

### 📚 関連リソース

- [HANDOFF_kazahana-bsky-v1.123.md](https://github.com/osprey74/kazahana/blob/main/HANDOFF_kazahana-bsky-v1.123.md) — 3 プラットフォーム実装 HANDOFF
- [atproto PR #4827](https://github.com/bluesky-social/atproto/pull/4827) — `app.bsky.embed.gallery` lexicon
- [social-app PR #10707](https://github.com/bluesky-social/social-app/pull/10707) — 公式クライアント gallery 実装
- [social-app PR #10497](https://github.com/bluesky-social/social-app/pull/10497) — 動画 300 MB アップロード
