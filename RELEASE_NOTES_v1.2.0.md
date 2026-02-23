# kazahana v1.2.0

## What's New

### Added

- **Direct Messages (DM)** — Send and receive direct messages via `chat.bsky.convo` API
  - Conversation list with unread badge
  - Message thread view with 5-second auto-refresh
  - New conversation via user search
  - Mute/unmute, leave conversation
  - Accept message requests
  - Delete messages
  - Rich text facets support (mentions, links, hashtags)

### Fixed

- **Timeline scroll position jump** — Timeline no longer jumps down 3–5 posts when new posts are fetched during reading
- **Version display** — Settings page version now auto-updates from package.json (no longer hardcoded)

---

## Downloads

| File | Description |
|------|-------------|
| `kazahana_1.2.0_x64-setup.exe` | Windows x64 installer (NSIS) |
| `kazahana_1.2.0_x64_en-US.msi` | Windows x64 installer (MSI) |
| `kazahana_1.2.0_aarch64.dmg` | macOS Apple Silicon (DMG) |
| `kazahana_1.2.0_x64.dmg` | macOS Intel (DMG) |

---

> **Note:** These binaries are not code-signed. Your OS may show a security warning during installation.
> See the [install guide](https://osprey74.github.io/kazahana/en/install.html) for instructions on how to proceed.

---

# kazahana v1.2.0

## 新機能

### 追加

- **ダイレクトメッセージ (DM)** — `chat.bsky.convo` API によるDMの送受信
  - 未読バッジ付き会話一覧
  - 5秒自動更新のメッセージスレッド表示
  - ユーザー検索から新規会話作成
  - 会話のミュート/解除、退出
  - メッセージリクエストの承認
  - メッセージの削除
  - リッチテキストファセット対応

### 修正

- **タイムラインのスクロール位置ジャンプ** — 閲覧中に新着取得が発生した際、3〜5投稿分下にジャンプする問題を修正
- **バージョン表示** — 設定画面のバージョン表記が package.json から自動取得に変更（ハードコード廃止）

---

## ダウンロード

| File | Description |
|------|-------------|
| `kazahana_1.2.0_x64-setup.exe` | Windows x64 installer (NSIS) |
| `kazahana_1.2.0_x64_en-US.msi` | Windows x64 installer (MSI) |
| `kazahana_1.2.0_aarch64.dmg` | macOS Apple Silicon (DMG) |
| `kazahana_1.2.0_x64.dmg` | macOS Intel (DMG) |

---

> **注意:** これらのバイナリはコード署名されていません。インストール時にセキュリティ警告が表示される場合があります。
> 対処方法は[インストールガイド](https://osprey74.github.io/kazahana/ja/install.html)を参照してください。
