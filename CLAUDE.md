# kazahana
> Kazahana is an open source Bluesky client software built with Tauri v2, React, and TypeScript.

## Task Management
- **task_file**: `design/remaining-work.md`
- **done_marker**: `[x]`
- **progress_summary**: true
- **collaborator_source**: `design/remaining-work.md` のタスク記録から協力者情報を参照

## Documentation
- **docs_to_update**:
  - `README.md` (EN)
  - `README.ja.md` (JA)
- **doc_pairs**:
  - `README.md` ↔ `README.ja.md`
  - `docs/en/` ↔ `docs/ja/`
- **official_docs**:
  - `docs/en/` — 英語マニュアル・ガイド
  - `docs/ja/` — 日本語マニュアル・ガイド
  - `docs/en/` を更新する際は `docs/ja/` も同時にアップデートすること
- **other_lang_docs** (マニュアルとインストールガイドのみ提供中):
  - `docs/de/`, `docs/es/`, `docs/fr/`, `docs/id/`, `docs/ko/`, `docs/pt-BR/`, `docs/ru/`, `docs/zh-CN/`, `docs/zh-TW/`
- **internal_docs**:
  - `design/kazahana-spec.md` — 内部設計仕様書（機能追加時に更新）
  - `docs/PLATFORM_MATRIX.md` — 全プラットフォーム機能対応表（機能追加・修正時に更新）

## Versioning
- **version_files**:
  - `package.json`
  - `src-tauri/Cargo.toml`
  - `src-tauri/tauri.conf.json`
- **extra_version_files**:
  - `docs/en/guide/index.html`
  - `docs/ja/guide/index.html`
- **cargo_lockfile**: true

## CI/CD
- **cicd**: true
- **cicd_trigger**: tag push
- **cicd_platform**: GitHub Actions
- **cicd_note**: タグプッシュで自動ビルド＆ Release ドラフト作成

## Cross-Platform Management

> kazahana リポジトリはクロスプラットフォーム管理の**ハブ**です。
> iOS / Android の Claude Code もここを参照します。

- **platform_matrix**: `docs/PLATFORM_MATRIX.md`
  - 全プラットフォームの機能実装状況を管理する唯一の正本
  - 機能追加・修正完了時は **必ずこのファイルを更新**すること
- **issue_hub**: このリポジトリの Issues が全プラットフォームの統合管理ハブ
  - iOS / Android 固有の作業も `platform:ios` / `platform:android` ラベルでここに集約
- **matrix_update_rule**:
  1. 機能実装完了 → 該当セルを `✅` に変更、`Last updated:` 日付を更新
  2. 未実装を発見 → `⬜` に変更し `parity` ラベルの Issue を作成
  3. `❓` を解消 → ソース確認後に `✅` か `⬜` に変更
  4. 変更は `docs/matrix-update-YYYYMMDD` ブランチで PR を出す
- **issue_labels**:
  - `platform:desktop` — Win/macOS 固有
  - `platform:ios`     — iOS 固有
  - `platform:android` — Android 固有
  - `platform:all`     — 全プラットフォーム共通
  - `parity`           — プラットフォーム間差異の是正
  - `matrix:update`    — PLATFORM_MATRIX.md の更新が必要

## SNS
- **sns_accounts**:
  - Bluesky: `@app-kazahana.bsky.social`
