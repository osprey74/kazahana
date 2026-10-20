# kazahana v3.6.2

## English

### 🐛 Bug Fixes

#### Windows high contrast mode support

With Windows high contrast mode turned on, kazahana was practically unusable: buttons lost their shape and appeared as plain text, and there was no way to tell which option was selected (theme, refresh interval, tabs, and so on). In high contrast mode Windows replaces the app's colors with system colors, and kazahana relied on background colors alone for these cues.

kazahana now adapts to high contrast mode:

- Buttons are drawn with an outline in the system button color.
- Selected options and the current tab (bottom navigation, feeds, profile, search) are highlighted with the system highlight color.
- Watermark text color swatches keep their real colors, and the selected one is marked with a highlight ring.

Selected states are now also exposed to screen readers. The normal light and dark themes are unchanged.

### 🔧 Notes on cross-platform parity

This fix is Desktop (Windows) only. Support status on other platforms is tracked in `docs/PLATFORM_MATRIX.md`.

---

## 日本語

### 🐛 バグ修正

#### Windows のハイコントラストモードに対応

Windows のハイコントラストモードを有効にすると、ボタンの形が消えて文字だけになり、どの項目が選択されているか（テーマ、取得タイミング、タブなど）も区別できず、kazahana をほぼ操作できない状態でした。ハイコントラストモードではアプリの配色がシステムの配色に置き換えられますが、kazahana はこれらの表示を背景色だけで表していたことが原因です。

ハイコントラストモードで次のように表示するようにしました。

- ボタンにシステムのボタン色で枠線を表示します。
- 選択中の項目と現在のタブ（下部ナビ、フィード、プロフィール、検索）を、システムの強調色で表示します。
- ウォーターマークの文字色の色見本は本来の色で表示し、選択中の色は強調色の輪で示します。

あわせて、選択状態がスクリーンリーダーにも伝わるようになりました。通常のライト・ダークテーマの表示は変わりません。

### 🔧 マルチプラットフォーム対応について

本修正は Desktop（Windows）のみが対象です。他のプラットフォームの対応状況は `docs/PLATFORM_MATRIX.md` で管理しています。
