# kazahana 公式サイト コンテンツ原稿

**作成日**: 2026-02-22
**用途**: Claude Code への実装指示用コンテンツ原稿
**対象**: osprey74.github.io/kazahana

---

## 実装指示

以下のコンテンツ原稿をもとに、kazahana 公式サイト（GitHub Pages）を構築してください。

### 技術仕様
- プレーンHTML + CSS + JS（ビルドツール不要）
- GitHub Pages で `docs/` フォルダから配信
- ダーク/ライト対応（`prefers-color-scheme` 自動切替）
- レスポンシブデザイン（モバイル対応）
- 言語検出: `navigator.language` でブラウザ言語を検出し、対応フォルダにリダイレクト。未対応言語は `en/` にフォールバック

### カラーパレット
| 用途 | Light | Dark |
|------|-------|------|
| Primary | #0085FF | #0085FF |
| Background | #FFFFFF | #1A1A2E |
| Surface | #F8F9FA | #252540 |
| Text | #1A1A1A | #E8E8E8 |
| Text Secondary | #666666 | #AAAAAA |
| Border | #E4E4E4 | #2E2E42 |
| Accent (桜) | #FF8FAB | #FF8FAB |

### フォント
- システムフォント: `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Noto Sans JP", "Noto Sans KR", "Noto Sans SC", "Noto Sans TC", sans-serif`

### アイコン
- Material Symbols Rounded（CDN読み込み: https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded）

### ファイル構成
```
docs/
├── index.html            ← 言語振り分け（リダイレクト専用）
├── ja/index.html
├── en/index.html
├── pt-BR/index.html
├── de/index.html
├── zh-TW/index.html
├── zh-CN/index.html
├── fr/index.html
├── ko/index.html
├── es/index.html
├── ru/index.html
├── id/index.html
├── css/style.css          ← 全言語共通スタイル
├── js/
│   ├── lang-detect.js     ← 言語検出・リダイレクト
│   └── theme.js           ← ダーク/ライト切替
└── images/
    ├── icon.svg            ← kazahana アプリアイコン
    ├── screenshot-light.png
    └── screenshot-dark.png
```

---

## ルート index.html（言語振り分け）

```
言語コード → フォルダのマッピング:
ja       → /ja/
en       → /en/
pt, pt-BR → /pt-BR/
de       → /de/
zh-TW, zh-HK → /zh-TW/
zh, zh-CN    → /zh-CN/
fr       → /fr/
ko       → /ko/
es       → /es/
ru       → /ru/
id       → /id/
その他    → /en/（フォールバック）
```

---

## セクション別コンテンツ

### ■ ヘッダー

ページ上部に固定。ロゴ + アプリ名 + 言語切替ドロップダウン + テーマ切替ボタン。

言語切替の選択肢:
- 日本語
- English
- Português
- Deutsch
- 繁體中文
- 简体中文
- Français
- 한국어
- Español
- Русский
- Bahasa Indonesia

---

### ■ セクション①：ヒーロー

**[日本語]**

見出し:
```
軽くて、速い。
Bluesky をもっと快適に。
```

サブテキスト:
```
kazahana は軽量なBlueskyデスクトップクライアントです。
OSネイティブの技術で、メモリ消費を最小限に。
あなたのBluesky体験を、もっとシンプルに。
```

CTA ボタン:
- `ダウンロード（Windows）` → GitHub Releases の .msi リンク
- `ダウンロード（macOS）` → GitHub Releases の .dmg リンク

補足テキスト:
```
無料・オープンソース（MIT License）
```

---

**[English]**

Heading:
```
Light. Fast.
A better way to Bluesky.
```

Subtext:
```
kazahana is a lightweight Bluesky desktop client.
Built on native OS technology for minimal memory usage.
Your Bluesky experience, simplified.
```

CTA buttons:
- `Download for Windows` → GitHub Releases .msi link
- `Download for macOS` → GitHub Releases .dmg link

Note:
```
Free & open source (MIT License)
```

