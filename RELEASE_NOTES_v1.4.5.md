# Release Notes — v1.4.5

## Bug Fixes

- **OGP thumbnail compression for bookmarklet posts** — When sharing articles via the bookmarklet, large OGP images (over ~976KB) caused an upload error. Thumbnails are now automatically compressed (resized and quality-adjusted) before uploading to stay within Bluesky's size limit.
- **Compose modal re-opening after bookmarklet post** — After posting via the bookmarklet, navigating to the settings screen would re-open the compose modal with stale deep-link data. Deep-link URLs are now deduplicated to prevent this.
- **Esc key to close compose modal** — The compose modal opened with the `N` key can now be closed by pressing `Esc`.
- **Keybind text in user guide** — Updated the post shortcut description in the user guide to show both Alt+Enter (Windows/Linux) and Option+Enter (macOS).

---

# リリースノート — v1.4.5

## バグ修正

- **ブックマークレット投稿時のOGP画像サイズエラー修正** — ブックマークレットで記事を共有する際、OGP画像が約976KBを超えるとアップロードエラーが発生していた問題を修正。サムネイルを自動的にリサイズ・品質調整してBlueskyのサイズ制限内に収めるようにしました。
- **ブックマークレット投稿後の投稿フォーム再表示修正** — ブックマークレットから投稿後に設定画面を開くと、直前のディープリンクデータで投稿フォームが再表示される問題を修正。ディープリンクURLの重複処理を追加しました。
- **Escキーで投稿フォームを閉じる機能追加** — `N`キーで開いた投稿フォームを`Esc`キーで閉じられるようになりました。
- **操作マニュアルのキーバインド表記修正** — 投稿ショートカットの説明を「Alt+Enter（Windows/Linux）／Option+Enter（macOS）」の両方を記載するよう修正しました。
