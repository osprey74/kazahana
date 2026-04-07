# Release Notes — v2.4.2

## EN

### New Features

- **Smart multi-line watermark rendering**
  - Preset text renders as a single line when it fits the image width; automatically wraps at the handle boundary only when the text would overflow
  - Custom text supports newlines — input field changed to textarea for multi-line entry
  - Background box automatically adapts to the number of lines and the longest line width
- **Watermark settings live preview**
  - Real-time preview canvas in settings page showing watermark on a sample image
  - All settings (preset, position, opacity, font size, text color) update the preview instantly
- **Text color picker**
  - W3C 16 basic color palette with visual swatches
  - Hex color code direct input field
- **Draft image quality warning**
  - Confirmation dialog when saving drafts with images, warning about significant quality loss
  - Option to disable this warning in settings

### Bug Fixes

- **Watermark image compression**: Images are now compressed after watermark compositing to stay within Bluesky's 1MB upload limit

---

## JA

### 新機能

- **ウォーターマークのスマート複数行表示**
  - 定型文は画像幅に収まる場合は1行で表示、はみ出す場合のみハンドル名で自動改行
  - カスタムテキストで改行入力に対応（入力欄を textarea に変更）
  - 背景ボックスが行数と最長行の幅に合わせて自動調整
- **ウォーターマーク設定のリアルタイムプレビュー**
  - 設定画面でサンプル画像にウォーターマークを合成したプレビューを表示
  - プリセット・位置・不透明度・文字サイズ・文字色の変更が即座に反映
- **文字色設定**
  - W3C 基本16色のカラーパレット
  - HEX カラーコードの直接入力
- **下書き保存時の画像品質警告**
  - 画像を含むポストの下書き保存時に品質低下の確認ダイアログを表示
  - 設定画面で警告の表示/非表示を切り替え可能

### バグ修正

- **ウォーターマーク合成後の画像圧縮**: 合成後に Bluesky の 1MB アップロード制限を超える場合、自動的に圧縮するよう修正
