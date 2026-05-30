# Release Notes — v3.0.0

## EN

### 🍎 End of macOS Binary Distribution on GitHub

**This v3.0.0 release is the final macOS build distributed via GitHub Releases.**

Going forward, the macOS version of kazahana will be distributed through the **Mac App Store** as the Mac Catalyst version of [kazahana-ios](https://github.com/osprey74/kazahana-ios). Details and timing for the App Store release will be announced separately.

The Windows version (built with Tauri) will continue to be developed and distributed from this repository as before.

Thank you to everyone who used the macOS builds from GitHub Releases.

### New Features

- **Standard Site extended link card** — kazahana now displays the rich link card defined by the AT Protocol [Standard Site](https://standard.site) ecosystem (Leaflet, pckt, Offprint, etc.). When you receive a post that links to a Standard Site document, the card shows the article's publication date, reading time, source publication (with its theme accent color), author byline, and a "View publication" button. When you paste such a URL into the composer, the same extended card is shown in the preview, and the post you send carries the `associatedRefs` so other clients can render it too.
- **Custom PDS login** — kazahana can now sign in to accounts hosted on PDS servers other than `bsky.social`. The login flow automatically resolves your handle to its DID and then to the PDS endpoint, so you can use the same login form regardless of which PDS hosts your account. Existing `bsky.social` users see no behavior change.
- **Cross-PDS direct messages** — Direct messages now work correctly for accounts hosted on PDS servers outside `bsky.network`. Chat routes through `api.bsky.chat` with `getServiceAuth`-based audience resolution, so DM works the same way for `bsky.social` accounts and accounts on independent PDSes.

### Maintenance

- Updated `@atproto/api` from `0.18.21` to `0.20.5` to access the new Standard Site lexicon types (`site.standard.*`). The internal codebase was migrated from deep type imports (`@atproto/api/dist/client/...`) to public namespace imports across 28 source files, in line with the SDK's stricter package `exports`.
- New helpers in `src/lib/embed/` for the external embed pipeline: `external.ts` consolidates the previously duplicated `getExternalEmbed` helper, and `preview.ts` wraps `app.bsky.embed.getEmbedExternalView` with HTML-based AT-URI extraction and an OGP fallback path.
- Composer's link preview now uses the shared `LinkCard` component, so authors see exactly the same card the recipients will see (with the `Subscribe` action hidden in compose mode).

---

## JA

### 🍎 macOS バイナリ配布の終了について

**本 v3.0.0 は、GitHub Releases 経由で配布する最後の macOS 版となります。**

kazahana の macOS 版は今後、**Mac App Store** にて、[kazahana-ios](https://github.com/osprey74/kazahana-ios) の Mac Catalyst 版として配布する形に移行します。公開時期の詳細は後日改めてお知らせいたします。

Windows 版は引き続き本リポジトリ（Tauri 製）で開発・配布を継続いたします。

これまで GitHub Releases 経由で macOS 版をお使いいただいた皆様、誠にありがとうございました。

### 新機能

- **Standard Site 拡張リンクカード対応** — AT Protocol の [Standard Site](https://standard.site) エコシステム（Leaflet / pckt / Offprint など）が定義する拡張リンクカードを表示できるようになりました。Standard Site 対応の長文記事 URL を含むポストを受信すると、リンクカードに公開日・読了時間・パブリケーション情報（テーマアクセントカラー付き）・著者表記・「公開元を見る」ボタンが表示されます。コンポーザに同種の URL を貼り付けた場合も、プレビューに同じ拡張カードが表示され、投稿レコードには `associatedRefs` が含まれるため他クライアントでも拡張カードとして見えます。
- **独自 PDS ログイン対応** — `bsky.social` 以外の PDS サーバーでホストされているアカウントでログインできるようになりました。ログイン処理が自動でハンドル → DID → PDS エンドポイントを解決するため、PDS の違いを意識せずに同じログイン画面が利用できます。既存の `bsky.social` ユーザーの挙動は変わりません。
- **クロス PDS DM 対応** — `bsky.network` 外の PDS でホストされているアカウントの DM が正しく動作するようになりました。チャット通信は `getServiceAuth` ベースの audience 解決を経由して `api.bsky.chat` にルーティングされるため、`bsky.social` アカウントと独立 PDS のアカウントが同じように DM を使えます。

### メンテナンス

- 新しい Standard Site 関連 lexicon 型（`site.standard.*`）を利用するため、`@atproto/api` を `0.18.21` から `0.20.5` にアップデートしました。それに合わせて、ディープインポート（`@atproto/api/dist/client/...`）から公開ネームスペースインポートへ 28 ファイルを移行しています（SDK の `exports` フィールドが厳格化されたため）。
- `src/lib/embed/` に external embed パイプラインのヘルパーを新設。`external.ts` で従来 4 箇所に重複していた `getExternalEmbed` ヘルパーを共通化し、`preview.ts` で `app.bsky.embed.getEmbedExternalView` 呼び出しを HTML からの AT-URI 抽出と OGP フォールバックでラップしています。
- コンポーザのリンクプレビューを共通の `LinkCard` コンポーネントに置き換え、執筆者が受信者と同じ見た目のカードを確認できるようになりました（コンポーザ表示時のみ Subscribe ボタンは非表示）。
