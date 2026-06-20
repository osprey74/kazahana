## What's New / 新機能・変更点

### English

#### 🐛 Bug Fixes

**OGP link cards no longer mojibake on non-UTF-8 sites**

Previously, when composing a post that included an external link, kazahana fetched the target page's OGP metadata (`og:title` / `og:description`) but always decoded the HTTP response as **UTF-8**, regardless of the actual encoding. Sites served in Shift_JIS, EUC-JP, or ISO-2022-JP — common for older Japanese websites — therefore showed garbled characters in the link card preview. Worse, the mojibake was written to the `app.bsky.embed.external` record as-is, so the broken text remained visible to every other client even after posting, and could not be fixed after submission.

This release reworks `fetchHtml()` to detect the character encoding following the HTML living standard priority:

1. **`charset=...` parameter in the `Content-Type` HTTP header** (highest priority)
2. **`<meta charset>` or `<meta http-equiv="Content-Type">` in the first ~4096 bytes of the body**
3. **UTF-8 as fallback** (lowest priority)

Detection is performed with `TextDecoder`, which natively handles Shift_JIS, EUC-JP, ISO-2022-JP, and the other encodings supported by the WHATWG Encoding Standard. The OGP regex parser is unchanged — only the fetch layer was modified.

This fix also benefits `extractStandardSiteUris()` and any other consumer that goes through `fetchHtml()`.

#### 🔧 Notes on cross-platform parity

The same charset bug exists on iOS and Android. Those platforms will be addressed in subsequent kazahana-ios / kazahana-android releases, tracked under the same GitHub issue ([#12](https://github.com/osprey74/kazahana/issues/12)).

#### 🙏 Acknowledgements

- **KC-2001MS** ([@k-c-2001ms.bsky.social](https://bsky.app/profile/k-c-2001ms.bsky.social)) — for the detailed bug report ([#12](https://github.com/osprey74/kazahana/issues/12)), including side-by-side comparisons with other Bluesky clients that pinpointed the issue as a client-side OGP fetch problem rather than a server-side one. Thank you!

---

### 日本語

#### 🐛 バグ修正

**非 UTF-8 サイトのリンクカードが文字化けする問題を修正**

これまで kazahana で外部リンクを含む投稿を作成した際、リンク先の OGP メタデータ（`og:title` / `og:description`）取得時に **HTTP レスポンスを常に UTF-8 でデコード**していたため、Shift_JIS / EUC-JP / ISO-2022-JP など非 UTF-8 でエンコードされた日本語サイトでリンクカードのタイトル・説明が文字化けしていました。さらに、文字化けしたデータがそのまま `app.bsky.embed.external` レコードへ永続化されるため、投稿後は他クライアントから見ても文字化けしたまま表示され、後から修正することもできない深刻な問題でした。

本リリースで `fetchHtml()` を改修し、HTML living standard に準拠した優先度で文字コードを検出するようになりました：

1. **HTTP `Content-Type` ヘッダの `charset=...` パラメータ**（最優先）
2. **HTML 先頭 ~4096 バイトの `<meta charset>` / `<meta http-equiv="Content-Type">`**
3. **UTF-8 フォールバック**（最後）

デコードには `TextDecoder` を使用し、WHATWG Encoding Standard 準拠のエンコーディング（Shift_JIS / EUC-JP / ISO-2022-JP ほか）にネイティブ対応しています。OGP メタタグ抽出ロジックは変更しておらず、修正対象はフェッチ層のみです。

この修正は `extractStandardSiteUris()` を含む `fetchHtml()` 経由の全機能にも反映されます。

#### 🔧 マルチプラットフォーム対応について

同じ文字コード不具合は iOS / Android 版にも存在します。両プラットフォームについては、後続の kazahana-ios / kazahana-android リリースで順次対応予定です（同じ GitHub Issue [#12](https://github.com/osprey74/kazahana/issues/12) で追跡）。

#### 🙏 謝辞

- **KC-2001MS** 様（[@k-c-2001ms.bsky.social](https://bsky.app/profile/k-c-2001ms.bsky.social)） — 他の Bluesky クライアントとの比較投稿を含む詳細なバグレポート（[#12](https://github.com/osprey74/kazahana/issues/12)）をご提供いただき、サーバー側ではなくクライアント側の OGP 取得処理の問題であることを切り分ける決定的な情報となりました。誠にありがとうございました。
