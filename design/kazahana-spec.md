# Kazahana— Bluesky Desktop Client 仕様書

**バージョン**: 1.3
**作成日**: 2025-02-21
**最終更新**: 2026-02-22
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
- ブロック管理、ミュートワード設定、プロフィール編集、リスト管理など**設定・管理系の操作**は[Blueskyウェブ版](https://bsky.app/)で行う前提とする
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

**Blueskyウェブ版に委ねる領域:**
- アカウント管理（プロフィール編集、ハンドル変更、メールアドレス変更、アカウント削除）
- ブロック/ミュートの個別管理（ユーザーブロック一覧、ミュートワード設定）
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
| `react-i18next` / `i18next` | 16.5 / 25.8 | 多言語対応（日本語・英語） |
| `material-symbols` | 0.40 | Material Symbols Rounded アイコンフォント |
| `@tauri-apps/plugin-opener` | 2.5 | 外部URL・リンクをシステムブラウザで開く |

### 2.3 Tauri (Rust) プラグイン
| プラグイン | 用途 | 状態 |
|-----------|------|------|
| `tauri-plugin-store` | セッション情報の暗号化永続保存 | ✅ 実装済 |
| `@tauri-apps/plugin-opener` | 外部URLをブラウザで開く | ✅ 実装済 |
| `tauri-plugin-notification` | OS通知連携（種別表示対応） | ✅ 実装済 |
| `tauri-plugin-autostart` | OS起動時の自動起動（オプション） | ✅ 実装済 |
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
| 自動更新 | 設定可能なポーリング間隔（20〜120秒）で新着取得・先頭に追加 | ✅ |
| 既読位置マーカー | 「↓ここまで読んだ↓」帯表示、スクロール位置に基づく読み逃し防止 | ✅ |
| リンクカード | `app.bsky.embed.external` OGPプレビュー表示 | ✅ |
| 引用投稿 | `app.bsky.embed.record` 引用元埋め込み表示 | 🔲 |
| リプライ表示 | 返信先のコンテキスト表示（親ポストインライン表示） | ✅ |
| 画像ライトボックス | 画像クリックで拡大表示、ナビゲーション、Alt表示 | ✅ |
| ユーザープロフィールリンク | アバター・名前クリックでプロフィール画面へ遷移 | ✅ |

### 4.3 投稿作成
| 機能 | 詳細 | 状態 |
|------|------|------|
| テキスト投稿 | 300文字制限、リアルタイム文字数カウンター | ✅ |
| 画像添付 | 最大4枚、プレビュー表示、Alt テキスト入力対応 | ✅ |
| リプライ | 返信先投稿を引用表示 | ✅ |
| リッチテキスト入力 | メンション、URL、ハッシュタグの自動検出とファセット生成 | 🔲 |
| スレッドゲート | 返信制限設定（全員/メンション/フォロワー/フォロー中/不可） | ✅ |
| ポストゲート | 引用制限設定（引用を許可しない） | ✅ |
| 投稿確認 | 送信前プレビュー（オプション） | 🔲 |

### 4.4 インタラクション
| 機能 | API | 状態 |
|------|-----|------|
| いいね | `com.atproto.repo.createRecord` (app.bsky.feed.like) | ✅ |
| いいね取消 | `com.atproto.repo.deleteRecord` | ✅ |
| リポスト | `com.atproto.repo.createRecord` (app.bsky.feed.repost) | ✅ |
| 投稿削除 | `agent.deletePost` (com.atproto.repo.deleteRecord) | ✅ |
| 引用リポスト | 投稿作成 + `app.bsky.embed.record` | 🔲 |
| スレッド表示 | `app.bsky.feed.getPostThread` | ✅ |

### 4.5 通知
| 機能 | API | 状態 |
|------|-----|------|
| 通知一覧 | `app.bsky.notification.listNotifications` | ✅ |
| 未読数 | `app.bsky.notification.getUnreadCount` + タブバッジ | ✅ |
| 既読処理 | `app.bsky.notification.updateSeen` | ✅ |
| OS通知 | Tauri Notification plugin | 🔲 |

### 4.6 プロフィール
| 機能 | API | 状態 |
|------|-----|------|
| プロフィール表示 | `app.bsky.actor.getProfile` | ✅ |
| ユーザー投稿一覧 | `app.bsky.feed.getAuthorFeed` | ✅ |
| いいねした投稿一覧 | `app.bsky.feed.getActorLikes` | ✅ |
| メディア投稿一覧 | `app.bsky.feed.getAuthorFeed` (filter: posts_with_media) | ✅ |
| フォロー/フォロワー数表示 | `getProfile` レスポンス内 | ✅ |
| フォロー/解除 | `com.atproto.repo.createRecord` / `deleteRecord` | ✅ |
| リプライ先コンテキスト | 親ポストをインラインで表示 | ✅ |

### 4.7 検索
| 機能 | API | 状態 |
|------|-----|------|
| ユーザー検索 | `app.bsky.actor.searchActors` | ✅ |
| 投稿検索 | `app.bsky.feed.searchPosts` | ✅ |

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

### 4.9 システム機能
| 機能 | 詳細 | 状態 |
|------|------|------|
| システムトレイ | 最小化時にトレイに常駐、未読バッジ | ✅ |
| 閉じる動作 | ✕ボタンでトレイに最小化（設定で変更可能） | ✅ |
| 自動起動 | OS起動時の自動起動（オプション） | ✅ |
| テーマ | ライト/ダーク/システム連動 | ✅ |
| 取得タイミング設定 | ポーリング間隔の変更（20〜120秒、デフォルト30秒） | ✅ |
| 多言語対応 | 日本語/英語（react-i18next） | ✅ |
| Ko-fi サポート | 設定画面にKo-fiサポートボタン | ✅ |
| カスタムアプリアイコン | 独自デザインのアプリアイコン | ✅ |

---

## 5. UI設計

### 5.1 画面構成

```
┌──────────────────────────────────────────────────┐
│  kazahana                            ⚙  ─ □ ✕  │
├──────────────────────────────────────────────────┤
│  [ home ] [ search ] [ notifications ] [ person ]│
│           (Material Symbols Rounded icons)        │
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
| ログイン | `/login` | ハンドル＋パスワード入力 |
| ホーム | `/` | ホームタイムライン |
| 検索 | `/search` | ユーザー/投稿検索 |
| 通知 | `/notifications` | 通知一覧 |
| プロフィール | `/profile/:handle` | ユーザープロフィール |
| スレッド | `/thread/:uri` | スレッド/投稿詳細 |
| 投稿作成 | モーダル | 新規投稿/リプライ |
| 設定 | `/settings` | テーマ、言語、サポート等 |
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
│   │   ├── lib.rs               # Tauriセットアップ
│   │   └── tray.rs              # システムトレイ
│   ├── icons/                   # アプリアイコン（カスタム）
│   ├── capabilities/
│   │   └── default.json         # プラグイン権限設定
│   ├── Cargo.toml
│   └── tauri.conf.json          # Tauri設定
│
├── src/                          # React フロントエンド
│   ├── main.tsx                 # エントリーポイント
│   ├── App.tsx                  # ルートコンポーネント + ルーティング
│   │
│   ├── components/              # UIコンポーネント
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx    # メインレイアウト（タブバー + FAB）
│   │   │   ├── TabBar.tsx       # 上部タブナビゲーション（アイコンのみ）
│   │   │   └── index.ts         # レイアウトエクスポート
│   │   ├── timeline/
│   │   │   ├── TimelineView.tsx # タイムライン全体
│   │   │   ├── PostCard.tsx     # 投稿カード（親コンテキスト表示対応）
│   │   │   ├── PostContent.tsx  # リッチテキスト表示
│   │   │   └── PostActions.tsx  # いいね・リポスト・返信ボタン
│   │   ├── post/
│   │   │   ├── ComposeModal.tsx # 投稿作成モーダル
│   │   │   └── ImageUpload.tsx  # 画像アップロード（Alt対応）
│   │   ├── thread/
│   │   │   └── ThreadView.tsx   # スレッド表示
│   │   ├── profile/
│   │   │   ├── ProfileView.tsx  # プロフィール画面
│   │   │   └── ProfileHeader.tsx # プロフィールヘッダー
│   │   ├── notification/
│   │   │   ├── NotificationList.tsx  # 通知一覧
│   │   │   └── NotificationItem.tsx  # 通知アイテム
│   │   ├── search/
│   │   │   └── SearchView.tsx   # 検索画面
│   │   ├── auth/
│   │   │   └── LoginForm.tsx    # ログインフォーム
│   │   ├── settings/
│   │   │   ├── SettingsView.tsx # 設定画面
│   │   │   ├── ReadmeView.tsx   # Readme表示
│   │   │   └── LicenseView.tsx  # ライセンス表示
│   │   └── common/
│   │       ├── Avatar.tsx       # アバター（リプライバッジ対応）
│   │       ├── ContentWarning.tsx # モデレーション警告オーバーレイ
│   │       ├── Icon.tsx         # Material Symbols Rounded アイコン
│   │       ├── ImageGrid.tsx    # 画像グリッド表示
│   │       ├── ImageLightbox.tsx # 画像ライトボックス
│   │       └── LoadingSpinner.tsx # ローディング表示
│   │
│   ├── hooks/                   # カスタムフック
│   │   ├── useTimeline.ts       # タイムライン取得
│   │   ├── useNotifications.ts  # 通知取得・未読カウント
│   │   ├── useProfile.ts        # プロフィール取得
│   │   ├── usePost.ts           # 投稿作成/いいね/リポスト
│   │   ├── useThread.ts         # スレッド取得
│   │   ├── useSearch.ts         # 検索
│   │   └── useModeration.ts     # モデレーション設定取得
│   │
│   │
│   ├── contexts/                # React Context
│   │   └── ModerationContext.tsx # モデレーション設定配布
│   │
│   ├── stores/                  # 状態管理 (Zustand)
│   │   ├── authStore.ts         # 認証状態
│   │   ├── composeStore.ts      # 投稿作成状態
│   │   ├── settingsStore.ts     # アプリ設定（テーマ、取得タイミング、言語等）
│   │   └── lightboxStore.ts     # 画像ライトボックス状態
│   │
│   ├── lib/                     # ユーティリティ
│   │   ├── agent.ts             # BskyAgent設定・管理
│   │   ├── richtext.ts          # リッチテキストヘルパー
│   │   ├── notifications.ts     # OS デスクトップ通知送信（種別対応）
│   │   ├── rateLimit.ts         # レート制限検出・リトライ遅延ユーティリティ
│   │   ├── session.ts           # セッション永続化
│   │   └── constants.ts         # 定数定義
│   │
│   ├── i18n/                    # 多言語対応
│   │   ├── index.ts             # i18next 設定
│   │   └── locales/
│   │       ├── ja.json          # 日本語翻訳
│   │       └── en.json          # 英語翻訳
│   │
│   └── styles/
│       └── globals.css          # TailwindCSS base + Material Symbols import
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── kazahana-spec.md             # この仕様書
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

### Phase 2: コア機能 (一部完了)
| 項目 | 状態 |
|------|------|
| タイムライン表示（PostCard） | ✅ |
| 投稿カードのリッチテキスト表示（メンション、リンク、ハッシュタグ） | ✅ |
| 画像表示（ImageGrid） | ✅ |
| 画像ライトボックス（ナビゲーション、Alt表示） | ✅ |
| インタラクション（いいね、リポスト） | ✅ |
| リプライ先コンテキスト表示 | ✅ |
| ユーザープロフィールへのリンク（アバター・名前クリック） | ✅ |
| 仮想スクロール（react-virtuoso + customScrollParent） | ✅ |
| 自動更新（ポーリング、設定可能な間隔） | ✅ |
| 既読位置マーカー（読み逃し防止） | ✅ |
| リンクカード（OGPプレビュー） | ✅ |
| 引用投稿の埋め込み表示 | 🔲 |

### Phase 3: 投稿・通知 (一部完了)
| 項目 | 状態 |
|------|------|
| 投稿作成（ComposeModal） | ✅ |
| 画像添付（Alt テキスト対応） | ✅ |
| リプライ機能 | ✅ |
| スレッド表示 | ✅ |
| 通知一覧 + 未読バッジ | ✅ |
| リッチテキスト入力（ファセット自動生成） | 🔲 |

### Phase 4: プロフィール・検索・仕上げ (一部完了)
| 項目 | 状態 |
|------|------|
| プロフィール画面 | ✅ |
| フォロー/アンフォロー | ✅ |
| 検索機能 | ✅ |
| システムトレイ | ✅ |
| ダーク/ライトテーマ | ✅ |
| 設定画面 | ✅ |
| Material Symbols Rounded アイコン統一 | ✅ |
| Ko-fi サポートボタン | ✅ |
| コンテンツモデレーション（ラベル判定、フィルタ、ブラー、設定UI） | ✅ |
| OS通知（種別表示対応: いいね/リポスト/返信/メンション/フォロー/引用） | ✅ |
| 自動起動 | ✅ |

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

### 9.3 CI/CD（将来）
- GitHub Actions で Windows / macOS 両ビルドを自動化
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
