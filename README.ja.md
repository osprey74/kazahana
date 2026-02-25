[English](README.md)

# 🌸 kazahana

**軽量な Bluesky デスクトップクライアント**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=github)](https://github.com/sponsors/osprey74)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-ff5e5b?logo=ko-fi)](https://ko-fi.com/osprey74)

---

## 概要

kazahana は、[Bluesky](https://bsky.app/) 向けの軽量デスクトップクライアントです。
Tauri v2 を採用し、OS標準の WebView を利用することで、低メモリで快適に動作します。

## 設計思想

kazahana は全機能を網羅するスタンドアロンアプリではなく、**軽快に常駐して日常利用する閲覧・投稿特化クライアント**です。

- **日常操作は kazahana で** — タイムライン閲覧、投稿、通知確認、検索、DM など、頻繁に使う機能を快適なデスクトップ体験で提供します。
- **設定・管理は Bluesky ウェブ版で** — アカウント管理、ブロック/ミュート一覧管理、リスト作成、フィードジェネレーター設定などの管理系操作は [bsky.app](https://bsky.app/) で行う前提です。ウェブ版で行った設定は AT Protocol のサーバーサイド同期を通じて kazahana に自動的に反映されます。

## 特徴

- 🪶 **軽量** — Chromium を内蔵しない Tauri v2 で、メモリ使用量を大幅に削減
- 🖥️ **クロスプラットフォーム** — Windows / macOS 対応
- ⚡ **高速** — ネイティブアプリならではの起動速度とレスポンス
- 🔓 **オープンソース** — MIT ライセンスで自由に利用可能

### 実装済み機能

- [x] タイムライン（自動更新、間隔設定可能）
- [x] 既読位置マーカー
- [x] 投稿 / 返信
- [x] いいね / リポスト
- [x] 画像添付（最大4枚、ALTテキスト対応）
- [x] 画像ライトボックス（キーボード操作対応）
- [x] リンクカード（OGPプレビュー）
- [x] スレッド表示
- [x] 通知（いいね、リポスト、フォロー、メンション、返信、引用）
- [x] ユーザープロフィール / フォロー / フォロー解除 / いいね・メディアタブ
- [x] 検索（投稿 & ユーザー）
- [x] ダーク / ライト / システムテーマ
- [x] 多言語対応（日本語 / English）
- [x] コンテンツモデレーション（ラベル判定、ブラー、設定UI）
- [x] カスタムフィード・リストフィード（タブ切り替え）
- [x] スレッドゲート・ポストゲート（返信/引用制限）
- [x] 動画添付（アップロード、HLS再生、音量設定）
- [x] デスクトップ通知（種別表示対応: いいね/リポスト/返信/メンション/フォロー/引用）
- [x] OS起動時の自動起動（オプション）
- [x] ブックマーク
- [x] 引用投稿
- [x] ダイレクトメッセージ
- [x] ブックマークレット & カスタム URI プロトコル（`kazahana://compose`）でブラウザからワンクリック共有

## 技術スタック

| 技術 | 用途 |
|------|------|
| [Tauri v2](https://v2.tauri.app/) | デスクトップアプリフレームワーク |
| [React](https://react.dev/) | UI フレームワーク |
| [TypeScript](https://www.typescriptlang.org/) | 型安全な開発 |
| [Vite](https://vite.dev/) | ビルドツール |
| [TailwindCSS](https://tailwindcss.com/) | スタイリング |
| [@atproto/api](https://www.npmjs.com/package/@atproto/api) | Bluesky 公式 SDK |

## 開発

### 前提条件

- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/) (LTS)
- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Windows)

詳細は [Tauri v2 Prerequisites](https://v2.tauri.app/start/prerequisites/) を参照してください。

### セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/osprey74/kazahana.git
cd kazahana

# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run tauri dev
```

### ビルド

```bash
# プロダクションビルド
npm run tauri build
```

## ライセンス

[MIT License](LICENSE)

## Support / 開発を応援する

kazahana を気に入っていただけたら、開発の継続を応援してください ☕

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=github)](https://github.com/sponsors/osprey74)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-ff5e5b?logo=ko-fi)](https://ko-fi.com/osprey74)
