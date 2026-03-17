# Release Notes — v2.2.1

## ✨ New Features

- **AI-generated ALT text for images** — Register a Claude API key in Settings to auto-generate descriptive ALT text for image attachments using Claude Haiku 4.5. The generate button appears in the new ALT text dialog when composing posts. Language-aware: generates text in the app's current language.
- **ALT text editing dialog** — Replaced the inline ALT text input with a dedicated dialog. Click the "Add ALT text" button below each image thumbnail to open a dialog with image preview, text area, and AI generate button.
- **Claude API key management** — New section in Settings to register and delete your Claude API key with masked display and visibility toggle.

## 🐛 Bug Fixes

- **Image save format detection** — Fixed an issue where all images were saved as `.jpg` regardless of actual format. Now uses magic byte detection to correctly identify WebP, PNG, GIF, and JPEG formats.
- **Image save not working** — Added missing `fs:allow-write-file` permission so that images can be saved to disk via the context menu.
- **Claude API CORS header** — Added `anthropic-dangerous-direct-browser-access` header required for API calls from Tauri WebView context.

---

# リリースノート — v2.2.1

## ✨ 新機能

- **画像の ALT テキスト AI 自動生成** — 設定画面で Claude API キーを登録すると、投稿時に画像の ALT テキストを Claude Haiku 4.5 で自動生成できます。アプリの表示言語に合わせた ALT テキストを生成します。
- **ALT テキスト編集ダイアログ** — インライン入力欄を専用ダイアログに変更しました。画像サムネイル下の「ALTテキストを追加」ボタンをクリックすると、画像プレビュー・テキスト入力エリア・AI 生成ボタンを備えたダイアログが開きます。
- **Claude API キー管理** — 設定画面に Claude API セクションを追加。API キーの登録・削除・マスク表示・表示切替に対応しています。

## 🐛 バグ修正

- **画像保存時のフォーマット検出** — 右クリックメニューから画像を保存する際、実際のフォーマットに関わらず常に `.jpg` として保存される問題を修正しました。マジックバイト判定により WebP / PNG / GIF / JPEG を正しく識別します。
- **画像保存の失敗** — コンテキストメニューからの画像保存に必要な `fs:allow-write-file` 権限が不足していた問題を修正しました。
- **Claude API の CORS エラー** — Tauri WebView からの API 呼び出しに必要な `anthropic-dangerous-direct-browser-access` ヘッダーを追加しました。
