# Release Notes — kazahana v2.3.0

## New Features / 新機能

### Notification Grouping / 通知グルーピング表示

- Notifications for the same post (likes, reposts) are now grouped together, displaying as "User and N others liked your post" — matching the official Bluesky app behavior.
- Grouped notifications show up to 3 stacked avatars for a compact view.
- Subject post content is loaded in batches of 10 groups for faster display.
- Images in notifications are shown as 64px square thumbnails; videos show a static thumbnail without playback controls.

---

- 同一ポストへのいいね・リポスト等の通知をグルーピングし、「〇〇ほかN人がいいねしました」形式で表示するようになりました（Bluesky公式アプリ準拠）。
- グループ化された通知は最大3つのアバターを重ねて表示します。
- 対象ポストの内容は10グループずつバッチ読み込みし、表示速度を向上しました。
- 通知内の画像は64pxの正方形サムネイル、動画はサムネイルのみの静止画表示となります。

### Save Media from Posts / 画像・動画の一括保存

- A new "Save media" option has been added to the three-dot menu on posts containing images or videos (below "Translate").
- All images and videos in a post are saved at once. Images are saved with the correct file extension detected via magic bytes. Videos are downloaded from the author's PDS via the AT Protocol `getBlob` API.
- A loading overlay is displayed on the post card while saving is in progress.
- Available in both timeline and thread views.

---

- 画像・動画を含むポストの三点メニュー（「翻訳する」の下）に「画像・動画を保存」メニューを追加しました。
- ポストに含まれる全ての画像・動画を一括保存します。画像はマジックバイト検出で正しい拡張子で保存、動画はAT Protocol getBlob API経由で投稿者のPDSから取得して保存します。
- 保存中はポスト全体にローディングオーバーレイが表示されます。
- タイムライン表示・スレッド表示の両方で利用可能です。

## Internationalization / 多言語対応

- All new features are fully localized in 11 languages: Japanese, English, German, Spanish, French, Indonesian, Korean, Portuguese, Russian, Simplified Chinese, Traditional Chinese.

---

- 全ての新機能は11言語に対応しています（日本語・英語・ドイツ語・スペイン語・フランス語・インドネシア語・韓国語・ポルトガル語・ロシア語・簡体字中国語・繁体字中国語）。
