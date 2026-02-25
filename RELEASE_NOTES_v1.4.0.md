# kazahana v1.4.0

## What's New

### Added

- **Keyboard shortcuts**
  - Press "N" key to open the compose dialog from timeline/profile views
  - Press Alt+Enter to submit posts from the compose dialog
- **Auto link card** — Automatically generates a link card preview when pasting text containing a URL
- **User guide** — Added screenshot-based user guide for English and Japanese (accessible from the landing page and install page)
- **Feed reordering** — Reorder feeds with up/down buttons in the feed settings screen. Visible and hidden feeds are grouped separately.

### Improved

- **Profile views** — Added loading spinner and error state for likes tab on other users' profiles
- **Followers/Following pages** — Page titles now show the target user's handle
- **Login form** — Replaced browser autocomplete with custom handle history (stored via Tauri Store) with individual entry deletion support

### Fixed

- **Thread display** — Fixed thread view not correctly showing parent posts. Replaced `$type` string comparison with `isThreadViewPost()` SDK type guard for reliable thread chain traversal
- **AT Protocol reply threading** — Fixed reply records setting `root === parent` instead of preserving the correct thread root reference. Future replies from kazahana now correctly follow AT Protocol spec
- **White screen crash from notifications** — Fixed React Hooks ordering violation that caused a blank screen when navigating to threads from the notification tab
- **Notification navigation** — Fixed clicking a notification showing the wrong post. Reply/mention/quote notifications now navigate to the correct post
- **Thread post navigation** — Parent and reply posts in thread view are now clickable to navigate to their own thread
- **Back button from notifications** — The back button now strictly returns to the notifications tab instead of using browser history
- **DM TypeScript errors** — Resolved `$Typed` wrapper type errors in DMThreadView and other DM components

### Acknowledgements

Thanks to the following users for testing and feedback:
- よつぎnん / @yotsugin.bsky.social — Thread display bug reports and testing
- あやがね / @ayagane.magical-pritt.jp — Feed reordering feature request

---

## Downloads

| File | Description |
|------|-------------|
| `kazahana_1.4.0_x64-setup.exe` | Windows x64 installer (NSIS) |
| `kazahana_1.4.0_x64_en-US.msi` | Windows x64 installer (MSI) |
| `kazahana_1.4.0_aarch64.dmg` | macOS Apple Silicon (DMG) |
| `kazahana_1.4.0_x64.dmg` | macOS Intel (DMG) |

---

> **Note:** These binaries are not code-signed. Your OS may show a security warning during installation.
> See the [install guide](https://osprey74.github.io/kazahana/en/install.html) for instructions on how to proceed.

---

# kazahana v1.4.0

## 新機能

### 追加

- **キーボードショートカット**
  - タイムライン/プロフィール画面で「N」キーを押すと新規投稿画面が開きます
  - 投稿作成画面で Alt+Enter を押すと投稿を実行します
- **リンクカード自動生成** — URL を含むテキストを貼り付けると、リンクカードプレビューが自動生成されます
- **操作マニュアル** — 日本語・英語のスクリーンショット付き操作マニュアルを追加（ランディングページ・インストールページからリンク）
- **フィード並べ替え** — フィード設定画面で上下ボタンによる並べ替えが可能に。表示/非表示フィードはグループ分けして表示

### 改善

- **プロフィール表示** — 他ユーザーの「いいね」タブにローディングスピナーとエラー表示を追加
- **フォロー中/フォロワーページ** — ページタイトルに対象ユーザーのハンドルを表示
- **ログインフォーム** — ブラウザのオートコンプリートを廃止し、Tauri Store によるカスタムハンドル履歴に変更（個別削除対応）

### 修正

- **スレッド表示** — スレッドビューで親投稿が正しく表示されない問題を修正。`$type` 文字列比較を `isThreadViewPost()` SDK型ガードに置き換え、スレッドチェーンの走査を改善
- **AT Protocol リプライスレッディング** — リプライレコードの `root` が `parent` と同一になる問題を修正。今後の kazahana からの返信は AT Protocol 仕様に準拠した正しいスレッドルート参照を持ちます
- **通知タブからの白画面クラッシュ** — React Hooks の順序違反により通知タブからスレッドに遷移すると画面が真っ白になる問題を修正
- **通知タブのナビゲーション** — 通知をクリックすると誤ったポストが表示される問題を修正。返信/メンション/引用通知は正しいポストに遷移するように
- **スレッド内ポスト遷移** — スレッドビュー内の親投稿・返信投稿をクリックして、そのスレッドに遷移可能に
- **通知タブからの「戻る」ボタン** — ブラウザ履歴ではなく、厳密に通知タブに戻るよう変更
- **DM の TypeScript エラー** — DMThreadView 等の `$Typed` ラッパー型エラーを修正

### 謝辞

テストとフィードバックにご協力いただいた方々に感謝します：
- よつぎnん / @yotsugin.bsky.social — スレッド表示バグの報告とテスト
- あやがね / @ayagane.magical-pritt.jp — フィード並べ替え機能のリクエスト

---

## ダウンロード

| File | Description |
|------|-------------|
| `kazahana_1.4.0_x64-setup.exe` | Windows x64 installer (NSIS) |
| `kazahana_1.4.0_x64_en-US.msi` | Windows x64 installer (MSI) |
| `kazahana_1.4.0_aarch64.dmg` | macOS Apple Silicon (DMG) |
| `kazahana_1.4.0_x64.dmg` | macOS Intel (DMG) |

---

> **注意:** これらのバイナリはコード署名されていません。インストール時にセキュリティ警告が表示される場合があります。
> 対処方法は[インストールガイド](https://osprey74.github.io/kazahana/ja/install.html)を参照してください。
