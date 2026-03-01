# Release Notes — kazahana v2.0.0

---

## EN

### ✨ New Features

- **BSAF (Bluesky Structured Alert Feed) compatible client**
  - Register BSAF-compatible bots via URL or local JSON file in Settings
  - Per-bot filter settings with accordion UI — choose which categories, severity levels, and regions to display
  - AND-based filtering — all filter conditions must match for a post to appear
  - Filters apply to Home Timeline and Custom Feeds only — bot profile pages always show all posts unfiltered, so you can check the full history of alerts regardless of your filter settings
  - Duplicate detection — when multiple bots report the same event, duplicates are automatically collapsed
  - Auto-update — bot definitions are checked for updates on each app launch
  - GitHub blob URL auto-conversion for easier bot registration
  - Full i18n support across all 11 languages

### 🐛 Bug Fixes

- Fixed performance issue where BSAF store subscriptions in PostCard caused cascading re-renders and white screen on timeline
- Moved BSAF filtering from per-PostCard to list-level (TimelineView/FeedView) for optimal performance
- Batched BSAF updater store mutations to prevent multiple re-render cascades on startup

### 🔧 Improvements

- Added horizontal divider in Feed Visibility settings for better visual separation

### 📝 Documentation

- Added BSAF section to README (EN/JA)
- Added BSAF guide section to user manual (EN/JA) with detailed explanations of AND filtering, filter scope, and duplicate detection
- Added BSAF capability to landing page (EN/JA)
- Updated internal spec and task management

---

## JA

### ✨ 新機能

- **BSAF（Bluesky Structured Alert Feed）対応クライアント**
  - 設定画面から URL またはローカル JSON ファイルで BSAF 対応 Bot を登録
  - Bot ごとのアコーディオン形式フィルタ設定 — 情報種別・重み付け・地域など、表示する条件を選択可能
  - AND 条件によるフィルタリング — すべてのフィルタ条件を満たした投稿のみ表示
  - フィルタはホームタイムラインとカスタムフィードにのみ適用 — Bot のプロフィール画面ではフィルタに関係なくすべての投稿が表示されるため、設定条件外の情報も Bot のプロフィールから確認できます
  - 重複検出 — 複数の Bot が同一イベントを報告した場合、重複投稿を自動的にまとめて表示
  - 自動更新 — アプリ起動時に Bot 定義の更新を自動チェック
  - GitHub blob URL の自動変換による簡単な Bot 登録
  - 全 11 言語対応

### 🐛 バグ修正

- BSAF ストア購読が PostCard でカスケード再レンダリングを引き起こし、タイムラインが白画面になるパフォーマンス問題を修正
- BSAF フィルタリングを PostCard 単位からリスト単位（TimelineView/FeedView）に移動し、パフォーマンスを最適化
- 起動時の BSAF 更新チェッカーのストア変更をバッチ化し、複数回の再レンダリングカスケードを防止

### 🔧 改善

- フィード表示設定画面に水平線を追加し、視覚的な区切りを改善

### 📝 ドキュメント

- README（EN/JA）に BSAF セクションを追加
- 操作マニュアル（EN/JA）に BSAF ガイドセクションを追加（AND フィルタリング、フィルタ適用範囲、重複検出の詳細説明）
- ランディングページ（EN/JA）に BSAF 機能を追加
- 内部設計仕様書・タスク管理を更新

---

## Acknowledgements / 謝辞

- **あやがね** / [@ayagane.magical-pritt.jp](https://bsky.app/profile/ayagane.magical-pritt.jp) — Feature requests, bug reports, and testing
- **よつぎnん** / [@yotsugin.bsky.social](https://bsky.app/profile/yotsugin.bsky.social) — Bug reports and testing
