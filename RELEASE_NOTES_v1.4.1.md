# kazahana v1.4.1

## What's New

### Added

- **Custom URI protocol (`kazahana://compose`)** — Share web pages directly to kazahana's compose screen via deep links. Works with both cold start (app not running) and warm start (app already running).
  - Format: `kazahana://compose?title=...&url=...`
  - Single-instance support ensures deep links are forwarded to the existing app window
  - OGP link card is automatically fetched when a URL is present
- **Bookmarklet** — A browser bookmarklet to share the current page's title and URL to kazahana with one click. Setup instructions added to the user guide.
  - Drag-and-drop setup to browser bookmarks bar
  - Works with any browser that supports bookmarklets

### Technical Details

- Added `tauri-plugin-deep-link` and `tauri-plugin-single-instance` for URI protocol handling
- Extended `composeStore` with `initialText` field for deep-link text injection
- Deep-link listener in `App.tsx` with URL parsing and compose store integration

---

## Downloads

| File | Description |
|------|-------------|
| `kazahana_1.4.1_x64-setup.exe` | Windows x64 installer (NSIS) |
| `kazahana_1.4.1_x64_en-US.msi` | Windows x64 installer (MSI) |
| `kazahana_1.4.1_aarch64.dmg` | macOS Apple Silicon (DMG) |
| `kazahana_1.4.1_x64.dmg` | macOS Intel (DMG) |

---

> **Note:** These binaries are not code-signed. Your OS may show a security warning during installation.
> See the [install guide](https://osprey74.github.io/kazahana/en/install.html) for instructions on how to proceed.

---

# kazahana v1.4.1

## 新機能

### 追加

- **カスタム URI プロトコル (`kazahana://compose`)** — ディープリンクを使って、ウェブページを kazahana の投稿画面に直接共有できます。コールドスタート（アプリ未起動）・ウォームスタート（アプリ起動中）の両方に対応。
  - 形式: `kazahana://compose?title=...&url=...`
  - シングルインスタンス対応により、ディープリンクは既存のアプリウィンドウに転送されます
  - URL が含まれている場合、OGP リンクカードが自動取得されます
- **ブックマークレット** — ブラウザで閲覧中のページのタイトルと URL をワンクリックで kazahana に共有するブックマークレットを提供。操作マニュアルに設置手順を追加。
  - ブックマークバーへのドラッグ＆ドロップで簡単設置
  - ブックマークレット対応のすべてのブラウザで動作

### 技術詳細

- URI プロトコル処理のため `tauri-plugin-deep-link` と `tauri-plugin-single-instance` を追加
- ディープリンクのテキスト注入用に `composeStore` に `initialText` フィールドを追加
- `App.tsx` に URL パースと compose store 連携を含むディープリンクリスナーを実装

---

## ダウンロード

| File | Description |
|------|-------------|
| `kazahana_1.4.1_x64-setup.exe` | Windows x64 installer (NSIS) |
| `kazahana_1.4.1_x64_en-US.msi` | Windows x64 installer (MSI) |
| `kazahana_1.4.1_aarch64.dmg` | macOS Apple Silicon (DMG) |
| `kazahana_1.4.1_x64.dmg` | macOS Intel (DMG) |

---

> **注意:** これらのバイナリはコード署名されていません。インストール時にセキュリティ警告が表示される場合があります。
> 対処方法は[インストールガイド](https://osprey74.github.io/kazahana/ja/install.html)を参照してください。
