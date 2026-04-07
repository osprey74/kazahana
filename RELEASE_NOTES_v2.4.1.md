# Release Notes — v2.4.1

## EN

### New Features

- **Image Watermark**: Automatically overlay copyright or AI training opt-out text on images before posting
  - 6 text presets: No Repost, AI/Repost Ban (JP), No AI Training, AI + No Repost, Photo/Edit, Custom (up to 50 characters)
  - Configurable position (6 directions), opacity (20–100%), and font size (8–20px)
  - Pre-post confirmation modal with watermarked image preview
  - "Post without WM" button available in both the compose header and confirmation modal
  - Settings persisted locally via tauri-plugin-store

### Bug Fixes

- **Platform Matrix**: Updated Android multi-account status to implemented

---

## JA

### 新機能

- **画像ウォーターマーク**: 投稿前に著作権表示やAI学習拒否文言を画像に自動合成
  - 6種のプリセット文言: 無断転載禁止 / AI学習・転載禁止 / No AI Training / AI+無断転載禁止 / 撮影・編集 / カスタム入力（最大50文字）
  - 表示位置（6方向）、不透明度（20〜100%）、文字サイズ（8〜20px）を設定可能
  - 投稿前確認モーダルでウォーターマーク合成結果をプレビュー
  - 投稿画面ヘッダーと確認モーダルの両方に「WMなしで投稿」ボタンを配置
  - 設定は tauri-plugin-store でローカルに永続化

### バグ修正

- **プラットフォーム対応表**: Android マルチアカウントのステータスを実装済みに更新
