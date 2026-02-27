---
name: release-draft
description: バージョンタグを打ちリリースドラフトを作成する。「v1.1.0をリリースします」「リリースしたい」といったリクエストで使用する。
allowed-tools: Read, Write, Edit, Bash(git:*), Bash(gh:*), Bash(cargo:*), Bash(cat:*), Bash(grep:*), Glob
---

# リリース（ドラフト作成）

## 前提
- バージョン更新対象ファイルは **CLAUDE.md の `## Versioning` セクション** を参照すること
- CI/CD 設定の有無も CLAUDE.md で確認する

## 手順

### 1. リリース前チェック
- ドキュメント・コミット漏れがないか確認
  - `git status` で未コミットの変更がないか確認
  - CLAUDE.md の `docs_to_update` に記載されたドキュメントが最新か確認
- 漏れがあれば、ユーザーに報告し対応を提案

### 2. リリースノート作成
- `RELEASE_NOTES_v{version}.md` を作成
- EN（英語）セクションと JA（日本語）セクションの両方を記載
- 前回リリースからの変更内容を `git log` で取得し、カテゴリ分け:
  - ✨ New Features / 新機能
  - 🐛 Bug Fixes / バグ修正
  - 📝 Documentation / ドキュメント
  - 🔧 Maintenance / メンテナンス
- 協力者がいる場合（タスク管理ファイルから参照）:
  - `## Acknowledgements` / `## 謝辞` セクションに名前とハンドルを記載

### 3. バージョン番号更新
- CLAUDE.md の `version_files` に定義された全ファイルのバージョン番号を更新
- 共通の対象:
  - `package.json`
  - `src-tauri/Cargo.toml`
  - `src-tauri/tauri.conf.json`
- プロジェクト固有の追加対象: CLAUDE.md の `extra_version_files` を参照
- `Cargo.lock` は `cargo generate-lockfile` で自動更新

### 4. コミット＆タグ作成
- 全変更をコミット: `chore: bump version to {version}`
- git タグを作成: `git tag v{version}`
- リモートにプッシュ: `git push origin main && git push origin v{version}`

### 5. CI/CD 連携確認
- CLAUDE.md で `cicd: true` の場合:
  - タグプッシュにより GitHub Actions が自動でビルド＆ Release ドラフトを作成
  - 「GitHub Actions のビルド完了を待ってから、ドラフトの確認をお願いします」とユーザーに案内
- CLAUDE.md で `cicd: false` の場合:
  - `gh release create v{version} --draft --title "v{version}"` で手動ドラフト作成
  - 作成されたドラフトの URL をユーザーに提示
