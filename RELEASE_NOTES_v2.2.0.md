# Release Notes — v2.2.0

## ✨ New Features

- **Image compression improvements**: Unified compression pipeline across all image input paths (paste, drag & drop, file picker). Large images (e.g., 3.5MB iPhone screenshots) are now automatically compressed before upload. Added a compression progress indicator and error messages.
- **Image editor — Rotate**: Added an edit button on image previews in the compose modal. Supports 90° left/right rotation using the Canvas API. Available in all 11 languages.
- **Image editor — Crop**: Three crop modes: original aspect ratio, square, and free-form. Drag to move or resize the crop area with a rule-of-thirds grid overlay. Available in all 11 languages.

## 🐛 Bug Fixes

- Fixed app becoming unresponsive when attaching large images via drag & drop or file picker (files exceeding 1MB were silently discarded without feedback)
- Fixed rotated large images exceeding Bluesky's upload size limit by applying compression after editing

---

# リリースノート — v2.2.0

## ✨ 新機能

- **画像圧縮ロジック改善**: すべての画像入力経路（ペースト/ドラッグ＆ドロップ/ファイル選択）で圧縮処理を統一。大きな画像（例: 3.5MBのiPhoneスクリーンショット）もアップロード前に自動圧縮されるようになりました。圧縮中インジケータとエラーメッセージを追加。
- **画像編集機能（回転）**: 投稿作成モーダルの画像プレビューに編集ボタンを追加。Canvas APIによる90度単位の左右回転に対応。全11言語対応。
- **画像編集機能（クロップ）**: 元の比率/正方形/自由比率の3モードでクロップ可能。ドラッグ操作で選択領域の移動・リサイズができ、三分割グリッドを表示。全11言語対応。

## 🐛 バグ修正

- ドラッグ＆ドロップやファイル選択で大きな画像を添付するとアプリが無反応になる問題を修正（1MBを超えるファイルがフィードバックなしで無視されていた）
- 回転後の大きな画像がBlueskyのアップロードサイズ制限を超える問題を修正（編集後に圧縮処理を適用）
