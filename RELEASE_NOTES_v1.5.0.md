# Release Notes — v1.5.0

## EN

### ✨ New Features

- **Repost notification subject resolution** — When someone likes/reposts your repost, the notification now shows the original post instead of "Post not found"
- **Non-pinned feed display** — Feeds that are not officially pinned can now be displayed; added a "Show all / Visible only" toggle in quick-jump settings
- **Drag & drop feed/list reordering** — Feed and list order in the visibility settings can now be rearranged by dragging instead of up/down buttons (powered by @dnd-kit)
- **Profile post search** — Search posts by a specific user directly from their profile's Posts tab, with debounced input
- **Chat message reactions** — Add emoji reactions (❤️👍😂😮😢🎉) to direct messages with a quick picker; reactions are displayed as grouped badges with counts
- **Feed/list name banner** — The currently selected feed or list name is now displayed between the tab menu and the post list
- **Quick-jump navigation fix** — Selecting a feed/list from the quick-jump dropdown while on non-home pages now correctly navigates to the home screen

### 📝 Documentation

- Updated README (EN/JA) with new feature entries
- Updated internal design spec (kazahana-spec.md)

### Acknowledgements

Thanks to **あやがね** ([@ayagane.magical-pritt.jp](https://bsky.app/profile/ayagane.magical-pritt.jp)) for feature requests and testing.

---

## JA

### ✨ 新機能

- **リポスト経由の通知で元ポスト表示** — 自分のリポストに対する「いいね」「リポスト」通知で、「投稿が見つかりません」ではなく元の投稿が表示されるようになりました
- **非ピン留めフィードの表示** — 公式ピン留め以外のフィードも表示可能に。クイックジャンプに「全て表示/表示中のみ」切替設定を追加
- **フィード/リストのドラッグ&ドロップ並べ替え** — フィード表示設定画面で、上下ボタンの代わりにドラッグ操作で並べ替えが可能に（@dnd-kit導入）
- **プロフィール投稿検索** — プロフィール画面の投稿タブから、そのユーザーの投稿を直接検索できるようになりました（デバウンス付き）
- **チャットメッセージリアクション** — ダイレクトメッセージに絵文字リアクション（❤️👍😂😮😢🎉）を追加可能に。クイックピッカー、グループ化バッジ表示、カウント表示対応
- **フィード/リスト名バナー** — 選択中のフィードまたはリスト名がタブメニューとポストリストの間に表示されるようになりました
- **クイックジャンプのナビゲーション修正** — ホーム以外のページからクイックジャンプでフィード/リストを選択した際、正しくホーム画面に遷移するようになりました

### 📝 ドキュメント

- README（EN/JA）に新機能を追記
- 内部設計仕様書（kazahana-spec.md）を更新

### 謝辞

機能要望・テストにご協力いただいた **あやがね** さん ([@ayagane.magical-pritt.jp](https://bsky.app/profile/ayagane.magical-pritt.jp)) に感謝いたします。
