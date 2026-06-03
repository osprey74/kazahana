# Release Notes — kazahana v3.1.0

## EN

### ✨ New Features

- **Bluesky verification badges** — kazahana now displays the verification badges that Bluesky introduced in 2025. Verified accounts get a blue checkmark and trusted verifiers get a premium icon, shown next to display names on profile headers, user lists, post cards (including parent reply context), and notifications. The new `verified` / `unverified` notification reasons are also handled, complete with icons, colored labels, and grouped count summaries. Tooltips are localized into all 11 supported languages.

### 🐛 Bug Fixes

- **BSAF visual styling scope** — The severity border, BSAF tag badges, and duplicate detection were previously applied to *every* `bsaf:v1`-tagged post, even from bots the user had not registered. This broke the "registration = subscription" model that filtering already followed: posts from unregistered bots could even hide a registered bot's post via the duplicate group. Visual styling and duplicate detection are now restricted to posts from registered bots, matching the existing filter behavior.

### 📝 Documentation

- `README.md` / `README.ja.md` updated with the new verification badge feature
- `docs/PLATFORM_MATRIX.md` — added rows for verification badge and `verified` / `unverified` notification reasons in sections 2 and 5; Desktop-leading subsection updated
- `design/kazahana-spec.md` — sections 4.5 and 4.6 expanded; Phase 5 BSAF rows note the new "registered bots only" scope
- `design/remaining-work.md` — new sections recording both work items

---

## JA

### ✨ 新機能

- **Bluesky 認証マーク表示** — 2025年にBlueskyが導入した認証システムに対応しました。認証済みアカウントには青いチェックマーク、信頼された認証機関にはプレミアムアイコンを表示名横に表示します。プロフィールヘッダー、ユーザーリスト、投稿カード（親リプライコンテキスト含む）、通知の全画面に展開しています。新しい通知理由 `verified` / `unverified` にも対応し、専用アイコン・色付きラベル・カウントサマリーを表示します。ツールチップは対応11言語すべてにローカライズ済みです。

### 🐛 バグ修正

- **BSAF視覚スタイルの適用範囲の修正** — これまで `bsaf:v1` タグ付き投稿に対しては、未登録Botからのものでも深刻度カラーボーダー・BSAFタグバッジ・重複検出が適用されていました。これは既にフィルタリングが採用している「登録＝購読」モデルと矛盾しており、未登録Botとの重複検出で登録Botの投稿が非表示になる潜在的不具合もありました。視覚スタイルと重複検出を登録Bot限定に修正し、既存のフィルタ動作と整合させました。

### 📝 ドキュメント

- `README.md` / `README.ja.md` — 認証マーク表示機能を追記
- `docs/PLATFORM_MATRIX.md` — セクション2・5に認証マーク・`verified` / `unverified` 通知理由の行を追加、Desktop先行実装サブセクションを更新
- `design/kazahana-spec.md` — 4.5/4.6を拡充、Phase 5 BSAF項目に「登録Bot限定」を明記
- `design/remaining-work.md` — 両方の作業項目を新規セクションとして記録

---

## Acknowledgements / 謝辞

Verification feature was prompted by kazahana's official Bluesky account ([@app-kazahana.bsky.social](https://bsky.app/profile/app-kazahana.bsky.social)) receiving an official verification mark from Bluesky.

kazahana 公式 Bluesky アカウント（[@app-kazahana.bsky.social](https://bsky.app/profile/app-kazahana.bsky.social)）がBluesky公式から認証マークを付与されたことを契機に、認証マーク機能を実装しました。
