# Release Notes — v2.6.0

## EN

### New Features

- **Long-form post service handoff** — Settings now includes a "Long-form Post Service URL" field. When you set the URL of a [standard.site](https://standard.site)-compatible service (Leaflet, Pockets, Offprint, etc. — any page you want to open), a "Write long-form" button appears next to the draft icon in the composer. Tapping it opens that page in your default browser. The composer body is preserved, so you can keep your draft while jumping to the external service.

### Maintenance

- New `longFormServiceUrl` setting in `settingsStore` with localStorage persistence (`kazahana-long-form-service-url`) and `https://`-only validation.
- Composer button uses `@tauri-apps/plugin-opener` (already installed) to launch the URL in the OS default browser.
- 5 i18n keys (`compose.longForm`, `settings.longFormServiceUrl{,Placeholder,Hint,Error}`) added across all 11 supported locales.

---

## JA

### 新機能

- **長文投稿サービス連携** — 設定画面に「長文投稿サービスの URL」欄を追加しました。[standard.site](https://standard.site) 対応サービス（Leaflet、Pockets、Offprint など、開きたい任意のページ）の URL を設定すると、コンポーザのドラフトアイコン横に「長文を書く」ボタンが表示されます。押下すると OS 既定ブラウザでそのページを開きます。コンポーザに入力中の本文はそのまま保持されるので、外部サービスへ遷移してもドラフトは失われません。

### メンテナンス

- `settingsStore` に `longFormServiceUrl` フィールドを追加（localStorage キー `kazahana-long-form-service-url`、`https://` 始まりのみ許可）。
- コンポーザのボタン押下は `@tauri-apps/plugin-opener`（既存）経由で OS 既定ブラウザを呼び出します。
- 新規 i18n キー 5 個（`compose.longForm` と `settings.longFormServiceUrl{,Placeholder,Hint,Error}`）を 11 言語すべてに追加しました。
