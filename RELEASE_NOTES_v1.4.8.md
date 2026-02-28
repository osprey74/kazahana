# Release Notes — v1.4.8

## ✨ New Features

- **Notification enhancements**: Color-coded notification icons (heart for likes, colored reply/repost/quote icons), improved text visibility with darker colors, and inline action buttons (reply, repost, like) directly from notification items
- **Compose form improvements**: Drag & drop image attachment support, clipboard screenshot paste with auto-compression for images over 1MB
- **Translation button**: Translate any post via Google Translate directly from the post menu
- **Quick-jump menu**: Jump to any feed or list from a dropdown in the header
- **Image display mode**: Choose between in-app lightbox or opening images in external browser (Settings)
- **Sticky headers**: Feed tab header on Home, search field + tabs on Search, profile tabs, and DM thread header all stay fixed while scrolling
- **Profile mention auto-insert**: Opening compose from another user's profile (N key or FAB) auto-inserts @mention
- **Profile "Replies" tab**: View a user's posts with replies on their profile page
- **DM chronological order**: Messages now display oldest-first (top to bottom), with input area at the bottom and 50vh bottom spacer for comfortable reading
- **Other users' profile**: Removed "Likes" tab (Bluesky API restriction) for cleaner profile view

## 🐛 Bug Fixes

- Fixed white screen crash caused by Temporal Dead Zone in ComposeModal (handlePaste referencing handleAddImages before definition)
- Fixed translate button not responding in Tauri WebView (window.open → openUrl from plugin-opener)
- Fixed image drag & drop not working in Tauri (added dragDropEnabled: false to tauri.conf.json)
- Fixed scroll position jumping when switching profile tabs with sticky header

## 🌐 Internationalization

- All new features include translations for 11 languages: Japanese, English, German, Spanish, French, Indonesian, Korean, Portuguese, Russian, Simplified Chinese, Traditional Chinese

## Acknowledgements

- **あやがね** ([@ayagane.magical-pritt.jp](https://bsky.app/profile/ayagane.magical-pritt.jp)) — Feature requests and feedback that drove the majority of improvements in this release

---

# リリースノート — v1.4.8

## ✨ 新機能

- **通知欄の改善**: いいね通知の♥マークをカラー化し返信との区別を容易に、ハンドルネーム以外の文字色を濃くして視認性向上、通知から直接返信・リポスト・いいね操作が可能に
- **投稿フォームの改善**: 画像ファイルのドラッグ＆ドロップ添付対応、クリップボードからのスクリーンショットペースト対応（1MB超画像の自動圧縮付き）
- **翻訳ボタン**: ポストメニューからGoogle翻訳でポストテキストを翻訳
- **クイックジャンプメニュー**: ヘッダーのドロップダウンからフィード・リストに直接切替
- **画像表示モード設定**: アプリ内ライトボックス表示またはブラウザで開くを選択可能（設定画面）
- **スティッキーヘッダー**: ホームのフィードタブ、検索フィールド＋タブ、プロフィールタブ、DMスレッドヘッダーがスクロール時に上部固定
- **プロフィールメンション自動挿入**: 他ユーザーのプロフィールから投稿フォームを開く（Nキー／FAB）と@メンションを自動挿入
- **プロフィール「返信」タブ**: ユーザーの返信付き投稿を一覧表示
- **DMメッセージ時系列昇順**: メッセージが古い順（上から下）に表示、入力エリアを下部に配置、50vh余白で快適な閲覧
- **他ユーザーのプロフィール**: 「いいね」タブを除去（Bluesky API制限のため）

## 🐛 バグ修正

- ComposeModalの一時的デッドゾーン（TDZ）による白画面クラッシュを修正（handlePasteがhandleAddImages定義前に参照）
- Tauri WebViewで翻訳ボタンが反応しない問題を修正（window.open → plugin-openerのopenUrl）
- Tauriで画像ドラッグ＆ドロップが動作しない問題を修正（tauri.conf.jsonにdragDropEnabled: false追加）
- スティッキーヘッダー時のプロフィールタブ切替でスクロール位置がジャンプする問題を修正

## 🌐 多言語対応

- 全新機能について11言語の翻訳を追加: 日本語、英語、ドイツ語、スペイン語、フランス語、インドネシア語、韓国語、ポルトガル語、ロシア語、簡体字中国語、繁体字中国語

## 謝辞

- **あやがね** ([@ayagane.magical-pritt.jp](https://bsky.app/profile/ayagane.magical-pritt.jp)) — 本リリースの大部分の改善を推進する機能要望とフィードバック
