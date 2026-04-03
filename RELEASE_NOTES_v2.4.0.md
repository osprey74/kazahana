# Release Notes — v2.4.0

## EN

### New Features

- **Multi-account support** — Save multiple Bluesky accounts and switch between them with one click
  - Account picker screen on startup (when 2+ accounts are saved)
  - Add, switch, and remove accounts from Settings
  - Header handle display with quick-switch dropdown (click to switch)
  - Per-account feed settings and search history (isolated by DID)
  - Automatic migration from single-session format
  - Password visibility toggle on login form
  - Server-side session deletion on account removal (best-effort)
  - i18n support for all 11 languages

### Bug Fixes

- Fix race condition where newly added account would not appear in settings until page reload

---

## JA

### 新機能

- **マルチアカウント対応** — 複数の Bluesky アカウントを保存し、ワンクリックで切り替え
  - 起動時のアカウント選択画面（2件以上保存時）
  - 設定画面からのアカウント追加・切替・削除
  - ヘッダーのハンドル表示をクリックでアカウント切替ドロップダウン
  - アカウントごとのフィード設定・検索履歴（DIDで分離）
  - 旧シングルセッション形式からの自動マイグレーション
  - ログイン画面のパスワード表示切替ボタン
  - アカウント削除時のサーバー側セッション削除（ベストエフォート）
  - 全11言語の多言語対応

### バグ修正

- 新規追加したアカウントが再読み込みするまで設定画面に表示されない問題を修正
