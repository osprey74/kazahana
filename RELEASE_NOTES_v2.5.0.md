# Release Notes — v2.5.0

## EN

### New Features

- **2 MB image uploads** — Adopt [atproto #4823](https://github.com/bluesky-social/atproto/pull/4823) on the sender side, raising the per-image blob ceiling from 1 MB to 2 MB. Large photos now round-trip at noticeably higher JPEG quality.
- **Official-compatible downsizing algorithm** — Client-side image compression now mirrors the official Bluesky client ([social-app #10117](https://github.com/bluesky-social/social-app/pull/10117)): start at `min(longerSide, 4000)` px, iterate with a ×0.8 scale factor up to 5 times, with a quality-sweep (0.85 → 0.7 → 0.5 → 0.3) inside each resolution step. Resolution is preserved as long as JPEG quality alone meets the byte budget.
- **`aspectRatio` attached to image embeds** — Images now ship with their pixel dimensions in `app.bsky.embed.images`. Helpful for viewer layout today, and required by the upcoming `app.bsky.embed.gallery` type ([atproto #4827](https://github.com/bluesky-social/atproto/pull/4827)).
- **Legacy PDS fallback** — If a PDS rejects the 2 MB blob (e.g., still running the older 1 MB ceiling), the upload is transparently re-compressed to 1 MB and retried once, so posts still land during the gradual AppView rollout.
- **"Show original size" menu item** — Image-post three-dot menu now exposes the raw bytes / pixel dimensions / MIME type stored on the PDS. Reads `BlobRef` directly from the post record (no extra network round-trip), making it easy to verify the 2 MB path is actually working end-to-end — cdn.bsky.app always re-encodes for display, so the CDN-served image size is not representative of the original.

### Bug Fixes

- **Drop overlay stuck after image drop** — When dropping an image onto the inner `ImageUpload` zone, the outer modal's drag overlay failed to disappear because the inner zone calls `stopPropagation()`. Reset now lives in the shared `compressAndAddImages` path so every drop / paste / file-picker entry clears the overlay.

### Maintenance

- Extract shared image compression into `src/lib/imageCompress.ts` — consumable from ComposeModal, usePost, and future DM / gallery flows.
- Migrate user guide from hand-written HTML to Markdown (Jekyll auto-renders `.md` to the same `.html` URL on GitHub Pages — no link breakage).

---

## JA

### 新機能

- **2 MB 画像アップロード対応** — [atproto #4823](https://github.com/bluesky-social/atproto/pull/4823) に追従し、1 画像あたりの blob 上限を 1 MB → 2 MB に拡張。大きな写真がより高い JPEG 品質を保ったまま投稿できるようになりました。
- **公式互換のダウンサイジングアルゴリズム** — クライアント側の画像圧縮を公式 Bluesky クライアント相当（[social-app #10117](https://github.com/bluesky-social/social-app/pull/10117)）に刷新: 最大寸法 `min(longerSide, 4000)` px からスタート、×0.8 で最大 5 段階まで縮小、各解像度内で品質 0.85 → 0.7 → 0.5 → 0.3 を探索。品質を下げるだけでバイト上限に収まる場合は解像度を維持します。
- **画像 embed への `aspectRatio` 付与** — `app.bsky.embed.images` に画像の画素寸法を常に含めるようになりました。ビューアのレイアウト計算に有用なうえ、次期 `app.bsky.embed.gallery` 型（[atproto #4827](https://github.com/bluesky-social/atproto/pull/4827)）では必須フィールドになる予定のため先行対応しています。
- **旧仕様 PDS への自動フォールバック** — PDS が 2 MB blob を拒否した場合（1 MB 上限の旧 atproto サーバーで運用されているケース）、自動で 1 MB に再圧縮してリトライします。AppView の段階ロールアウト期間中も投稿が途切れません。
- **投稿メニュー「原本サイズを表示」** — 画像付きポストの三点メニューから、PDS に保存されている**原本**のバイト数・寸法・MIME Type を確認できます。`BlobRef` を record から直接読み取るのでネットワーク不要。cdn.bsky.app は常に再エンコードして配信するため、タイムラインで見えるファイルサイズは原本と異なります。2 MB 投稿が実際に反映されているかの確認に便利です。

### バグ修正

- **画像 D&D 後もドロップオーバーレイが消えないバグを修正** — 内側の `ImageUpload` ドロップゾーンが `stopPropagation()` するため外側モーダルのオーバーレイリセットが発火しない問題を、全入力経路（ドロップ／ペースト／ファイルピッカー）が通る共通関数 `compressAndAddImages` でリセットする形に修正。

### メンテナンス

- 画像圧縮ユーティリティを `src/lib/imageCompress.ts` に共通化 — ComposeModal / usePost から利用、今後 DM 画像送信・`embed.gallery` 対応からも再利用可能。
- 操作マニュアルを手書き HTML から Markdown にマイグレーション（GitHub Pages の Jekyll が `.md` を同じ `.html` URL にレンダリングするためリンク互換性は維持）。
