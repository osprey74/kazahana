## What's New / 新機能・変更点

### English

This release brings kazahana up to parity with Bluesky's official v1.123 client (released 2026-06-06).

#### ✨ New Features

- **Up to 10 images per post** — 5+ image posts automatically use the new `app.bsky.embed.gallery` lexicon (atproto PR #4827). 4-or-fewer posts keep using `app.bsky.embed.images` for backwards compatibility.
- **Image carousel for 5+ image posts** — Posts with 5 or more images are now displayed as a horizontal-scrolling carousel with image count badges (`3/10`), matching the official client (social-app PR #10707). 4-image-or-fewer posts continue to use the existing grid layout.
- **Video upload up to 300 MB** — Raised from 100 MB. The Bluesky video service transcodes oversize uploads down to fit the lexicon limit.

#### ✨ UX Improvements

- **Compose modal upload progress overlay** — A semi-transparent overlay with large spinner and progress bar now appears during posting. State-aware messages: `Uploading image (3/10)` / `Uploading video... 45%` / `Processing video...` / `Finalizing post...`.
- **Notification panel thumbnails** — Grouped notification thumbnails scroll horizontally when there are 5+ images, with a count badge on each.
- **Bulk media save & original image size dialog** — Now correctly handle `app.bsky.embed.gallery` posts.

#### 🔧 Maintenance

- `@atproto/api` updated to `^0.20.11` (gallery codegen added in 0.20.9 via atproto PR #4827).
- Embed extraction logic consolidated into `src/lib/embed/gallery.ts`, removing duplication across 6 files. Normalizes both legacy `embed.images#view` (`thumb` field) and new `embed.gallery#view` (`thumbnail` field) into a unified shape.

#### 🌐 i18n (11 languages)

- New keys `compose.uploadingImage` and `compose.finalizingPost` added across all 11 locales (de / en / es / fr / id / ja / ko / pt / ru / zh-CN / zh-TW).

#### 📚 References

- [atproto PR #4827](https://github.com/bluesky-social/atproto/pull/4827) — `app.bsky.embed.gallery` lexicon
- [social-app PR #10707](https://github.com/bluesky-social/social-app/pull/10707) — Official client gallery implementation
- [social-app PR #10497](https://github.com/bluesky-social/social-app/pull/10497) — 300 MB video upload

---

### 日本語

このリリースで、kazahana は Bluesky 公式 v1.123 クライアント（2026-06-06 リリース）と機能パリティに到達しました。

#### ✨ 新機能

- **写真 10 枚投稿対応** — 5 枚以上の画像を添付すると、atproto PR #4827 で導入された新 lexicon `app.bsky.embed.gallery` 種別で自動的に投稿されます。4 枚以下は従来通り `app.bsky.embed.images` で投稿されるため後方互換は維持されます。
- **5 枚以上の画像投稿はカルーセル表示** — 5 枚以上の画像投稿は枚数バッジ（`3/10`）付きの横スクロールカルーセルで表示されます（social-app PR #10707 互換）。4 枚以下は既存のグリッドレイアウトを維持します。
- **動画アップロード 300 MB まで対応** — 従来の 100 MB から拡張。Bluesky 動画サービス側で lexicon 上限に合わせてトランスコードされます。

#### ✨ UX 改善

- **投稿モーダルにアップロード進捗オーバーレイ** — 投稿実行中、半透明オーバーレイ + 大型スピナー + 進捗バーが表示されます。状態別表示：`画像をアップロード中 (3/10)` / `動画をアップロード中... 45%` / `変換処理中...` / `投稿を準備中...`。
- **通知欄サムネイルの横スクロール対応** — グループ化された通知で 5 枚以上のサムネイルがある場合、はみ出さず横スクロールで表示。各サムネイルに枚数バッジを表示します。
- **画像・動画の一括保存 / 原本サイズ表示** — `app.bsky.embed.gallery` 投稿（5 枚以上）も正しく認識して動作するようになりました。

#### 🔧 メンテナンス

- `@atproto/api` を `^0.20.11` にアップデート（gallery codegen は 0.20.9 で追加、atproto PR #4827）。
- Embed 抽出ロジックを `src/lib/embed/gallery.ts` に集約、6 ファイルの重複を解消。Legacy `embed.images#view`（`thumb` フィールド）と新 `embed.gallery#view`（`thumbnail` フィールド）を統一形式に正規化します。

#### 🌐 多言語対応（11 言語）

- 新規キー `compose.uploadingImage` と `compose.finalizingPost` を全 11 言語（de / en / es / fr / id / ja / ko / pt / ru / zh-CN / zh-TW）に追加。

#### 📚 関連リソース

- [atproto PR #4827](https://github.com/bluesky-social/atproto/pull/4827) — `app.bsky.embed.gallery` lexicon
- [social-app PR #10707](https://github.com/bluesky-social/social-app/pull/10707) — 公式クライアント gallery 実装
- [social-app PR #10497](https://github.com/bluesky-social/social-app/pull/10497) — 動画 300 MB アップロード

---

## Downloads / ダウンロード

| Platform | File |
|---|---|
| Windows x64 (Installer) | `kazahana_3.3.0_x64-setup.exe` |
| Windows x64 (MSI) | `kazahana_3.3.0_x64_en-US.msi` |
| macOS Apple Silicon | `kazahana_3.3.0_aarch64.dmg` |
| macOS Intel | `kazahana_3.3.0_x64.dmg` |
