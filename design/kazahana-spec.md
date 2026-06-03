# Kazahana— Bluesky Desktop Client 仕様書

**バージョン**: 2.0
**作成日**: 2026-02-21
**最終更新**: 2026-03-18
**プラットフォーム**: Windows 11 / macOS
**フレームワーク**: Tauri v2 + React 19 + TypeScript 5.9

---

## 1. プロジェクト概要

### 1.1 背景
BlueskyクライアントのPWA実装版はChromiumプロセスのメモリ肥大化により、長時間利用でPCが重くなる問題がある。ネイティブデスクトップクライアントを構築し、メモリ効率の良いBluesky体験を提供する。

### 1.2 コンセプト
- **軽量**: OS標準WebView利用でメモリ消費を最小化
- **高速**: ネイティブアプリならではの起動速度とレスポンス
- **シンプル**: 1カラムUI、必要十分な機能に絞ったMVP

### 1.3 設計思想 — 軽快な常駐アプリ

kazahanaは全機能を網羅するスタンドアロンアプリではなく、**軽快に常駐して日常利用する閲覧・投稿特化クライアント**として設計されている。

**基本方針:**
- タイムライン閲覧、投稿、通知確認など**日常的に頻繁に行う操作**をkazahana上で快適に行えるようにする
- ミュートワード設定、プロフィール編集、リスト管理など**設定・管理系の操作**は[Blueskyウェブ版](https://bsky.app/)で行う前提とする
- Blueskyウェブ版で行った設定（ブロック、ミュート、ラベル設定等）は**kazahanaに自動的に反映される**（AT Protocol の preferences / moderation API を通じてサーバーサイドで同期）

**kazahanaが担う領域:**
- タイムライン・カスタムフィード・リストフィードの閲覧
- 投稿・返信・引用・画像/動画添付・スレッド作成
- いいね・リポスト・ブックマーク
- 通知確認
- ユーザー検索・投稿検索
- プロフィール閲覧・フォロー/フォロー解除
- コンテンツモデレーション（ラベル設定はkazahanaでも変更可能）
- ダイレクトメッセージ
- 投稿削除・通報・スレッドゲート・ポストゲート
- ユーザーのブロック/ブロック解除・ミュート/ミュート解除・通報

**Blueskyウェブ版に委ねる領域:**
- アカウント管理（プロフィール編集、ハンドル変更、メールアドレス変更、アカウント削除）
- ブロック/ミュートの一覧管理（ブロック一覧、ミュートワード設定）
- リスト作成・編集・メンバー管理
- フィードジェネレーターの作成・管理
- スターターパック作成
- 外部ラベラーの購読管理
- アプリパスワード管理
- 招待コード管理

### 1.4 アプリ名
- **日本語名**: kazahana
- **英語名**: Kazahana
- **パッケージID**: com.kazahana.app

---

## 2. 技術スタック

### 2.1 コア
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Tauri | v2 | デスクトップアプリフレームワーク |
| React | 19.2 | UIフレームワーク |
| TypeScript | 5.9 | 型安全な開発 |
| Vite | 7.3 | ビルドツール |

### 2.2 フロントエンド
| ライブラリ | バージョン | 用途 |
|-----------|-----------|------|
| `@atproto/api` | 0.18 | Bluesky公式TypeScript SDK |
| TailwindCSS | 3.4 | スタイリング |
| `@tanstack/react-query` | 5.90 | データフェッチ・キャッシュ管理 |
| Zustand | 5.0 | 軽量状態管理 |
| `react-router-dom` | 7.13 | ルーティング |
| `date-fns` | 4.1 | 日時フォーマット |
| `react-virtuoso` | 4.18 | 仮想スクロール（パフォーマンス最適化） |
| `react-i18next` / `i18next` | 16.5 / 25.8 | 多言語対応（11言語） |
| `material-symbols` | 0.40 | Material Symbols Rounded アイコンフォント |
| `hls.js` | 1.6 | HLS動画再生 |
| `@dnd-kit/core` / `@dnd-kit/sortable` | 6.3 / 10.0 | ドラッグ&ドロップ（フィード並べ替え） |
| `@tauri-apps/plugin-opener` | 2.5 | 外部URL・リンクをシステムブラウザで開く |

### 2.3 Tauri (Rust) プラグイン
| プラグイン | 用途 | 状態 |
|-----------|------|------|
| `tauri-plugin-store` | セッション情報の暗号化永続保存 | ✅ 実装済 |
| `tauri-plugin-opener` | 外部URLをブラウザで開く | ✅ 実装済 |
| `tauri-plugin-notification` | OS通知連携（種別表示対応） | ✅ 実装済 |
| `tauri-plugin-autostart` | OS起動時の自動起動（オプション） | ✅ 実装済 |
| `tauri-plugin-http` | HTTP通信（OGPフェッチ等、CORS回避） | ✅ 実装済 |
| `tauri-plugin-dialog` | ファイル選択ダイアログ | ✅ 実装済 |
| `tauri-plugin-fs` | ファイルシステムアクセス | ✅ 実装済 |
| `tauri-plugin-deep-link` | カスタムURLスキーム（`kazahana://`） | ✅ 実装済 |
| `tauri-plugin-single-instance` | 多重起動防止 | ✅ 実装済 |
| `tauri-plugin-window-state` | ウィンドウサイズ・位置の保存・復元 | ✅ 実装済 |
| `tauri-plugin-log` | デバッグログ | ✅ 実装済 |
| `tauri-plugin-updater` | アプリ自動更新 | 🔲 未実装 |

---

## 3. Bluesky API 仕様

### 3.1 認証
- **方式**: App Password (createSession)
- **エンドポイント**: ユーザーのPDSホスト（デフォルト: `https://bsky.social`）
- **フロー**:
  1. ハンドル + アプリパスワードで `com.atproto.server.createSession` を呼び出し
  2. `accessJwt`（短命）と `refreshJwt`（長命）を取得
  3. セッション情報をTauri Storeで暗号化保存
  4. `accessJwt` 期限切れ時に `com.atproto.server.refreshSession` で更新
  5. アプリ起動時に保存済みセッションからリストア

### 3.2 レート制限（遵守必須）

#### コンテンツ書き込み（アカウント単位）
- **5,000ポイント/時間、35,000ポイント/日**
- CREATE: 3pt / UPDATE: 2pt / DELETE: 1pt

#### HTTP APIリクエスト
| エンドポイント | 制限 | 単位 |
|--------------|------|------|
| 全API共通 | 3,000回/5分 | IP単位 |
| createSession | 30回/5分, 300回/日 | アカウント単位 |

#### 対策
- セッション永続化により createSession 呼び出しを最小化
- HTTP 429 レスポンス時は `ratelimit-reset` / `retry-after` ヘッダーに基づくバックオフ（最大3回リトライ、指数バックオフ）✅ 実装済
- React Query の staleTime / refetchInterval を適切に設定

### 3.3 コンテンツ仕様
| 項目 | 制限 |
|------|------|
| テキスト | 300文字（grapheme単位） |
| 画像 | 最大4枚/投稿, 1MB/枚, JPEG/PNG/WebP |
| 動画 | 最大1本/投稿, 100MB/本, MP4/WebM/MPEG/MOV |
| Blob上限 | 50MB |

---

## 4. 機能要件（MVP）

### 4.1 認証機能
| 機能 | 詳細 | 状態 |
|------|------|------|
| ログイン | ハンドル（例: user.bsky.social）+ アプリパスワード | ✅ |
| PDS自動解決 | ハンドルからPDSホストを自動解決 | ✅ |
| セッション永続化 | Tauri Store で暗号化保存、再起動時に自動復元 | ✅ |
| トークンリフレッシュ | accessJwt期限切れ時に自動更新 | ✅ |
| ログアウト | セッション破棄、保存データクリア | ✅ |

### 4.2 タイムライン
| 機能 | API | 状態 |
|------|-----|------|
| ホームTL表示 | `app.bsky.feed.getTimeline` | ✅ |
| 投稿カード | アバター、表示名、ハンドル、本文、画像、タイムスタンプ | ✅ |
| 仮想スクロール | react-virtuoso + customScrollParent によるメモリ効率化 | ✅ |
| 自動更新 | 設定可能なポーリング間隔（30〜120秒）で新着取得・先頭に追加 | ✅ |
| 既読位置マーカー | 「↓ここまで読んだ↓」帯表示、スクロール位置に基づく読み逃し防止 | ✅ |
| リンクカード | `app.bsky.embed.external` OGPプレビュー表示 | ✅ |
| 引用投稿 | `app.bsky.embed.record` 引用元埋め込み表示 | ✅ |
| リプライ表示 | 返信先のコンテキスト表示（親ポストインライン表示） | ✅ |
| 画像ライトボックス | 画像クリックで拡大表示、ナビゲーション、Alt表示 | ✅ |
| ユーザープロフィールリンク | アバター・名前クリックでプロフィール画面へ遷移 | ✅ |

### 4.3 投稿作成
| 機能 | 詳細 | 状態 |
|------|------|------|
| テキスト投稿 | 300文字制限（grapheme単位、Intl.Segmenter）、リアルタイム文字数カウンター | ✅ |
| 画像添付 | 最大4枚、プレビュー表示、Altテキストダイアログ（画像プレビュー付き） | ✅ |
| 画像ドラッグ&ドロップ / ペースト | ドラッグ&ドロップ・クリップボードペースト対応、自動圧縮（1MB以内） | ✅ |
| 画像編集 | 90°回転、クロップ（フリー/オリジナル/正方形アスペクト比） | ✅ |
| 動画添付 | 最大100MB、MP4/WebM/MPEG/MOV、トランスコード進捗表示、Altテキスト対応 | ✅ |
| ALTテキストAI生成 | Claude Haiku 4.5でALTテキスト自動生成（アプリ言語に応じた言語で生成、APIキー必要） | ✅ |
| リプライ | 返信先投稿を引用表示 | ✅ |
| リッチテキスト入力 | メンション、URL、ハッシュタグの自動検出とファセット生成 | ✅ |
| メンションオートコンプリート | `@` 入力で候補表示、↑↓キーで選択、Enter/Tabで確定 | ✅ |
| OGPリンクカード | URL貼り付けで自動取得、手動トリガー、削除可能 | ✅ |
| スレッドゲート | 返信制限設定（全員/メンション/フォロワー/フォロー中/不可） | ✅ |
| ポストゲート | 引用制限設定（引用を許可しない） | ✅ |
| キーボードショートカット | Alt+Enter で送信、Escape でキャンセル | ✅ |
| 投稿確認 | 送信前プレビュー（オプション） | 🔲 |

### 4.4 インタラクション
| 機能 | API | 状態 |
|------|-----|------|
| いいね | `com.atproto.repo.createRecord` (app.bsky.feed.like) | ✅ |
| いいね取消 | `com.atproto.repo.deleteRecord` | ✅ |
| リポスト | `com.atproto.repo.createRecord` (app.bsky.feed.repost) | ✅ |
| 投稿削除 | `agent.deletePost` (com.atproto.repo.deleteRecord) | ✅ |
| 引用リポスト | 投稿作成 + `app.bsky.embed.record` | ✅ |
| スレッド表示 | `app.bsky.feed.getPostThread` | ✅ |
| ブックマーク | `app.bsky.feed.bookmark` | ✅ |
| スレッドミュート | `app.bsky.feed.threadgate` | ✅ |
| 翻訳 | Google翻訳（外部ブラウザで開く） | ✅ |
| リンクコピー | 投稿URLのクリップボードコピー | ✅ |
| いいね/リポスト/引用一覧 | モーダルでリスト表示 | ✅ |
| 通報 | 投稿/ユーザーの通報（理由選択付き） | ✅ |

### 4.5 通知
| 機能 | API | 状態 |
|------|-----|------|
| 通知一覧 | `app.bsky.notification.listNotifications` | ✅ |
| 未読数 | `app.bsky.notification.getUnreadCount` + タブバッジ | ✅ |
| 既読処理 | `app.bsky.notification.updateSeen` | ✅ |
| OS通知 | Tauri Notification plugin | ✅ |
| リポストへのいいね通知 | `like-via-repost` reason対応（Bluesky設定でON時） | ✅ |
| リポストのリポスト通知 | `repost-via-repost` reason対応（Bluesky設定でON時） | ✅ |
| 認証付与・解除通知 | `verified` / `unverified` reason対応 | ✅ |

### 4.6 プロフィール
| 機能 | API | 状態 |
|------|-----|------|
| プロフィール表示 | `app.bsky.actor.getProfile`（バナー・アバター・自己紹介） | ✅ |
| 認証マーク表示（verified / trusted verifier） | `app.bsky.actor.defs#verificationState` の `verifiedStatus === "valid"` / `trustedVerifierStatus === "valid"` を表示名横にバッジ表示。ProfileHeader / UserListItem / PostCard / NotificationItem に展開 | ✅ |
| ユーザー投稿一覧 | `app.bsky.feed.getAuthorFeed` | ✅ |
| ユーザーリプライ一覧 | `app.bsky.feed.getAuthorFeed` (filter: posts_with_replies) | ✅ |
| いいねした投稿一覧 | `app.bsky.feed.getActorLikes` | ✅ |
| メディア投稿一覧 | `app.bsky.feed.getAuthorFeed` (filter: posts_with_media) | ✅ |
| カスタムフィード一覧 | `app.bsky.feed.getActorFeeds` | ✅ |
| リスト一覧 | `app.bsky.graph.getLists` | ✅ |
| ブックマーク一覧 | 自分のプロフィールのみ表示 | ✅ |
| スターターパック一覧 | `app.bsky.graph.getActorStarterPacks` | ✅ |
| フォロー/フォロワー数表示 | `getProfile` レスポンス内 | ✅ |
| フォロー/解除 | `com.atproto.repo.createRecord` / `deleteRecord` | ✅ |
| フォロワー一覧ページ | `app.bsky.graph.getFollowers`（ページネーション付き） | ✅ |
| フォロー中一覧ページ | `app.bsky.graph.getFollows`（ページネーション付き） | ✅ |
| リプライ先コンテキスト | 親ポストをインラインで表示 | ✅ |
| プロフィール内検索 | テキスト入力でタブ内の投稿を検索（デバウンス300ms） | ✅ |
| ピン留め投稿 | ピン留めされた投稿の表示 | ✅ |
| プロフィールタブ | 投稿/リプライ/いいね/メディア/フィード/リスト/ブックマーク/スターターパック（8タブ） | ✅ |

### 4.7 検索
| 機能 | API | 状態 |
|------|-----|------|
| ユーザー検索 | `app.bsky.actor.searchActors` | ✅ |
| 投稿検索 | `app.bsky.feed.searchPosts` | ✅ |
| プロフィール投稿検索 | `app.bsky.feed.searchPosts` (author パラメータ) | ✅ |
| 検索履歴 | 過去の検索クエリ保存・表示（最大200件、Zustand + localStorage） | ✅ |

### 4.8 コンテンツモデレーション
| 機能 | 詳細 | 状態 |
|------|------|------|
| ラベルベース判定 | `@atproto/api` の `moderatePost` / `moderateProfile` SDK使用 | ✅ |
| 投稿フィルタ | `filter` 判定で投稿をタイムライン・検索・プロフィールから除外 | ✅ |
| 投稿ブラー | `blur` 判定でオーバーレイ表示、「表示する」ボタンで解除可能 | ✅ |
| メディアブラー | 画像のみブラー（投稿テキストは表示） | ✅ |
| noOverride対応 | 強制非表示ラベルでは「表示する」ボタンを非表示 | ✅ |
| 通知フィルタ | ミュート/ブロックユーザーの通知を除外 | ✅ |
| プロフィールブラー | アバター・バナーのモデレーション対応 | ✅ |
| スレッド対応 | フィルタ投稿は折りたたみプレースホルダーで表示 | ✅ |
| 設定: 成人向けトグル | 有効/無効切替（無効時はadultラベル強制非表示） | ✅ |
| 設定: ラベル別設定 | nudity / sexual / porn / graphic-media に対し hide/warn/ignore | ✅ |
| 個別ポスト非表示 | 三点メニューから `agent.hidePost` で非表示、スレッド詳細では「非表示を解除」ボタン付き | ✅ |
| ユーザーブロック | 投稿三点メニュー・プロフィール画面からブロック/ブロック解除（確認ダイアログ付き） | ✅ |
| ユーザー通報 | 投稿三点メニュー・プロフィール画面からユーザーを通報 | ✅ |
| 投稿通報 | 投稿三点メニューから投稿を通報 | ✅ |

### 4.9 ダイレクトメッセージ
| 機能 | API | 状態 |
|------|-----|------|
| 会話一覧 | `chat.bsky.convo.listConvos` | ✅ |
| メッセージ表示 | `chat.bsky.convo.getMessages` | ✅ |
| メッセージ送信 | `chat.bsky.convo.sendMessage` (リッチテキストファセット対応) | ✅ |
| メッセージ削除 | `chat.bsky.convo.deleteMessageForSelf` | ✅ |
| 新規会話作成 | `chat.bsky.convo.getConvoForMembers` | ✅ |
| 既読処理 | `chat.bsky.convo.updateRead` | ✅ |
| 未読バッジ | `listConvos` の `unreadCount` 集計 + タブバッジ | ✅ |
| 会話ミュート/解除 | `chat.bsky.convo.muteConvo` / `unmuteConvo` | ✅ |
| 会話退出 | `chat.bsky.convo.leaveConvo` | ✅ |
| メッセージリクエスト承認 | `chat.bsky.convo.acceptConvo` | ✅ |
| ユーザー検索 (新規DM) | `searchActorsTypeahead` (デバウンス付き) | ✅ |
| 自動更新 | メッセージ: 15秒ポーリング、未読: 30秒ポーリング | ✅ |
| リアクション追加 | `chat.bsky.convo.addReaction` (絵文字クイックピッカー) | ✅ |
| リアクション削除 | `chat.bsky.convo.removeReaction` (トグル操作) | ✅ |

### 4.10 スターターパック
| 機能 | API | 状態 |
|------|-----|------|
| スターターパック詳細 | `app.bsky.graph.getStarterPack` | ✅ |
| スターターパック一覧（プロフィール） | `app.bsky.graph.getActorStarterPacks` | ✅ |

### 4.11 リスト管理
| 機能 | API | 状態 |
|------|-----|------|
| リストフィード閲覧 | `app.bsky.feed.getListFeed` | ✅ |
| リスト所属管理 | `app.bsky.graph.listitem` の作成/削除（モーダルUI） | ✅ |

### 4.12 システム機能
| 機能 | 詳細 | 状態 |
|------|------|------|
| システムトレイ | 最小化時にトレイに常駐。左クリックでウィンドウ復元／最前面配置。右クリックメニュー: Open Window / Minimize / Exit | ✅ |
| 閉じる動作 | ✕ボタンでアプリ終了（デフォルト）またはトレイに最小化（設定で変更可能） | ✅ |
| ウィンドウ状態保存 | 終了時にウィンドウサイズと画面上の配置位置を保存し、次回起動時に復元（tauri-plugin-window-state） | ✅ |
| 自動起動 | OS起動時の自動起動（オプション） | ✅ |
| 多重起動防止 | tauri-plugin-single-instance により2回目の起動は既存ウィンドウを前面に表示 | ✅ |
| ディープリンク | `kazahana://compose?title=...&url=...` でブラウザから投稿作成画面を直接起動 | ✅ |
| フィード表示設定 | ホームタブに表示するフィード・リストの選択（チェックボックス切替、ドラッグ&ドロップ並べ替え） | ✅ |
| クイックジャンプ表示設定 | ドロップダウンに全フィード表示/表示中のみ切替（設定画面チェックボックス） | ✅ |
| テーマ | ライト/ダーク/システム連動 | ✅ |
| 取得タイミング設定 | ポーリング間隔の変更（30〜120秒、デフォルト30秒） | ✅ |
| 動画音量設定 | 0〜100%スライダー | ✅ |
| 画像表示モード | アプリ内ライトボックス / 外部ビューアで開く | ✅ |
| 投稿元表示（via） | 投稿にクライアント名を表示するオン/オフ設定 | ✅ |
| 多言語対応 | 11言語（ja, en, pt, de, zh-TW, zh-CN, fr, ko, es, ru, id）react-i18next + ブラウザ言語自動検出 | ✅ |
| Ko-fi サポート | 設定画面にKo-fiサポートボタン | ✅ |
| Claude APIキー管理 | 設定画面でAPIキー登録/削除、マスク表示、表示/非表示トグル（Zustand + localStorage永続化） | ✅ |
| キーボードショートカット | F5: リロード、N: 新規投稿 | ✅ |
| 右クリックメニュー | コピー、画像保存、リンクを開く等のコンテキストメニュー | ✅ |
| ログイン履歴 | 過去に使用したハンドルを記憶・候補表示 | ✅ |
| カスタムアプリアイコン | 独自デザインのアプリアイコン | ✅ |

---

## 5. UI設計

### 5.1 画面構成

```
┌──────────────────────────────────────────────────┐
│  kazahana                            ⚙  ─ □ ✕  │
├──────────────────────────────────────────────────┤
│  [ home ] [ search ] [ notifications ] [ mail ] [ person ]│
│           (Material Symbols Rounded icons)                 │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │ ↩ reply_to @parent · 1h                 │    │
│  │ [Avatar] DisplayName  @handle    · 2m    │    │
│  │                                          │    │
│  │ 投稿テキストがここに表示されます。         │    │
│  │ @mention や #hashtag はリンク化           │    │
│  │                                          │    │
│  │ ┌────────────┬────────────┐              │    │
│  │ │  画像1      │  画像2      │              │    │
│  │ └────────────┴────────────┘              │    │
│  │                                          │    │
│  │  💬 5    🔁 3    ♡ 12                     │    │
│  │  (chat_bubble_outline, repeat, favorite)  │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│                               [ edit_square ] ← FAB
└──────────────────────────────────────────────────┘
```

### 5.2 アイコン体系
アプリ全体で **Material Symbols Rounded** を使用。`material-symbols` npm パッケージを利用し、`Icon` コンポーネント経由で統一的に描画する。

| 用途 | アイコン名 | filled |
|------|-----------|--------|
| タブ: ホーム | `home` | — |
| タブ: 検索 | `search` | — |
| タブ: 通知 | `notifications` | — |
| タブ: メッセージ | `mail` | — |
| タブ: プロフィール | `person` | — |
| いいね（未） | `favorite_border` | — |
| いいね（済） | `favorite` | ✅ |
| リポスト | `repeat` | — |
| 返信 | `chat_bubble_outline` | — |
| 戻る | `arrow_back` | — |
| 設定 | `settings` | — |
| 投稿FAB | `edit_square` | — |
| 閉じる | `close` | — |
| 前へ | `chevron_left` | — |
| 次へ | `chevron_right` | — |
| リプライバッジ | `reply` | — |
| フォロー通知 | `person_add` | — |

### 5.3 画面一覧
| 画面 | パス | 内容 |
|------|------|------|
| ログイン | `/login` | ハンドル＋パスワード入力（ハンドル履歴付き） |
| ホーム | `/` | ホームタイムライン |
| 検索 | `/search` | ユーザー/投稿検索（検索履歴付き） |
| 通知 | `/notifications` | 通知一覧 |
| 自分のプロフィール | `/profile` | 自分のプロフィール（ブックマークタブ含む） |
| プロフィール | `/profile/:handle` | ユーザープロフィール（8タブ） |
| フォロワー | `/profile/:handle/followers` | フォロワー一覧 |
| フォロー中 | `/profile/:handle/following` | フォロー中一覧 |
| スレッド | `/post/:uri` | スレッド/投稿詳細 |
| スターターパック | `/starter-pack/:uri` | スターターパック詳細 |
| 投稿作成 | モーダル | 新規投稿/リプライ/引用 |
| DM一覧 | `/messages` | 会話一覧 |
| DMスレッド | `/messages/:convoId` | メッセージ送受信（リアクション対応） |
| 新規DM | モーダル | ユーザー検索→会話開始 |
| 設定 | `/settings` | テーマ、言語、モデレーション、サポート等 |
| 非表示の投稿 | `/settings/hidden-posts` | 非表示にした投稿一覧・解除 |
| フィード表示設定 | `/settings/feed-visibility` | 表示するフィード・リストの選択・並べ替え |
| BSAF設定 | `/settings/bsaf` | BSAFボット登録・フィルター設定 |
| Readme | `/settings/readme` | アプリ説明・クレジット |
| ライセンス | `/settings/license` | ライセンス情報 |

### 5.4 デザインガイドライン
- **カラーパレット**:
  - Primary: `#0085FF` (Bluesky Blue)
  - Background Light: `#FFFFFF` / Dark: `#1A1A2E`
  - Text Light: `#1A1A1A` / Dark: `#E8E8E8`
  - Border Light: `#E4E4E4` / Dark: `#2E2E42`
  - Accent: `#0085FF`
- **アイコン**: Material Symbols Rounded（`material-symbols/rounded.css`）
- **フォント**: システムフォント (`font-family: system-ui`)
- **角丸**: カード `8px`、ボタン `6px`、アバター `50%`
- **レスポンシブ**: 最小幅 400px、最大幅 600px（コンテンツエリア）
- **ダークモード**: TailwindCSS `darkMode: "class"`、`html` 要素のクラス切替

---

## 6. プロジェクト構造

```
kazahana/
├── src-tauri/                    # Rust バックエンド
│   ├── src/
│   │   ├── main.rs              # エントリーポイント
│   │   ├── lib.rs               # Tauriセットアップ（プラグイン初期化、ディープリンク、クローズ動作）
│   │   └── tray.rs              # システムトレイ
│   ├── icons/                   # アプリアイコン（カスタム）
│   ├── capabilities/
│   │   └── default.json         # プラグイン権限設定
│   ├── Cargo.toml
│   └── tauri.conf.json          # Tauri設定
│
├── src/                          # React フロントエンド
│   ├── main.tsx                 # エントリーポイント
│   ├── App.tsx                  # ルートコンポーネント + ルーティング + ディープリンクハンドラー
│   │
│   ├── components/              # UIコンポーネント
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx    # メインレイアウト（タブバー + FAB）
│   │   │   ├── TabBar.tsx       # 上部タブナビゲーション（アイコンのみ）
│   │   │   └── index.ts         # レイアウトエクスポート
│   │   ├── timeline/
│   │   │   ├── HomeView.tsx     # ホームフィードアウトレット
│   │   │   ├── TimelineView.tsx # タイムライン全体（仮想スクロール）
│   │   │   ├── FeedView.tsx     # カスタムフィード/リストフィード表示
│   │   │   ├── FeedSelector.tsx # フィードクイックジャンプメニュー
│   │   │   ├── PostCard.tsx     # 投稿カード（親コンテキスト表示・BSAF対応）
│   │   │   ├── PostContent.tsx  # リッチテキスト表示
│   │   │   └── PostActions.tsx  # いいね・リポスト・返信・引用・メニューボタン
│   │   ├── post/
│   │   │   ├── ComposeModal.tsx # 投稿作成モーダル（メンションオートコンプリート付き）
│   │   │   ├── ImageUpload.tsx  # 画像アップロード（ドラッグ&ドロップ・ペースト・自動圧縮）
│   │   │   ├── ImageEditModal.tsx # 画像編集（回転・クロップ）
│   │   │   ├── VideoUpload.tsx  # 動画アップロード（トランスコード進捗付き）
│   │   │   └── AltTextDialog.tsx # ALTテキスト編集ダイアログ（AI生成機能付き）
│   │   ├── thread/
│   │   │   └── ThreadView.tsx   # スレッド表示
│   │   ├── profile/
│   │   │   ├── ProfileView.tsx  # プロフィール画面（8タブ: 投稿/リプライ/いいね/メディア/フィード/リスト/ブックマーク/スターターパック）
│   │   │   ├── ProfileHeader.tsx # プロフィールヘッダー
│   │   │   ├── ProfileDescription.tsx # 自己紹介・リンク表示
│   │   │   ├── FollowersPage.tsx # フォロワー一覧ページ
│   │   │   ├── FollowingPage.tsx # フォロー中一覧ページ
│   │   │   ├── FollowersList.tsx # フォロワーリスト（ページネーション）
│   │   │   ├── FollowingList.tsx # フォロー中リスト（ページネーション）
│   │   │   ├── ActorFeedsList.tsx # ユーザーのカスタムフィード一覧
│   │   │   ├── ActorListsList.tsx # ユーザーのリスト一覧
│   │   │   ├── StarterPacksList.tsx # スターターパック一覧
│   │   │   ├── StarterPackDetailView.tsx # スターターパック詳細
│   │   │   ├── UserListItem.tsx # ユーザーリストアイテム
│   │   │   └── ListMembershipModal.tsx # リスト所属管理モーダル
│   │   ├── notification/
│   │   │   ├── NotificationList.tsx  # 通知一覧（仮想スクロール）
│   │   │   └── NotificationItem.tsx  # 通知アイテム（アクションボタン付き）
│   │   ├── search/
│   │   │   └── SearchView.tsx   # 検索画面（投稿/ユーザータブ・検索履歴）
│   │   ├── auth/
│   │   │   └── LoginForm.tsx    # ログインフォーム（ハンドル履歴付き）
│   │   ├── messages/
│   │   │   ├── DMListView.tsx   # DM会話一覧
│   │   │   ├── DMThreadView.tsx # DMスレッド（メッセージ表示・送信・リアクション）
│   │   │   ├── DMComposeModal.tsx # 新規DM作成モーダル
│   │   │   ├── ConversationItem.tsx # 会話リストアイテム
│   │   │   └── MessageBubble.tsx # メッセージバブル（リアクション表示）
│   │   ├── settings/
│   │   │   ├── SettingsView.tsx # 設定画面（テーマ・ポーリング・通知・音量・モデレーション等）
│   │   │   ├── HiddenPostsView.tsx # 非表示投稿管理
│   │   │   ├── FeedVisibilityView.tsx # フィード表示設定（ドラッグ&ドロップ並べ替え）
│   │   │   ├── BsafBotsView.tsx # BSAFボット登録・フィルター設定
│   │   │   ├── ReadmeView.tsx   # Readme表示
│   │   │   └── LicenseView.tsx  # ライセンス表示
│   │   ├── moderation/
│   │   │   └── ReportModal.tsx  # 通報モーダル（投稿/ユーザー、理由選択）
│   │   └── common/
│   │       ├── Avatar.tsx       # アバター（リプライバッジ対応）
│   │       ├── ContentWarning.tsx # モデレーション警告オーバーレイ
│   │       ├── Icon.tsx         # Material Symbols Rounded アイコン
│   │       ├── ImageGrid.tsx    # 画像グリッド表示
│   │       ├── ImageLightbox.tsx # 画像ライトボックス（キーボード・スワイプ対応）
│   │       ├── VideoPlayer.tsx  # HLS動画プレイヤー（音量コントロール付き）
│   │       ├── LinkCard.tsx     # OGPリンクカードプレビュー
│   │       ├── QuoteEmbed.tsx   # 引用投稿埋め込み表示
│   │       ├── ConfirmDialog.tsx # 確認ダイアログモーダル
│   │       ├── ContextMenu.tsx  # 右クリックコンテキストメニュー
│   │       ├── PostListModal.tsx # 投稿リストモーダル（いいね/リポスト/引用一覧）
│   │       └── LoadingSpinner.tsx # ローディング表示
│   │
│   ├── hooks/                   # カスタムフック
│   │   ├── useTimeline.ts       # タイムライン取得（既読位置・プリペンド管理）
│   │   ├── useFeed.ts           # カスタムフィード取得
│   │   ├── useMyFeeds.ts        # 保存済みフィード・リスト取得
│   │   ├── useNotifications.ts  # 通知取得・未読カウント
│   │   ├── useProfile.ts        # プロフィール・著者フィード・リプライ・いいね・メディア・フィード・リスト・ブックマーク・スターターパック
│   │   ├── usePost.ts           # 投稿作成（テキスト・画像・動画・引用・リプライ）/いいね/リポスト
│   │   ├── usePostLists.ts      # いいね/リポスト/引用一覧取得
│   │   ├── useThread.ts         # スレッド取得
│   │   ├── useSearch.ts         # 検索（投稿・ユーザー・タイプアヘッド）
│   │   ├── useModeration.ts     # モデレーション設定取得
│   │   ├── useOgp.ts            # OGPメタデータ取得
│   │   ├── useConversations.ts  # DM会話一覧取得
│   │   ├── useMessages.ts       # DMメッセージ取得・送信・削除
│   │   ├── useUnreadDMs.ts      # DM未読数ポーリング
│   │   └── useBsafDuplicates.ts # BSAF重複投稿検出
│   │
│   ├── contexts/                # React Context
│   │   └── ModerationContext.tsx # モデレーション設定配布
│   │
│   ├── stores/                  # 状態管理 (Zustand)
│   │   ├── authStore.ts         # 認証状態（ログイン・ログアウト・プロフィール）
│   │   ├── composeStore.ts      # 投稿作成状態（リプライ先・引用先・初期テキスト）
│   │   ├── settingsStore.ts     # アプリ設定（テーマ、ポーリング間隔、通知、音量、via、閉じる動作、画像モード、Claude APIキー）
│   │   ├── feedStore.ts         # フィード選択・非表示・並び順・クイックジャンプ設定
│   │   ├── bsafStore.ts         # BSAF有効/無効・登録ボット・フィルター設定
│   │   ├── lightboxStore.ts     # 画像ライトボックス状態
│   │   ├── postListStore.ts     # 投稿リストモーダル状態（いいね/リポスト/引用）
│   │   ├── reportStore.ts       # 通報モーダル状態
│   │   ├── searchHistoryStore.ts # 検索履歴（最大200件）
│   │   ├── listManagementStore.ts # リスト所属管理モーダル状態
│   │   └── dmComposeStore.ts    # 新規DM作成モーダル状態
│   │
│   ├── lib/                     # ユーティリティ
│   │   ├── agent.ts             # BskyAgent設定・管理（セッションハンドラー）
│   │   ├── chatAgent.ts         # Chat API用プロキシエージェント
│   │   ├── richtext.ts          # リッチテキストヘルパー
│   │   ├── ogp.ts               # OGPメタデータ取得・パース
│   │   ├── notifications.ts     # OS デスクトップ通知送信（種別対応）
│   │   ├── rateLimit.ts         # レート制限検出・リトライ遅延ユーティリティ
│   │   ├── session.ts           # セッション永続化（Tauri Store暗号化）
│   │   ├── bsaf.ts              # BSAFバリデーション・パース・フィルタリング・重複検出
│   │   ├── bsafUpdater.ts       # BSAF Bot Definition自動更新チェック
│   │   ├── claudeApi.ts         # Claude API ヘルパー（ALTテキスト生成）
│   │   └── constants.ts         # 定数定義
│   │
│   ├── types/                   # 型定義
│   │   └── bsaf.ts              # BSAF TypeScriptインターフェース
│   │
│   ├── i18n/                    # 多言語対応
│   │   ├── index.ts             # i18next 設定（ブラウザ言語自動検出）
│   │   └── locales/
│   │       ├── ja.json          # 日本語
│   │       ├── en.json          # 英語
│   │       ├── de.json          # ドイツ語
│   │       ├── es.json          # スペイン語
│   │       ├── fr.json          # フランス語
│   │       ├── id.json          # インドネシア語
│   │       ├── ko.json          # 韓国語
│   │       ├── pt.json          # ポルトガル語
│   │       ├── ru.json          # ロシア語
│   │       ├── zh-CN.json       # 簡体字中国語
│   │       └── zh-TW.json       # 繁体字中国語
│   │
│   ├── vite-env.d.ts             # __APP_VERSION__ 型定義
│   │
│   └── styles/
│       └── globals.css          # TailwindCSS base + Material Symbols import
│
├── docs/                         # 公式ドキュメント（多言語）
│   ├── en/                      # 英語マニュアル
│   └── ja/                      # 日本語マニュアル
│
├── design/                       # 内部設計資料
│   ├── kazahana-spec.md         # この仕様書
│   └── remaining-work.md        # タスク管理
│
├── .github/
│   └── workflows/
│       └── release.yml          # CI/CD（タグプッシュでビルド＆リリースドラフト）
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── tailwind.config.js
├── postcss.config.js
├── README.md                    # 英語README
└── README.ja.md                 # 日本語README
```

---

## 7. 実装優先順位と進捗

### Phase 1: 基盤構築 ✅ 完了
1. Tauri + React + Vite プロジェクト初期化
2. TailwindCSS + 基本レイアウト（AppLayout, TabBar）
3. 認証機能（ログイン、セッション永続化、自動リフレッシュ）
4. 多言語対応（react-i18next: 日本語/英語）
5. カスタムアプリアイコン

### Phase 2: コア機能 ✅ 完了
| 項目 | 状態 |
|------|------|
| タイムライン表示（PostCard） | ✅ |
| 投稿カードのリッチテキスト表示（メンション、リンク、ハッシュタグ） | ✅ |
| 画像表示（ImageGrid） | ✅ |
| 画像ライトボックス（ナビゲーション、Alt表示） | ✅ |
| 動画再生（HLS.js、音量コントロール） | ✅ |
| インタラクション（いいね、リポスト、ブックマーク） | ✅ |
| リプライ先コンテキスト表示 | ✅ |
| ユーザープロフィールへのリンク（アバター・名前クリック） | ✅ |
| 仮想スクロール（react-virtuoso + customScrollParent） | ✅ |
| 自動更新（ポーリング、設定可能な間隔） | ✅ |
| 既読位置マーカー（読み逃し防止） | ✅ |
| リンクカード（OGPプレビュー） | ✅ |
| 引用投稿の埋め込み表示 | ✅ |
| カスタムフィード・リストフィード表示 | ✅ |
| フィードクイックジャンプメニュー | ✅ |

### Phase 3: 投稿・通知 ✅ 完了
| 項目 | 状態 |
|------|------|
| 投稿作成（ComposeModal） | ✅ |
| 画像添付（Alt テキスト・ドラッグ&ドロップ・ペースト・自動圧縮対応） | ✅ |
| 画像編集（回転・クロップ） | ✅ |
| 動画添付（トランスコード進捗表示・Altテキスト対応） | ✅ |
| リプライ機能 | ✅ |
| 引用リポスト | ✅ |
| メンションオートコンプリート | ✅ |
| OGPリンクカード自動取得 | ✅ |
| スレッドゲート・ポストゲート | ✅ |
| スレッド表示 | ✅ |
| 通知一覧 + 未読バッジ | ✅ |
| リッチテキスト入力（ファセット自動生成） | ✅ |
| ALTテキストAI生成（Claude API） | ✅ |

### Phase 4: プロフィール・検索・仕上げ ✅ 完了
| 項目 | 状態 |
|------|------|
| プロフィール画面（8タブ: 投稿/リプライ/いいね/メディア/フィード/リスト/ブックマーク/スターターパック） | ✅ |
| フォロー/アンフォロー | ✅ |
| フォロワー/フォロー中一覧ページ | ✅ |
| プロフィール内検索 | ✅ |
| スターターパック閲覧 | ✅ |
| リスト所属管理 | ✅ |
| 検索機能（投稿/ユーザー・検索履歴） | ✅ |
| システムトレイ | ✅ |
| 多重起動防止 | ✅ |
| ディープリンク（kazahana://compose） | ✅ |
| ダーク/ライトテーマ | ✅ |
| 設定画面（テーマ・ポーリング・通知・音量・via・閉じる動作・画像モード・Claude APIキー・モデレーション・言語） | ✅ |
| Material Symbols Rounded アイコン統一 | ✅ |
| Ko-fi サポートボタン | ✅ |
| コンテンツモデレーション（ラベル判定、フィルタ、ブラー、設定UI） | ✅ |
| 通報機能（投稿/ユーザー） | ✅ |
| OS通知（種別表示対応: いいね/リポスト/返信/メンション/フォロー/引用/リポストへのいいね/リポストのリポスト） | ✅ |
| 自動起動 | ✅ |
| ウィンドウ状態保存・復元 | ✅ |
| キーボードショートカット（F5/N） | ✅ |
| 右クリックコンテキストメニュー | ✅ |
| 翻訳（Google翻訳連携） | ✅ |
| いいね/リポスト/引用一覧モーダル | ✅ |

### Phase 5: BSAF 対応クライアント ✅ 完了
| 項目 | 状態 |
|------|------|
| BSAF マスタートグル（設定画面） | ✅ |
| Bot Definition JSON パーサー & バリデーター | ✅ |
| Bot 登録（URL 入力 / ファイル読み込み） | ✅ |
| Bot 登録解除 + 自動アンフォロー | ✅ |
| 動的フィルタ UI 生成（アコーディオン展開） | ✅ |
| タイムライン BSAF フィルタリング | ✅ |
| 重複投稿検出 & 折りたたみ（登録 Bot 限定） | ✅ |
| 深刻度カラーボーダー表示（BSAF投稿の左ボーダー、登録 Bot 限定） | ✅ |
| BSAFタグ表示（投稿本文下にタグバッジ、登録 Bot 限定） | ✅ |
| Bot Definition JSON 自動更新チェック | ✅ |
| 11 言語 i18n 対応 | ✅ |

### Phase 6: DM・メッセージ ✅ 完了
| 項目 | 状態 |
|------|------|
| 会話一覧 | ✅ |
| メッセージ送受信 | ✅ |
| メッセージ削除 | ✅ |
| リアクション（絵文字クイックピッカー） | ✅ |
| 新規会話作成 | ✅ |
| 会話ミュート/退出 | ✅ |
| メッセージリクエスト承認 | ✅ |
| 未読バッジ | ✅ |
| 自動更新ポーリング | ✅ |

---

## 8. セッション管理の詳細設計

```
┌─ アプリ起動 ─┐
│              │
▼              │
保存済みセッション   │
あり?          │
├─ Yes ───────┤
│  refreshSession │
│  ├─ 成功 → ホーム画面へ
│  └─ 失敗 → ログイン画面へ
├─ No ────────┤
│  ログイン画面表示
│  createSession
│  ├─ 成功 → セッション保存 → ホーム画面へ
│  └─ 失敗 → エラー表示
└──────────────┘

┌─ API呼び出し時 ─┐
│  accessJwt付きリクエスト
│  ├─ 200 → 正常処理
│  ├─ 401 → refreshSession → リトライ
│  │          └─ 失敗 → ログイン画面へ
│  ├─ 429 → ratelimit-reset まで待機 → リトライ
│  └─ その他 → エラーハンドリング
└─────────────────┘
```

---

## 9. ビルド・配布

### 9.1 開発
```bash
# 開発サーバー起動
npm run tauri dev
```

### 9.2 プロダクションビルド
```bash
# Windows (.exe / .msi)
npm run tauri build

# macOS (.app / .dmg) — macOS環境で実行
npm run tauri build
```

**v1.0.0 ビルド成果物（Windows x64）:**
- `kazahana_1.0.0_x64-setup.exe` (NSIS インストーラー, ~9.4 MB)
- `kazahana_1.0.0_x64_en-US.msi` (MSI インストーラー, ~12 MB)

### 9.3 CI/CD ✅

- GitHub Actions で Windows / macOS 両ビルドを自動化（`.github/workflows/release.yml`）
- `tauri-apps/tauri-action@v0` によるクロスプラットフォームビルド
- バージョンタグ push（`v*`）でドラフトリリース自動作成
- ビルドマトリクス: Windows x64 / macOS universal
- GitHub Releases で配布

---

## 10. 参考リンク

| リソース | URL |
|---------|-----|
| Bluesky公式ドキュメント | https://docs.bsky.app/ |
| AT Protocol仕様 | https://atproto.com/ |
| Bluesky API リファレンス | https://docs.bsky.app/docs/api/at-protocol-xrpc-api |
| レート制限 | https://docs.bsky.app/docs/advanced-guides/rate-limits |
| @atproto/api (npm) | https://www.npmjs.com/package/@atproto/api |
| Tauri v2 ドキュメント | https://v2.tauri.app/ |
| Material Symbols | https://fonts.google.com/icons |
| クライアントアプリテンプレート | https://docs.bsky.app/docs/starter-templates/clients |
| OAuth実装ガイド | https://docs.bsky.app/docs/advanced-guides/oauth-client |
| Jetstream (リアルタイム) | https://docs.bsky.app/blog/jetstream |
