---
name: commit-push
description: 変更内容のコミットとプッシュ。「コミット＆プッシュしてください」「コミットしてプッシュして」といったリクエストで使用する。
allowed-tools: Read, Write, Edit, Bash(git:*), Glob
---

# コミット＆プッシュ

## 前提
- 更新すべきドキュメント一覧は **CLAUDE.md の `## Documentation` セクション** を参照すること
- ドキュメントの言語ペア（EN/JA 等）が定義されている場合、片方を更新したらもう片方も同時に更新する

## 手順

### 1. 関連ドキュメントの更新確認
- `git diff --name-only` で変更ファイルを確認
- 変更内容に応じて、CLAUDE.md で定義された関連ドキュメントを更新する必要があるか判断
  - README.md / README.ja.md 等のプロジェクト概要ドキュメント
  - その他 CLAUDE.md の `docs_to_update` に定義されたファイル
- 更新が必要な場合、変更内容を反映してドキュメントを更新

### 2. 変更内容の確認
- `git status` で全体の変更状況を確認
- `git diff --stat` で変更の概要をユーザーに提示
- 意図しない変更がないか確認を促す

### 3. ステージング
- `git add .` で全変更をステージング
- 必要に応じて特定ファイルのみステージングも可

### 4. コミット
- 変更内容から適切なコミットメッセージを生成
- Conventional Commits 形式を使用:
  - `feat:` 新機能
  - `fix:` バグ修正
  - `docs:` ドキュメント更新
  - `chore:` メンテナンス・設定変更
  - `refactor:` リファクタリング
  - `style:` コードスタイル変更
  - `ci:` CI/CD 関連
- ユーザーの確認を得てから `git commit` を実行

### 5. プッシュ
- `git push origin <current-branch>` でリモートにプッシュ
- プッシュ結果をユーザーに報告
