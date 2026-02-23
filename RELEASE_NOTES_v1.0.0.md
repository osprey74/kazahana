# kazahana v1.0.0

## Initial Release / 初回リリース

The first public release of kazahana — a lightweight Bluesky desktop client built with Tauri v2.
kazahana の初回パブリックリリース — Tauri v2 で構築した軽量 Bluesky デスクトップクライアント。

### Features / 機能

- **Timeline** — Home timeline with auto-refresh (configurable 20–120s interval) and reading position marker
  **タイムライン** — 自動更新（20〜120秒の設定可能な間隔）と既読位置マーカー付きホームタイムライン
- **Posting** — Text posts, replies, image attachments (up to 4, with ALT text), video attachments (upload, HLS playback, volume setting)
  **投稿** — テキスト投稿、返信、画像添付（最大4枚、ALTテキスト対応）、動画添付（アップロード、HLS再生、音量設定）
- **Rich text** — Auto-detection of mentions, URLs, hashtags with facet generation; mention autocomplete
  **リッチテキスト** — メンション、URL、ハッシュタグの自動検出とファセット生成、メンションオートコンプリート
- **Interactions** — Like, repost, quote post, bookmark, post deletion
  **インタラクション** — いいね、リポスト、引用投稿、ブックマーク、投稿削除
- **Thread view** — Full thread display with liked-by, reposted-by, and quotes lists
  **スレッド表示** — いいね・リポスト・引用一覧付きのスレッド表示
- **Notifications** — Notification list with unread badge and OS desktop notifications (like/repost/reply/mention/follow/quote)
  **通知** — 未読バッジ付き通知一覧、OSデスクトップ通知（いいね/リポスト/返信/メンション/フォロー/引用）
- **Profile** — User profile with posts/likes/media tabs, follow/unfollow with confirmation, follower/following lists with status indicators
  **プロフィール** — 投稿/いいね/メディアタブ付きプロフィール、確認ダイアログ付きフォロー/フォロー解除、ステータス表示付きフォロワー/フォロー中リスト
- **Search** — Post and user search with persistent search history
  **検索** — 投稿・ユーザー検索、検索履歴の永続保存
- **Custom feeds & lists** — Feed selector with custom feeds and list feeds support
  **カスタムフィード・リスト** — カスタムフィードとリストフィードのタブ切替
- **Content moderation** — Label-based filtering, blur, media blur, adult content toggle, per-label settings (hide/warn/ignore)
  **コンテンツモデレーション** — ラベル判定によるフィルタ・ブラー、成人向けコンテンツトグル、ラベル別設定
- **Threadgate & postgate** — Reply and quote restriction settings
  **スレッドゲート・ポストゲート** — 返信・引用の制限設定
- **Image lightbox** — Full-screen image viewer with keyboard navigation and swipe gestures
  **画像ライトボックス** — キーボード操作・スワイプジェスチャー対応の画像拡大表示
- **Link card** — OGP preview for embedded links
  **リンクカード** — 埋め込みリンクのOGPプレビュー
- **Theme** — Dark / Light / System theme
  **テーマ** — ダーク/ライト/システム連動テーマ
- **i18n** — 11 languages (Japanese, English, German, Spanish, French, Portuguese, Korean, Russian, Indonesian, Traditional Chinese, Simplified Chinese)
  **多言語対応** — 11言語（日本語、英語、ドイツ語、スペイン語、フランス語、ポルトガル語、韓国語、ロシア語、インドネシア語、繁體中文、简体中文）
- **System tray** — Minimize to tray, unread badge
  **システムトレイ** — トレイに最小化、未読バッジ
- **Auto-start** — Optional auto-start on OS boot
  **自動起動** — OS起動時の自動起動（オプション）
- **Moderation tools** — Report posts/users, mute/block users, hide individual posts, mute thread notifications
  **モデレーションツール** — 投稿・ユーザーの通報、ミュート・ブロック、投稿の非表示、スレッド通知のミュート
- **Starter Packs** — View starter packs on user profiles
  **スターターパック** — プロフィールでのスターターパック閲覧
- **Other** — Post language auto-tagging, copy post link, list membership management, custom right-click context menu, rate limit handling
  **その他** — 投稿言語の自動タグ付け、投稿リンクのコピー、リストメンバーシップ管理、カスタム右クリックメニュー、レート制限ハンドリング

---

## Downloads / ダウンロード

| File | Description |
|------|-------------|
| `kazahana_1.0.0_x64-setup.exe` | Windows x64 installer (NSIS) |
| `kazahana_1.0.0_x64_en-US.msi` | Windows x64 installer (MSI) |

---

> **Note:** These binaries are not code-signed. Your OS may show a security warning during installation.
> See the [install guide](https://osprey74.github.io/kazahana/en/install.html) for instructions on how to proceed.
>
> **注意:** これらのバイナリはコード署名されていません。インストール時にセキュリティ警告が表示される場合があります。
> 対処方法は[インストールガイド](https://osprey74.github.io/kazahana/ja/install.html)を参照してください。