---

### ■ セクション②：Features（4つの特徴）

**[日本語]**

特徴1:
```
アイコン: memory （Material Symbols Rounded）
見出し: 軽量
本文: OS標準のWebViewを活用し、メモリ消費をPWA比で大幅削減。長時間の利用でもPCが重くなりません。
```

特徴2:
```
アイコン: bolt
見出し: 高速
本文: ネイティブアプリならではの起動速度。タイムラインの読み込みもスムーズで、待ち時間なく快適に閲覧できます。
```

特徴3:
```
アイコン: dashboard
見出し: シンプル
本文: 1カラムのすっきりしたUI。タイムライン、投稿、通知、検索、プロフィール — 必要な機能はすべて揃っています。
```

特徴4:
```
アイコン: translate
見出し: 多言語対応
本文: 日本語・英語をはじめ11言語をサポート。世界中のBlueskyユーザーが母国語で使えます。
```

---

**[English]**

Feature 1:
```
Icon: memory
Title: Lightweight
Body: Uses your OS's native WebView to dramatically reduce memory usage compared to PWA. Your PC stays fast, even after hours of use.
```

Feature 2:
```
Icon: bolt
Title: Fast
Body: Native app startup speed. Smooth timeline loading with no waiting — browse your feed without friction.
```

Feature 3:
```
Icon: dashboard
Title: Simple
Body: A clean single-column UI. Timeline, posting, notifications, search, and profile — everything you need, nothing you don't.
```

Feature 4:
```
Icon: translate
Title: Multilingual
Body: Supports 11 languages including English and Japanese. Bluesky users around the world can use kazahana in their native language.
```

---

### ■ セクション③：Screenshots

**[日本語]**

見出し:
```
スクリーンショット
```

説明:
```
シンプルで見やすいインターフェース。ダークモードにも対応しています。
```

画像:
- screenshot-light.png（ライトモードのタイムライン画面）
- screenshot-dark.png（ダークモードのタイムライン画面）

※ 画像はアプリ完成後に差し替え。プレースホルダーとして「Coming soon」を表示。

---

**[English]**

Heading:
```
Screenshots
```

Description:
```
A clean, readable interface. Dark mode included.
```

Images: same as above

---

### ■ セクション④：Download

**[日本語]**

見出し:
```
ダウンロード
```

説明:
```
kazahana は Windows と macOS に対応しています。
```

ダウンロードカード（Windows）:
```
アイコン: desktop_windows
タイトル: Windows
対応: Windows 10 / 11
形式: .msi インストーラー
ボタン: ダウンロード
リンク先: https://github.com/osprey74/kazahana/releases/latest
```

ダウンロードカード（macOS）:
```
アイコン: laptop_mac
タイトル: macOS
対応: macOS 12 Monterey 以降
形式: .dmg ディスクイメージ
ボタン: ダウンロード
リンク先: https://github.com/osprey74/kazahana/releases/latest
```

補足:
```
すべてのバージョンは GitHub Releases からダウンロードできます。
```

---

**[English]**

Heading:
```
Download
```

Description:
```
kazahana is available for Windows and macOS.
```

Download card (Windows):
```
Icon: desktop_windows
Title: Windows
Supports: Windows 10 / 11
Format: .msi installer
Button: Download
Link: https://github.com/osprey74/kazahana/releases/latest
```

Download card (macOS):
```
Icon: laptop_mac
Title: macOS
Supports: macOS 12 Monterey and later
Format: .dmg disk image
Button: Download
Link: https://github.com/osprey74/kazahana/releases/latest
```

Note:
```
All versions are available on GitHub Releases.
```

---

### ■ セクション⑤：Support

**[日本語]**

見出し:
```
サポート・応援
```

説明:
```
kazahana はオープンソースプロジェクトです。
開発の継続を支援していただける方は、以下からご協力をお願いします。
```

