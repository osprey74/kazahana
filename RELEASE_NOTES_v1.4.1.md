# kazahana v1.4.1

## What's New (since v1.3.1)

### Added

- **Custom URI protocol (`kazahana://compose`)** — Share web pages directly to kazahana's compose screen via deep links. Works with both cold start (app not running) and warm start (app already running).
  - Format: `kazahana://compose?title=...&url=...`
  - Single-instance support ensures deep links are forwarded to the existing app window
  - OGP link card is automatically fetched when a URL is present
- **Bookmarklet** — A browser bookmarklet to share the current page's title and URL to kazahana with one click. Setup instructions added to the user guide.
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

- **Intermittent login failure** — Fixed a bug where the login could fail intermittently after a session restore failure. The AtpAgent now correctly resets its internal state, preventing stale session data from interfering with new login attempts.
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
| `kazahana_1.4.1_x64-setup.exe` | Windows x64 installer (NSIS) |
| `kazahana_1.4.1_x64_en-US.msi` | Windows x64 installer (MSI) |
| `kazahana_1.4.1_aarch64.dmg` | macOS Apple Silicon (DMG) |
| `kazahana_1.4.1_x64.dmg` | macOS Intel (DMG) |

---

> **Note:** These binaries are not code-signed. Your OS may show a security warning during installation.
> See the [install guide](https://osprey74.github.io/kazahana/en/install.html) for instructions on how to proceed.

---

# kazahana v1.4.1

## 新機能（v1.3.1 からの変更点）

### 追加

- **カスタム URI プロトコル (`kazahana://compose`)** — ディープリンクを使って、ウェブページを kazahana の投稿画面に直接共有できます。コールドスタート（アプリ未起動）・ウォームスタート（アプリ起動中）の両方に対応。
  - 形式: `kazahana://compose?title=...&url=...`
  - シングルインスタンス対応により、ディープリンクは既存のアプリウィンドウに転送されます
  - URL が含まれている場合、OGP リンクカードが自動取得されます
- **ブックマークレット** — ブラウザで閲覧中のページのタイトルと URL をワンクリックで kazahana に共有するブックマークレットを提供。操作マニュアルに設置手順を追加。
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

- **ログインが不安定になる問題** — セッション復元失敗後にログインが断続的に失敗する不具合を修正。AtpAgent の内部状態を正しくリセットし、古いセッションデータが新しいログイン試行に干渉するのを防止。
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
| `kazahana_1.4.1_x64-setup.exe` | Windows x64 installer (NSIS) |
| `kazahana_1.4.1_x64_en-US.msi` | Windows x64 installer (MSI) |
| `kazahana_1.4.1_aarch64.dmg` | macOS Apple Silicon (DMG) |
| `kazahana_1.4.1_x64.dmg` | macOS Intel (DMG) |

---

> **注意:** これらのバイナリはコード署名されていません。インストール時にセキュリティ警告が表示される場合があります。
> 対処方法は[インストールガイド](https://osprey74.github.io/kazahana/ja/install.html)を参照してください。
