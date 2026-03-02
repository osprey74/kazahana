# Release Notes — v2.1.0

## English

### ✨ New Features

- **BSAF severity-colored border** — BSAF-compliant bot posts now display a colored left border based on severity level (e.g., red for strong earthquakes, pink for critical alerts, yellow for warnings, green for minor events)
- **BSAF tag display** — Structured BSAF tags (bsaf:v1, type, value, time, target, source) are shown below the post body with a divider line, making alert metadata visible at a glance
- **BSAF demo site** — Interactive demo showcasing BSAF protocol features, available at [osprey74.github.io/kazahana/ja/demo/](https://osprey74.github.io/kazahana/ja/demo/)

> All BSAF visual styling is only active when the "Enable BSAF-compatible client features" setting is turned on. When disabled, posts appear identically to standard posts.

### 📝 Documentation

- Updated README (EN/JA) with new BSAF visual features
- Updated internal design spec (Phase 5) with severity border and tag display items
- Deployed BSAF demo site to GitHub Pages (`docs/ja/demo/`)

---

## 日本語

### ✨ 新機能

- **BSAF 深刻度カラーボーダー** — BSAF準拠Botの投稿に、深刻度レベルに応じた色の左ボーダーを表示（例：強い地震は赤、重大警報はピンク、警報は黄色、軽微な情報は緑）
- **BSAF タグ表示** — 構造化BSAFタグ（bsaf:v1, type, value, time, target, source）を投稿本文の下に区切り線とともに表示し、アラートのメタデータを一目で確認可能に
- **BSAF デモサイト** — BSAFプロトコルの機能を紹介するインタラクティブデモを公開: [osprey74.github.io/kazahana/ja/demo/](https://osprey74.github.io/kazahana/ja/demo/)

> すべてのBSAF視覚スタイリングは、設定画面の「kazahana の BSAF 対応機能を有効化する」がオンの場合のみ有効です。オフの場合、投稿は通常のポストと同じ表示になります。

### 📝 ドキュメント

- README（EN/JA）にBSAF視覚機能の記載を追加
- 内部設計仕様書（Phase 5）に深刻度ボーダー・タグ表示の項目を追加
- BSAFデモサイトを GitHub Pages にデプロイ（`docs/ja/demo/`）
