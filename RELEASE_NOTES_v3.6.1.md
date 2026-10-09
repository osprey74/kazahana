# kazahana v3.6.1

## English

### ✨ New Features

#### Sender names and avatars in group chats

Group chats previously showed other members' messages without any sender information, making it hard to tell who wrote what. Messages from others are now grouped into runs (same sender, within 5 minutes): the sender's display name appears above the first bubble of each run and their avatar beside the last bubble, matching the Bluesky official app. Clicking the name or avatar opens the sender's profile. One-on-one DMs are unchanged.

#### "Follows you" badge on profiles

When you open someone's profile, a "Follows you" badge is now shown next to their handle if that account follows you, so you can see the follow relationship in both directions at a glance.

### 🐛 Bug Fixes

- Group system messages (member joined / left, etc.) could show a shortened DID instead of the member's name. Member names are now resolved from the full group member list.

### 🔧 Notes on cross-platform parity

Both features in this release are Desktop-only for now. iOS / Android / Catalyst support is tracked in `docs/PLATFORM_MATRIX.md`.

---

## 日本語

### ✨ 新機能

#### グループチャットでの送信者名・アバター表示

これまでグループチャットでは他のメンバーのメッセージに送信者情報が表示されず、誰の発言か判別しにくい状態でした。他のメンバーのメッセージを「同じ送信者・5 分以内」の連続ブロックにまとめ、ブロック先頭の吹き出しの上に表示名、末尾の吹き出しの横にアバターを表示するようにしました（Bluesky 公式アプリと同様の表示です）。名前またはアバターをクリックするとプロフィールを開きます。1 対 1 の DM の表示は変わりません。

#### プロフィールの「あなたをフォローしています」バッジ

プロフィールを開いたとき、そのアカウントが自分をフォローしている場合は、ハンドルの横に「あなたをフォローしています」バッジを表示するようにしました。相互のフォロー関係をひと目で確認できます。

### 🐛 バグ修正

- グループのシステムメッセージ（メンバーの参加・退出など）で、メンバー名の代わりに短縮した DID が表示されることがある問題を修正しました。グループの全メンバー一覧から名前を解決するようにしました。

### 🔧 マルチプラットフォーム対応について

本リリースの機能は現時点では Desktop のみの対応です。iOS / Android / Catalyst への対応状況は `docs/PLATFORM_MATRIX.md` で管理しています。
