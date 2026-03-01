# Release Notes — kazahana v2.0.1

## Bug Fixes

- **Repost notification navigation** — Clicking a notification for a liked/reposted repost no longer shows "Post not found". The app now resolves the repost record URI to the original post URI before navigating to the thread view.
- **Notification action buttons** — Reply, repost, and like action buttons now correctly appear on all notification types. Previously, reply/mention/quote notifications could fail to display action buttons due to a subject post lookup key mismatch.

## Acknowledgements

- **あやがね** ([@ayagane.magical-pritt.jp](https://bsky.app/profile/ayagane.magical-pritt.jp)) — Bug reports

---

# リリースノート — kazahana v2.0.1

## バグ修正

- **リポスト経由の通知ナビゲーション修正** — リポストに対する「いいね」「リポスト」通知をクリックした際に「投稿が見つかりません」と表示される問題を修正しました。リポストレコードURIを元ポストURIに解決してからスレッドビューに遷移するようになりました。
- **通知アクションボタンの表示修正** — すべての通知タイプで返信・リポスト・いいねのアクションボタンが正しく表示されるようになりました。返信・メンション・引用通知でsubjectPostの検索キーが不一致だったため、一部の通知でボタンが表示されない問題がありました。

## 謝辞

- **あやがね** ([@ayagane.magical-pritt.jp](https://bsky.app/profile/ayagane.magical-pritt.jp)) — バグ報告
