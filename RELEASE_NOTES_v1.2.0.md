# kazahana v1.2.0

## What's New / 新機能

### Added / 追加

- **Direct Messages (DM)** — Send and receive direct messages via `chat.bsky.convo` API
  **ダイレクトメッセージ (DM)** — `chat.bsky.convo` API によるDMの送受信
  - Conversation list with unread badge / 未読バッジ付き会話一覧
  - Message thread view with 5-second auto-refresh / 5秒自動更新のメッセージスレッド表示
  - New conversation via user search / ユーザー検索から新規会話作成
  - Mute/unmute, leave conversation / 会話のミュート/解除、退出
  - Accept message requests / メッセージリクエストの承認
  - Delete messages / メッセージの削除
  - Rich text facets support (mentions, links, hashtags) / リッチテキストファセット対応

### Fixed / 修正

- **Timeline scroll position jump** — Timeline no longer jumps down 3–5 posts when new posts are fetched during reading
  **タイムラインのスクロール位置ジャンプ** — 閲覧中に新着取得が発生した際、3〜5投稿分下にジャンプする問題を修正
- **Version display** — Settings page version now auto-updates from package.json (no longer hardcoded)
  **バージョン表示** — 設定画面のバージョン表記が package.json から自動取得に変更（ハードコード廃止）

---

## Downloads / ダウンロード

| File | Description |
|------|-------------|
| `kazahana_1.2.0_x64-setup.exe` | Windows x64 installer (NSIS) |
| `kazahana_1.2.0_x64_en-US.msi` | Windows x64 installer (MSI) |
| `kazahana_1.2.0_aarch64.dmg` | macOS Apple Silicon (DMG) |
| `kazahana_1.2.0_x64.dmg` | macOS Intel (DMG) |

---

> **Note:** These binaries are not code-signed. Your OS may show a security warning during installation.
> See the [install guide](https://osprey74.github.io/kazahana/en/install.html) for instructions on how to proceed.
>
> **注意:** これらのバイナリはコード署名されていません。インストール時にセキュリティ警告が表示される場合があります。
> 対処方法は[インストールガイド](https://osprey74.github.io/kazahana/ja/install.html)を参照してください。
