# kazahana v1.3.1

## What's New

### Added

- **Keyboard shortcuts**
  - Press "N" key to open the compose dialog from timeline/profile views
  - Press Alt+Enter to submit posts from the compose dialog
- **Auto link card** — Automatically generates a link card preview when pasting text containing a URL
- **User guide** — Added screenshot-based user guide for English and Japanese (accessible from the landing page and install page)

### Improved

- **Profile views** — Added loading spinner and error state for likes tab on other users' profiles
- **Followers/Following pages** — Page titles now show the target user's handle
- **Login form** — Replaced browser autocomplete with custom handle history (stored via Tauri Store) with individual entry deletion support

### Fixed

- **DM TypeScript errors** — Resolved `$Typed` wrapper type errors in DMThreadView and other DM components

---

## Downloads

| File | Description |
|------|-------------|
| `kazahana_1.3.1_x64-setup.exe` | Windows x64 installer (NSIS) |
| `kazahana_1.3.1_x64_en-US.msi` | Windows x64 installer (MSI) |
| `kazahana_1.3.1_aarch64.dmg` | macOS Apple Silicon (DMG) |
| `kazahana_1.3.1_x64.dmg` | macOS Intel (DMG) |

---

> **Note:** These binaries are not code-signed. Your OS may show a security warning during installation.
> See the [install guide](https://osprey74.github.io/kazahana/en/install.html) for instructions on how to proceed.

---

# kazahana v1.3.1

## 新機能

### 追加

- **キーボードショートカット**
  - タイムライン/プロフィール画面で「N」キーを押すと新規投稿画面が開きます
  - 投稿作成画面で Alt+Enter を押すと投稿を実行します
- **リンクカード自動生成** — URL を含むテキストを貼り付けると、リンクカードプレビューが自動生成されます
- **操作マニュアル** — 日本語・英語のスクリーンショット付き操作マニュアルを追加（ランディングページ・インストールページからリンク）

### 改善

- **プロフィール表示** — 他ユーザーの「いいね」タブにローディングスピナーとエラー表示を追加
- **フォロー中/フォロワーページ** — ページタイトルに対象ユーザーのハンドルを表示
- **ログインフォーム** — ブラウザのオートコンプリートを廃止し、Tauri Store によるカスタムハンドル履歴に変更（個別削除対応）

### 修正

- **DM の TypeScript エラー** — DMThreadView 等の `$Typed` ラッパー型エラーを修正

---

## ダウンロード

| File | Description |
|------|-------------|
| `kazahana_1.3.1_x64-setup.exe` | Windows x64 installer (NSIS) |
| `kazahana_1.3.1_x64_en-US.msi` | Windows x64 installer (MSI) |
| `kazahana_1.3.1_aarch64.dmg` | macOS Apple Silicon (DMG) |
| `kazahana_1.3.1_x64.dmg` | macOS Intel (DMG) |

---

> **注意:** これらのバイナリはコード署名されていません。インストール時にセキュリティ警告が表示される場合があります。
> 対処方法は[インストールガイド](https://osprey74.github.io/kazahana/ja/install.html)を参照してください。
