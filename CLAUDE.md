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

## SNS

- **sns_accounts**:
  - Bluesky: `@app-kazahana.bsky.social`
