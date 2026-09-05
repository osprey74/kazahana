# kazahana v3.6.0

## English

### ✨ New Features

#### OP thread numbering badge (Bluesky v1.130 compatibility)

kazahana now shows a numbering badge on posts that belong to a consecutive same-author thread (e.g. `2/3`), matching the Bluesky official app since v1.130. The badge reads the AppView-provided `opThreadPostIndex` / `opThreadPostCount` fields (social-app PR #11472) via a local accessor, so you can tell at a glance where a post sits within the original poster's thread.

#### Video embeds with ALT text in quoted posts

Quoted posts previously rendered only images, silently dropping any embedded video and its ALT text. v3.6.0 renders the video player and its ALT description inside the quote card as well, completing video ALT coverage across every display surface (timeline, thread, notifications, and now quotes).

- New shared helper `src/lib/embed/video.ts` (`extractVideoFromEmbed` / `extractVideoFromQuoteEmbeds`) mirrors the existing gallery image extractor and recursively unwraps `app.bsky.embed.video#view` and `recordWithMedia#view.media`.
- `QuoteEmbed` now renders `VideoPlayer` plus the ALT text line below the image grid, using the same styling as the other display surfaces.

### 🔧 Maintenance

- `docs/PLATFORM_MATRIX.md`: added a "video ALT text display" row under Section 2 (Desktop ✅; iOS / Android / Catalyst marked ❓ pending parity verification).

### 🔧 Cross-platform parity

Both features in this release are Desktop-only. iOS / Android / Catalyst parity for the OP thread numbering badge and quoted-video ALT display is tracked in `docs/PLATFORM_MATRIX.md`.

---

## 日本語

### ✨ 新機能

#### OP スレッド番号付けバッジ（Bluesky v1.130 互換）

同一著者による連続スレッドに属する投稿へ、位置を示す番号バッジ（例 `2/3`）を表示するようにしました。Bluesky 公式アプリ v1.130 以降と同等の挙動です。AppView が提供する `opThreadPostIndex` / `opThreadPostCount` フィールド（social-app PR #11472）を局所アクセサで読み取り、投稿がスレッド元投稿者の連投のどの位置にあるかを一目で把握できます。

#### 引用投稿内の動画表示 + ALT テキスト対応

これまで引用投稿カードは画像のみを表示し、埋め込まれた動画とその ALT テキストを破棄していました。v3.6.0 では引用カード内でも動画プレイヤーと ALT 説明文を描画するようになり、全表示面（タイムライン・スレッド・通知、そして引用）で動画 ALT 表示が揃いました。

- 共有ヘルパー `src/lib/embed/video.ts`（`extractVideoFromEmbed` / `extractVideoFromQuoteEmbeds`）を新設。既存の画像抽出ヘルパーに倣い、`app.bsky.embed.video#view` および `recordWithMedia#view.media` を再帰展開します。
- `QuoteEmbed` は画像グリッドの下に `VideoPlayer` と ALT テキスト行を描画するようになりました。他の表示面と同一スタイルです。

### 🔧 メンテナンス

- `docs/PLATFORM_MATRIX.md`: Section 2 に「動画 ALT テキスト表示」行を追加（Desktop ✅、iOS / Android / Catalyst は parity 要確認のため ❓）

### 🔧 マルチプラットフォーム対応について

本リリースの 2 機能はいずれも Desktop のみの対応です。OP スレッド番号付けバッジ・引用内動画 ALT 表示の iOS / Android / Catalyst 対応は `docs/PLATFORM_MATRIX.md` で追跡します。
