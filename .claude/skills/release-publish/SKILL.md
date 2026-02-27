---
name: release-publish
description: ドラフトリリースにリリースノートを添付し公開する。「ドラフト版の完成を確認しました」「リリースを公開して」といったリクエストで使用する。
allowed-tools: Read, Write, Edit, Bash(git:*), Bash(gh:*), Bash(cat:*), Glob
---

# リリース公開

## 前提
- リリースノートの形式と SNS 告知の要否は **CLAUDE.md** を参照すること

## 手順

### 1. ドラフトリリースの確認
- `gh release list --limit 5` で最新のドラフトリリースを特定
- ドラフトのバージョンとアセット（ビルド成果物）を確認
- ユーザーに確認内容を報告

### 2. GitHub Release 用リリースノート生成
- `RELEASE_NOTES_v{version}.md` の内容をベースに GitHub Release ページ用のリリースノートを生成
- 英語セクションと日本語セクションの両方を含める
- フォーマット:
  ```
  ## What's New / 新機能・変更点

  ### English
  (英語のリリースノート)

  ---

  ### 日本語
  (日本語のリリースノート)
  ```

### 3. ドラフトを本番公開
- ユーザーから公開要請を確認
- `gh release edit v{version} --notes-file <release-notes> --draft=false` でリリースノートを添付しつつ公開
- 公開完了を報告し、リリースページの URL を提示

### 4. SNS 告知メッセージ作成（毎回必須）
- リリース公開後、SNS 告知メッセージを日本語・英語の両方で作成
- フォーマット例（日本語）:
  ```
  📢 {project_name} v{version} をリリースしました！

  主な変更点:
  - (変更点1)
  - (変更点2)

  ダウンロード: {release_url}
  ```
- フォーマット例（英語）:
  ```
  📢 {project_name} v{version} is now available!

  Highlights:
  - (change 1)
  - (change 2)

  Download: {release_url}
  ```
- CLAUDE.md に `sns_accounts` が定義されている場合、メンション用ハンドルを含める
- ユーザーに両言語のメッセージを提示
