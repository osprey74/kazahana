# Release Notes — v2.1.4

## 🐛 Bug Fixes

- **Feed selector now shows all saved feeds and lists**: Fixed an issue where only default feeds (Discover, Video) were displayed in the feed selection UI. The app now correctly retrieves all user-saved feeds and lists by using the high-level AT Protocol SDK preferences API instead of manual parsing. Additionally, lists saved from other users' profiles are now included alongside self-created lists.

---

# リリースノート — v2.1.4

## 🐛 バグ修正

- **フィード選択画面で全ての保存済みフィード・リストが表示されるように修正**: フィード選択UIにデフォルトのフィード（Discover、Video）しか表示されない問題を修正しました。AT Protocol SDKの高レベルプリファレンスAPIを使用するように変更し、ユーザーが保存した全てのフィードとリストを正しく取得するようになりました。また、他のユーザーのプロフィールから保存したリストも、自作リストと合わせて表示されるようになりました。
