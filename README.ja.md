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
- [x] 通知（いいね、リポスト、フォロー、メンション、返信、引用、リポストへのいいね、リポストのリポスト）
- [x] ユーザープロフィール / フォロー / フォロー解除 / いいね・メディアタブ / ピン留め投稿
- [x] 検索（投稿 & ユーザー）
- [x] ダーク / ライト / システムテーマ
- [x] 多言語対応（日本語 / English）
- [x] コンテンツモデレーション（ラベル判定、ブラー、設定UI）
- [x] カスタムフィード・リストフィード（タブ切り替え）
- [x] スレッドゲート・ポストゲート（返信/引用制限）
- [x] 動画添付（アップロード、HLS再生、音量設定）
- [x] デスクトップ通知（種別表示対応: いいね/リポスト/返信/メンション/フォロー/引用/リポストへのいいね/リポストのリポスト）
- [x] OS起動時の自動起動（オプション）
- [x] ブックマーク
- [x] 引用投稿
- [x] ダイレクトメッセージ
- [x] ブックマークレット & カスタム URI プロトコル（`kazahana://compose`）でブラウザからワンクリック共有
- [x] ウィンドウサイズ・位置の保存と復元（終了時に保存、起動時に復元）
- [x] タスクトレイ操作（左クリックで復元、右クリックメニュー: Open Window / Minimize / Exit）
- [x] 閉じるボタン動作設定（アプリ終了 or タスクトレイに最小化）
- [x] 投稿フォームへの画像ドラッグ＆ドロップ（大きい画像の自動圧縮付き）
- [x] クリップボード画像ペースト（スクリーンショットのJPEG圧縮対応）
- [x] 投稿メニューの翻訳ボタン（Google翻訳連携）
- [x] 通知欄のアクションボタン（通知から直接返信・リポスト・いいね）
- [x] 通知アイコンの色分け（いいね赤、リポスト緑）
- [x] フィード/リストへのクイックジャンプメニュー
- [x] 画像表示方法の設定（アプリ内ライトボックス or ブラウザで表示）
- [x] フィードタブのスティッキーヘッダー
- [x] プロフィール画面からの投稿時にメンション自動挿入（Nキー/FABボタン）
- [x] 非ピン留めフィードの表示 & フィード表示設定（クイックジャンプに全表示/表示中のみ切替）
- [x] リポスト経由の通知で元ポスト表示（リポストへのいいね通知に元投稿を表示）
- [x] プロフィール投稿検索（特定ユーザーの投稿を検索）
- [x] フィード/リストのドラッグ&ドロップ並べ替え
- [x] チャットメッセージリアクション（絵文字スタンプ、クイックピッカー付き）
- [x] BSAF（Bluesky Structured Alert Feed）対応クライアント

### BSAF 対応について

kazahana は [BSAF プロトコル](https://github.com/osprey74/bsaf-protocol)に対応しており、気象警報Botなどの構造化アラート投稿をフィルタリングできます。

- **BSAF対応Botの登録** — URL またはローカルJSONファイルで設定画面から登録
- **Botごとのフィルタ設定** — 情報種別・重み付け・地域など、表示する条件を選択可能
- **AND条件によるフィルタリング** — すべてのフィルタ条件を満たした投稿のみ表示されます（例：種別「地震」＋地域「北海道」を設定した場合、北海道の地震情報のみ表示）
- **フィルタはホームタイムラインとカスタムフィードにのみ適用** — Botのプロフィール画面ではフィルタに関係なくすべての投稿が表示されるため、設定条件外の情報もBotのプロフィールから確認できます
- **重複検出** — 複数のBotが同一イベントを報告した場合、重複投稿を自動的にまとめて表示
- **自動更新** — アプリ起動時にBot定義の更新を自動チェック

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
