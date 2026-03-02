# kazahana BSAF Demo

**BSAF（Bluesky Structured Alert Framework）** のクライアント側パース機能を体験できるインタラクティブデモです。

## 動作概要

- **タイムライン画面**: BSAF対応Botの投稿と通常ユーザーの投稿が混在するタイムラインを表示
- **BSAF設定画面**: Bot Definition JSONから自動生成されたフィルタUIでパース設定を変更
- **パース ON/OFF**: BSAFパースの有効/無効を切り替えると、Bot投稿の表示が変化
- **重複折りたたみ**: 同一イベントを複数Botが報告した場合、自動的に折りたたみ表示

## デモで確認できるBSAFの機能

1. **タグパース**: `bsaf:v1`, `type:`, `value:`, `time:`, `target:`, `source:` の6必須タグ解析
2. **動的フィルタUI**: Bot Definition JSONの `filters` 配列からUI自動生成
3. **重複検知**: `type` + `value` + `time` + `target` の一致による同一イベント判定
4. **重み付けフィルタ**: `value:` タグによる情報の重み付け（震度、警報レベル等）

## ローカル開発

```bash
cd demo
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## GitHub Pages デプロイ

kazahanaリポジトリの `main` ブランチに `demo/` ディレクトリの変更をpushすると、GitHub Actionsが自動的にビルド & デプロイします。

### 初回セットアップ

1. GitHubリポジトリの **Settings > Pages** を開く
2. **Source** を **GitHub Actions** に変更
3. `.github/workflows/deploy-demo.yml` を kazahana リポジトリルートの `.github/workflows/` にコピー

### 手動デプロイ

Actions タブから **Deploy BSAF Demo to GitHub Pages** ワークフローを手動実行も可能です。

## 技術スタック

- Vite + React + TypeScript
- 静的SPA（サーバーサイド処理なし）
- モックデータによる動作（実APIへの接続なし）

## ファイル構成

```
demo/
├── src/
│   ├── App.tsx              # メインレイアウト
│   ├── components/
│   │   ├── PostCard.tsx     # 投稿カード（Raw/Parsed両対応）
│   │   └── SettingsPanel.tsx # BSAF設定パネル
│   ├── data/
│   │   ├── botDefinition.ts # Bot Definition JSON（JMA Bot）
│   │   └── mockPosts.ts     # モック投稿データ
│   ├── hooks/
│   │   └── useBsafFilter.ts # フィルタリング状態管理
│   ├── types/
│   │   └── bsaf.ts          # BSAF型定義
│   └── utils/
│       └── bsafParser.ts    # タグパーサー & フィルタロジック
├── .github/workflows/
│   └── deploy-demo.yml      # GitHub Pages デプロイ
├── index.html
├── vite.config.ts
└── package.json
```
