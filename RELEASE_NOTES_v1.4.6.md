# Release Notes — v1.4.6

## Bug Fixes

- **Fixed compose modal re-opening after bookmarklet post** — After posting via the bookmarklet, navigating to settings would re-open the compose modal with stale deep-link data. The root cause was the settings link using a plain `<a href>` tag instead of React Router's `<Link>`, causing a full page reload that reset the deep-link deduplication state. The settings link now uses client-side navigation, and the deep-link dedup state is persisted in `sessionStorage` for additional resilience.

---

# リリースノート — v1.4.6

## バグ修正

- **ブックマークレット投稿後の投稿フォーム再表示を修正** — ブックマークレットから投稿後に設定画面を開くと、投稿フォームが再表示される問題を修正しました。原因は設定リンクが通常の `<a href>` タグを使用しておりページ全体がリロードされ、ディープリンクの重複防止状態がリセットされていたことでした。設定リンクをReact Routerのクライアントサイドナビゲーションに変更し、さらにディープリンクの重複防止状態を `sessionStorage` に永続化しました。