支援カード:
```
☕ Ko-fi:
「開発者にコーヒーをご馳走する」
ボタン: Ko-fi で応援する
リンク: https://ko-fi.com/osprey74

💖 GitHub Sponsors:
「毎月の支援で開発を応援」
ボタン: GitHub Sponsors
リンク: https://github.com/sponsors/osprey74
```

問い合わせ:
```
アイコン: mail
見出し: お問い合わせ
本文: バグ報告や機能リクエストは GitHub Issues へ。
その他のお問い合わせはメールでご連絡ください。
GitHub Issues: https://github.com/osprey74/kazahana/issues
メール: kazahana.app@gmail.com
```

---

**[English]**

Heading:
```
Support
```

Description:
```
kazahana is an open source project.
If you'd like to support continued development, here's how you can help.
```

Support cards:
```
☕ Ko-fi:
"Buy the developer a coffee"
Button: Support on Ko-fi
Link: https://ko-fi.com/osprey74

💖 GitHub Sponsors:
"Support development with monthly sponsorship"
Button: GitHub Sponsors
Link: https://github.com/sponsors/osprey74
```

Contact:
```
Icon: mail
Title: Contact
Body: For bug reports and feature requests, please use GitHub Issues.
For other inquiries, reach us by email.
GitHub Issues: https://github.com/osprey74/kazahana/issues
Email: kazahana.app@gmail.com
```

---

### ■ フッター

**[日本語]**

```
kazahana — 軽量 Bluesky デスクトップクライアント

GitHub | ライセンス: MIT | © 2026 osprey74
```

リンク:
- GitHub → https://github.com/osprey74/kazahana
- MIT → LICENSE ファイルへのリンク

---

**[English]**

```
kazahana — Lightweight Bluesky Desktop Client

GitHub | License: MIT | © 2026 osprey74
```

Links:
- GitHub → https://github.com/osprey74/kazahana
- MIT → link to LICENSE file

---

## 残り9言語の翻訳指示

以下の9言語について、上記の日本語・英語コンテンツをもとに翻訳してください。
各言語のネイティブスピーカーに自然に読めるよう、直訳ではなく意訳を心がけてください。

1. `pt-BR` — ポルトガル語（ブラジル）
2. `de` — ドイツ語
3. `zh-TW` — 繁体字中国語
4. `zh-CN` — 簡体字中国語
5. `fr` — フランス語
6. `ko` — 韓国語
7. `es` — スペイン語
8. `ru` — ロシア語
9. `id` — インドネシア語

翻訳時の注意:
- 「kazahana」はアプリ名のため翻訳しない
- 「Bluesky」「GitHub」「Ko-fi」等の固有名詞は翻訳しない
- CTA ボタンのテキストは各言語で自然な表現にする
- 技術用語（WebView, PWA, OS, MIT License 等）はそのまま使用
- 敬体/丁寧体の度合いは各言語の一般的なソフトウェア紹介に合わせる

---

## デザイン補足指示

### ヒーローセクション
- 背景: アプリのPrimary色（#0085FF）のグラデーション
- テキスト: 白文字
- アプリアイコンをヒーロー内に配置
- ダウンロードボタンは白背景に Primary 色テキスト

### Features セクション
- 4つの特徴を2×2グリッドで配置（モバイルでは1カラム）
- 各特徴にMaterial Symbols Roundedのアイコン（48px）
- カードスタイル: 薄いボーダー + 軽いシャドウ

### Screenshots セクション
- 2枚の画像を横並び（モバイルでは縦積み）
- 画像に軽いシャドウ + 角丸（8px）
- 完成前は「Coming soon」プレースホルダー

### Download セクション
- OS別カードを横並び（モバイルでは縦積み）
- 各カードにOSアイコン + 情報 + ダウンロードボタン
- ボタン色: Primary (#0085FF)

### Support セクション
- Ko-fi と GitHub Sponsors のカードを横並び
- 問い合わせ情報はその下に配置

### フッター
- 背景: Surface色
- テキスト: Secondary色
- コンパクトに1〜2行で収める
