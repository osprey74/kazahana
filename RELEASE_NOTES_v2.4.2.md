# Release Notes — v2.4.2

## EN

### New Features

- **Smart multi-line watermark rendering**
  - Preset text renders as a single line when it fits the image width; automatically wraps at the handle boundary only when the text would overflow
  - Custom text supports newlines — input field changed to textarea for multi-line entry
  - Background box automatically adapts to the number of lines and the longest line width

### Bug Fixes

- **Watermark image compression**: Images are now compressed after watermark compositing to stay within Bluesky's 1MB upload limit

---

## JA

### 新機能

- **ウォーターマークのスマート複数行表示**
  - 定型文は画像幅に収まる場合は1行で表示、はみ出す場合のみハンドル名で自動改行
  - カスタムテキストで改行入力に対応（入力欄を textarea に変更）
  - 背景ボックスが行数と最長行の幅に合わせて自動調整

### バグ修正

- **ウォーターマーク合成後の画像圧縮**: 合成後に Bluesky の 1MB アップロード制限を超える場合、自動的に圧縮するよう修正
