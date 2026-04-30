# Release Notes — v2.5.1

## EN

### New Features

- **Timeline scroll position restoration** — When you tap a post to view its detail and then go back, the timeline now lands on the post you were looking at instead of jumping to the newest post. The position is saved per browser history entry, so forward/back navigation across multiple posts each restores its own context (works for both the home timeline and custom feeds).
- **Post viewing history** — Settings now includes a "View history" page that lists post details you've opened, most-recent-first, up to 200 entries per account. Each entry can be removed individually, and a "Clear all" button wipes the whole list. Posts that have been deleted or blocked render as a dimmed placeholder so you can still identify and prune the entry. History is stored locally per account (not synced) and switches automatically when you change accounts.

### Maintenance

- New `useScrollRestoration` hook + `scrollRestoration` library backing the timeline behavior, reusable from any Virtuoso-based list.
- New `viewHistoryStore` (Zustand + localStorage), wired into `authStore` on login / account switch / session restore, mirroring the existing `searchHistoryStore` conventions.
- Translation keys for the new settings page were added across all 11 supported locales.

---

## JA

### 新機能

- **タイムラインのスクロール位置復元** — ポストをタップして詳細画面を開き、戻ったときに直前に見ていたポストの位置にタイムラインが戻るようになりました。位置はブラウザ履歴エントリ単位で保存されるため、複数のポストを順に開いて戻るような操作でもそれぞれの位置が個別に復元されます（ホームタイムライン・カスタムフィード両対応）。
- **閲覧履歴** — 設定画面に「閲覧履歴」ページを追加しました。詳細を開いたポストが新しい順に表示され、アカウントごとに最大 200 件まで保持します。個別削除と全削除ボタンを備えています。削除されたポストやブロックされて取得できないポストは半透明のプレースホルダで表示され、どのポストか識別したうえで履歴から除外できます。履歴は端末ローカル（アカウント別）に保存され、アカウント切替時には自動的に該当アカウントの履歴に切り替わります。

### メンテナンス

- タイムラインのスクロール挙動を支える `useScrollRestoration` フック / `scrollRestoration` ライブラリを新規追加。Virtuoso ベースの任意のリストから再利用可能です。
- 閲覧履歴用の Zustand ストア (`viewHistoryStore` + localStorage 永続化) を追加し、`authStore` のログイン／アカウント切替／セッション復元に組み込みました。既存の `searchHistoryStore` と同じ規約に揃えています。
- 設定画面の新規文言を 11 言語すべてに追加しました。
