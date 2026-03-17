# Kazahana Mobile — iOS / Android ネイティブクライアント仕様書

**バージョン**: 1.0
**作成日**: 2026-03-18
**ベースライン**: kazahana デスクトップ版 v2.0 仕様書

---

## 1. プロジェクト概要

### 1.1 目的

kazahana デスクトップ版（Tauri v2）のコンセプト・UX・機能仕様をモバイルプラットフォームに展開する。コードの流用は行わず、各プラットフォームのネイティブ技術で一から構築する。

### 1.2 コンセプト（デスクトップ版から継承）

- **軽量**: OS標準コンポーネントを最大活用し、メモリ消費を最小化
- **高速**: ネイティブアプリならではの起動速度とレスポンス
- **シンプル**: 必要十分な機能に絞った、日常利用に特化したクライアント

### 1.3 設計思想 — 軽快な常駐アプリ（継承）

kazahana は全機能を網羅するスタンドアロンアプリではなく、**軽快に日常利用する閲覧・投稿特化クライアント**。

**kazahana が担う領域:**
- タイムライン・カスタムフィード・リストフィードの閲覧
- 投稿・返信・引用・画像/動画添付・スレッド作成
- いいね・リポスト・ブックマーク
- 通知確認
- ユーザー検索・投稿検索
- プロフィール閲覧・フォロー/フォロー解除
- コンテンツモデレーション
- ダイレクトメッセージ
- 投稿削除・通報・スレッドゲート・ポストゲート

**Bluesky ウェブ版に委ねる領域:**
- アカウント管理（プロフィール編集、ハンドル変更等）
- ブロック/ミュートの個別管理
- リスト作成・編集・メンバー管理
- フィードジェネレーターの作成・管理
- スターターパック作成
- 外部ラベラーの購読管理
- アプリパスワード管理

### 1.4 アプリ名・識別子

| 項目 | 値 |
|------|-----|
| 日本語名 | kazahana |
| 英語名 | Kazahana |
| パッケージID (共通) | com.kazahana.app |
| iOS Bundle ID | com.kazahana.app |
| Android Application ID | com.kazahana.app |

---

## 2. ターゲットプラットフォーム・技術スタック

### 2.1 iOS版

| 項目 | 選定 |
|------|------|
| IDE | Xcode |
| 言語 | Swift |
| UIフレームワーク | SwiftUI |
| 最低対応OS | iOS 17.0 |
| ネットワーク | URLSession / async-await |
| データ永続化 | SwiftData or Keychain（認証情報） |
| 画像キャッシュ | Kingfisher or Nuke |
| 状態管理 | @Observable (Observation framework) |
| 動画再生 | AVPlayer (HLS ネイティブ対応) |
| プッシュ通知 | APNs (将来検討) / ローカル通知 (ポーリングベース) |

### 2.2 Android版

| 項目 | 選定 |
|------|------|
| IDE | Android Studio |
| 言語 | Kotlin |
| UIフレームワーク | Jetpack Compose |
| 最低対応OS | Android 10 (API 29) |
| ネットワーク | Ktor Client or OkHttp + Retrofit |
| データ永続化 | DataStore (設定) / EncryptedSharedPreferences (認証情報) |
| 画像キャッシュ | Coil |
| 状態管理 | ViewModel + StateFlow / Compose State |
| 動画再生 | Media3 ExoPlayer (HLS ネイティブ対応) |
| プッシュ通知 | FCM (将来検討) / WorkManager (ポーリングベース) |
| DI | Hilt or Koin |

### 2.3 共通 — AT Protocol / Bluesky API

両プラットフォーム共通で、Bluesky AT Protocol の HTTP API を直接利用する。公式モバイルSDKは存在しないため、API クライアント層を自作する。

**参考リソース:**
| リソース | URL |
|---------|-----|
| Bluesky公式ドキュメント | https://docs.bsky.app/ |
| AT Protocol仕様 | https://atproto.com/ |
| Bluesky API リファレンス | https://docs.bsky.app/docs/api/at-protocol-xrpc-api |
| レート制限 | https://docs.bsky.app/docs/advanced-guides/rate-limits |
| クライアントアプリテンプレート | https://docs.bsky.app/docs/starter-templates/clients |

---

## 3. Bluesky API 仕様（デスクトップ版から継承）

### 3.1 認証

- **方式**: App Password (`com.atproto.server.createSession`)
- **エンドポイント**: ユーザーのPDSホスト（デフォルト: `https://bsky.social`）
- **フロー**:
  1. ハンドル + アプリパスワードで `createSession` を呼び出し
  2. `accessJwt`（短命）と `refreshJwt`（長命）を取得
  3. セッション情報をセキュアストレージに暗号化保存
     - iOS: Keychain
     - Android: EncryptedSharedPreferences
  4. `accessJwt` 期限切れ時に `refreshSession` で更新
  5. アプリ起動時に保存済みセッションからリストア

> **将来検討**: OAuth 2.0 (PKCE) への移行。Bluesky が OAuth をサポート拡大した場合、App Password からの切り替えを検討する。

### 3.2 レート制限（デスクトップ版と同一、遵守必須）

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
- HTTP 429 レスポンス時は `ratelimit-reset` / `retry-after` ヘッダーに基づくバックオフ（最大3回リトライ、指数バックオフ）
- モバイルではバッテリー消費も考慮し、バックグラウンド時のポーリング頻度を下げる

### 3.3 コンテンツ仕様
| 項目 | 制限 |
|------|------|
| テキスト | 300文字（grapheme単位） |
| 画像 | 最大4枚/投稿, 1MB/枚, JPEG/PNG/WebP |
| 動画 | 最大1本/投稿, 100MB/本, MP4/WebM/MPEG/MOV |
| Blob上限 | 50MB |

---

## 4. 機能要件

### 4.1 Phase 1: 基盤構築（MVP）

| 機能 | 詳細 | デスクトップ対応 |
|------|------|-----------------|
| ログイン | ハンドル + アプリパスワード、PDS自動解決 | ✅ |
| セッション永続化 | セキュアストレージで暗号化保存、再起動時に自動復元 | ✅ |
| トークンリフレッシュ | accessJwt期限切れ時に自動更新 | ✅ |
| ログアウト | セッション破棄、保存データクリア | ✅ |
| ホームタイムライン | `app.bsky.feed.getTimeline` | ✅ |
| 投稿カード | アバター、表示名、ハンドル、本文、画像、タイムスタンプ | ✅ |
| Pull-to-Refresh | 引っ張って更新（モバイル標準UX） | — (モバイル新規) |
| 無限スクロール | ページネーション（cursor ベース） | ✅ (仮想スクロール) |

### 4.2 Phase 2: コア機能

| 機能 | 詳細 | デスクトップ対応 |
|------|------|-----------------|
| いいね / リポスト / ブックマーク | インタラクション | ✅ |
| 投稿作成 | テキスト、画像添付、Altテキスト | ✅ |
| リプライ | 返信先投稿引用表示 | ✅ |
| 引用リポスト | 投稿作成 + embed.record | ✅ |
| リッチテキスト | メンション、URL、ハッシュタグ検出・ファセット生成 | ✅ |
| 画像表示 | グリッド表示、タップで拡大 | ✅ |
| 動画再生 | HLS再生、音量コントロール | ✅ |
| リンクカード | OGPプレビュー | ✅ |
| スレッド表示 | `getPostThread` | ✅ |

### 4.3 Phase 3: 通知・プロフィール・検索

| 機能 | 詳細 | デスクトップ対応 |
|------|------|-----------------|
| 通知一覧 | `listNotifications` + 未読バッジ | ✅ |
| プッシュ通知 / ローカル通知 | バックグラウンドポーリング | ✅ (OS通知) |
| プロフィール表示 | バナー・アバター・自己紹介・タブ | ✅ (8タブ) |
| フォロー / フォロー解除 | createRecord / deleteRecord | ✅ |
| 検索 | 投稿検索 / ユーザー検索 | ✅ |
| カスタムフィード | フィードタブ切り替え | ✅ |

### 4.4 Phase 4: DM・モデレーション・設定

| 機能 | 詳細 | デスクトップ対応 |
|------|------|-----------------|
| ダイレクトメッセージ | 会話一覧、送受信、リアクション | ✅ |
| コンテンツモデレーション | ラベル判定、フィルタ、ブラー | ✅ |
| 通報 | 投稿/ユーザーの通報 | ✅ |
| テーマ | ライト / ダーク / システム連動 | ✅ |
| 多言語対応 | 11言語（デスクトップ版の翻訳リソース流用可） | ✅ |
| 設定画面 | テーマ、ポーリング間隔、モデレーション設定等 | ✅ |

### 4.5 Phase 5: BSAF対応・高度な機能

| 機能 | 詳細 | デスクトップ対応 |
|------|------|-----------------|
| BSAF対応 | Bot登録、フィルタリング、深刻度カラーボーダー | ✅ |
| スレッドゲート / ポストゲート | 返信・引用制限 | ✅ |
| スターターパック閲覧 | 詳細表示 | ✅ |
| 共有シート連携 | OS共有メニューからkazahanaへテキスト/URL送信 | — (モバイル新規) |

---

## 5. モバイル固有のUX設計

### 5.1 デスクトップ版との差異

| 項目 | デスクトップ版 | モバイル版 |
|------|--------------|-----------|
| ナビゲーション | 上部タブバー | 下部タブバー (iOS/Android 標準) |
| 更新操作 | ポーリング自動更新 | Pull-to-Refresh + バックグラウンドポーリング |
| 投稿作成 | モーダル | フルスクリーン or ボトムシート |
| 画像拡大 | ライトボックス | フルスクリーン＋ピンチズーム＋スワイプ |
| システムトレイ | あり | なし（OSのマルチタスク） |
| ウィンドウ状態 | サイズ・位置保存 | なし（OS管理） |
| 多重起動防止 | あり | なし（OS管理） |
| ディープリンク | `kazahana://compose` | ユニバーサルリンク / App Links |
| 右クリックメニュー | あり | ロングプレスメニュー |
| キーボードショートカット | F5, N, Alt+Enter | なし |
| 画像添付 | ドラッグ&ドロップ、ペースト | フォトライブラリ選択、カメラ撮影 |
| 外部URL | システムブラウザで開く | in-app ブラウザ (SFSafariViewController / Custom Tabs) or 外部ブラウザ |
| OGP取得 | Tauri HTTP plugin (CORS回避) | ネイティブHTTPクライアント (CORS制限なし) |

### 5.2 画面構成

```
┌──────────────────────────────────────┐
│  kazahana                    ⚙      │  ← ヘッダー
├──────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐    │
│  │ [Avatar] DisplayName @handle │    │
│  │                              │    │
│  │ 投稿テキスト                  │    │
│  │                              │    │
│  │ ┌──────────┬──────────┐      │    │
│  │ │  画像1    │  画像2    │      │    │
│  │ └──────────┴──────────┘      │    │
│  │                              │    │
│  │ 💬 5    🔁 3    ♡ 12         │    │
│  └──────────────────────────────┘    │
│                                      │
│                         [ ✏️ ] ← FAB │
├──────────────────────────────────────┤
│  🏠    🔍    🔔    ✉️    👤       │  ← 下部タブバー
└──────────────────────────────────────┘
```

### 5.3 画面一覧

| 画面 | 内容 | 遷移 |
|------|------|------|
| ログイン | ハンドル + パスワード入力 | 起動時（未認証） |
| ホーム | ホームタイムライン + フィード切り替え | タブ1 |
| 検索 | ユーザー/投稿検索 | タブ2 |
| 通知 | 通知一覧 | タブ3 |
| DM一覧 | 会話一覧 | タブ4 |
| プロフィール（自分） | 自分のプロフィール | タブ5 |
| プロフィール（他者） | ユーザープロフィール | Push遷移 |
| スレッド | 投稿詳細・スレッド | Push遷移 |
| 投稿作成 | 新規投稿 / リプライ / 引用 | FAB or 画面遷移 |
| DMスレッド | メッセージ送受信 | Push遷移 |
| 設定 | テーマ、言語、モデレーション等 | ヘッダーから遷移 |
| BSAF設定 | Bot登録・フィルター | 設定内 |

### 5.4 デザインガイドライン（継承 + モバイル適応）

- **カラーパレット** (デスクトップ版と統一):
  - Primary: `#0085FF` (Bluesky Blue)
  - Background Light: `#FFFFFF` / Dark: `#1A1A2E`
  - Text Light: `#1A1A1A` / Dark: `#E8E8E8`
  - Border Light: `#E4E4E4` / Dark: `#2E2E42`
  - Accent: `#0085FF`
- **アイコン**:
  - iOS: SF Symbols（Apple推奨、Material Symbolsに近いグリフあり）
  - Android: Material Symbols Rounded（デスクトップ版と統一）
- **フォント**: システムフォント（iOS: San Francisco / Android: Roboto）
- **角丸**: カード `12px`、ボタン `8px`、アバター `50%`（モバイルはやや大きめ）
- **タッチターゲット**: 最小 44x44pt (iOS) / 48x48dp (Android)
- **ダークモード**: OS設定連動 + アプリ内切り替え

---

## 6. アーキテクチャ設計

### 6.1 iOS (SwiftUI)

```
kazahana-ios/
├── KazahanaApp.swift              # エントリーポイント
├── Models/
│   ├── Session.swift              # セッション情報
│   ├── Post.swift                 # 投稿モデル
│   ├── Profile.swift              # プロフィールモデル
│   ├── Notification.swift         # 通知モデル
│   ├── Conversation.swift         # DM会話モデル
│   └── BSAF.swift                 # BSAFモデル
├── Services/
│   ├── ATProtoClient.swift        # AT Protocol HTTPクライアント
│   ├── AuthService.swift          # 認証（createSession, refreshSession）
│   ├── SessionStore.swift         # Keychain永続化
│   ├── TimelineService.swift      # タイムライン取得
│   ├── PostService.swift          # 投稿作成・削除
│   ├── NotificationService.swift  # 通知取得
│   ├── ChatService.swift          # DM API
│   ├── ModerationService.swift    # モデレーション判定
│   ├── RichTextParser.swift       # リッチテキスト（ファセット解析・生成）
│   ├── OGPFetcher.swift           # OGPメタデータ取得
│   └── BSAFService.swift          # BSAFパース・フィルタ
├── ViewModels/
│   ├── AuthViewModel.swift
│   ├── TimelineViewModel.swift
│   ├── ComposeViewModel.swift
│   ├── NotificationViewModel.swift
│   ├── ProfileViewModel.swift
│   ├── SearchViewModel.swift
│   ├── ChatViewModel.swift
│   └── SettingsViewModel.swift
├── Views/
│   ├── ContentView.swift          # ルート（タブ切り替え）
│   ├── Auth/
│   │   └── LoginView.swift
│   ├── Timeline/
│   │   ├── TimelineView.swift
│   │   ├── PostCardView.swift
│   │   ├── PostContentView.swift
│   │   └── FeedSelectorView.swift
│   ├── Compose/
│   │   ├── ComposeView.swift
│   │   ├── ImagePickerView.swift
│   │   └── AltTextEditor.swift
│   ├── Thread/
│   │   └── ThreadView.swift
│   ├── Notification/
│   │   ├── NotificationListView.swift
│   │   └── NotificationItemView.swift
│   ├── Profile/
│   │   ├── ProfileView.swift
│   │   ├── ProfileHeaderView.swift
│   │   └── FollowListView.swift
│   ├── Search/
│   │   └── SearchView.swift
│   ├── Messages/
│   │   ├── ConversationListView.swift
│   │   ├── MessageThreadView.swift
│   │   └── MessageBubbleView.swift
│   ├── Settings/
│   │   ├── SettingsView.swift
│   │   ├── ModerationSettingsView.swift
│   │   └── BSAFSettingsView.swift
│   └── Common/
│       ├── AvatarView.swift
│       ├── ImageGridView.swift
│       ├── ImageViewer.swift
│       ├── VideoPlayerView.swift
│       ├── LinkCardView.swift
│       ├── QuoteEmbedView.swift
│       └── ContentWarningView.swift
├── Resources/
│   ├── Localizable/ (11言語)
│   └── Assets.xcassets
└── Extensions/
    ├── Date+Format.swift
    └── String+Grapheme.swift
```

### 6.2 Android (Jetpack Compose)

```
kazahana-android/
├── app/src/main/
│   ├── java/com/kazahana/app/
│   │   ├── KazahanaApp.kt              # Application クラス
│   │   ├── MainActivity.kt             # エントリーポイント
│   │   ├── data/
│   │   │   ├── model/
│   │   │   │   ├── Session.kt
│   │   │   │   ├── Post.kt
│   │   │   │   ├── Profile.kt
│   │   │   │   ├── Notification.kt
│   │   │   │   ├── Conversation.kt
│   │   │   │   └── Bsaf.kt
│   │   │   ├── remote/
│   │   │   │   ├── ATProtoClient.kt    # AT Protocol HTTPクライアント
│   │   │   │   ├── AuthApi.kt          # 認証API
│   │   │   │   ├── FeedApi.kt          # フィードAPI
│   │   │   │   ├── NotificationApi.kt  # 通知API
│   │   │   │   └── ChatApi.kt          # DM API
│   │   │   ├── local/
│   │   │   │   ├── SessionStore.kt     # EncryptedSharedPreferences
│   │   │   │   └── SettingsStore.kt    # DataStore
│   │   │   └── repository/
│   │   │       ├── AuthRepository.kt
│   │   │       ├── TimelineRepository.kt
│   │   │       ├── PostRepository.kt
│   │   │       ├── NotificationRepository.kt
│   │   │       ├── ProfileRepository.kt
│   │   │       ├── SearchRepository.kt
│   │   │       ├── ChatRepository.kt
│   │   │       └── BSAFRepository.kt
│   │   ├── domain/
│   │   │   ├── RichTextParser.kt       # ファセット解析・生成
│   │   │   ├── ModerationEngine.kt     # モデレーション判定
│   │   │   ├── OGPFetcher.kt           # OGPメタデータ取得
│   │   │   └── BSAFFilter.kt           # BSAFフィルタリング
│   │   ├── ui/
│   │   │   ├── navigation/
│   │   │   │   └── AppNavigation.kt    # Navigation Compose
│   │   │   ├── theme/
│   │   │   │   ├── Theme.kt
│   │   │   │   ├── Color.kt
│   │   │   │   └── Type.kt
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.kt
│   │   │   │   └── LoginViewModel.kt
│   │   │   ├── timeline/
│   │   │   │   ├── TimelineScreen.kt
│   │   │   │   ├── TimelineViewModel.kt
│   │   │   │   ├── PostCard.kt
│   │   │   │   ├── PostContent.kt
│   │   │   │   └── FeedSelector.kt
│   │   │   ├── compose/
│   │   │   │   ├── ComposeScreen.kt
│   │   │   │   ├── ComposeViewModel.kt
│   │   │   │   └── ImagePicker.kt
│   │   │   ├── thread/
│   │   │   │   ├── ThreadScreen.kt
│   │   │   │   └── ThreadViewModel.kt
│   │   │   ├── notification/
│   │   │   │   ├── NotificationScreen.kt
│   │   │   │   ├── NotificationViewModel.kt
│   │   │   │   └── NotificationItem.kt
│   │   │   ├── profile/
│   │   │   │   ├── ProfileScreen.kt
│   │   │   │   ├── ProfileViewModel.kt
│   │   │   │   └── ProfileHeader.kt
│   │   │   ├── search/
│   │   │   │   ├── SearchScreen.kt
│   │   │   │   └── SearchViewModel.kt
│   │   │   ├── messages/
│   │   │   │   ├── ConversationListScreen.kt
│   │   │   │   ├── MessageThreadScreen.kt
│   │   │   │   ├── ChatViewModel.kt
│   │   │   │   └── MessageBubble.kt
│   │   │   ├── settings/
│   │   │   │   ├── SettingsScreen.kt
│   │   │   │   ├── SettingsViewModel.kt
│   │   │   │   ├── ModerationSettings.kt
│   │   │   │   └── BSAFSettings.kt
│   │   │   └── common/
│   │   │       ├── AvatarImage.kt
│   │   │       ├── ImageGrid.kt
│   │   │       ├── ImageViewer.kt
│   │   │       ├── VideoPlayer.kt
│   │   │       ├── LinkCard.kt
│   │   │       ├── QuoteEmbed.kt
│   │   │       └── ContentWarning.kt
│   │   └── di/
│   │       └── AppModule.kt            # Hilt モジュール
│   └── res/
│       ├── values/ (11言語)
│       └── drawable/
└── build.gradle.kts
```

---

## 7. データ層の設計

### 7.1 APIクライアント共通設計

両プラットフォームで以下の設計方針を統一する:

```
┌─────────────────────────────┐
│       ViewModel / View      │  ← UI層
├─────────────────────────────┤
│       Repository            │  ← ビジネスロジック
├─────────────────────────────┤
│       API Client            │  ← HTTPリクエスト
│  (認証ヘッダー自動付与)       │
│  (トークンリフレッシュ自動)   │
│  (レート制限ハンドリング)     │
├─────────────────────────────┤
│       Session Store         │  ← セキュア永続化
└─────────────────────────────┘
```

### 7.2 セッション管理フロー（デスクトップ版と同一）

```
┌─ アプリ起動 ─┐
│              │
▼              │
保存済みセッション あり?
├─ Yes → refreshSession
│         ├─ 成功 → ホーム画面へ
│         └─ 失敗 → ログイン画面へ
├─ No → ログイン画面表示
│        createSession
│        ├─ 成功 → セッション保存 → ホーム画面へ
│        └─ 失敗 → エラー表示
└──────────────┘

┌─ API呼び出し時 ─┐
│  accessJwt 付きリクエスト
│  ├─ 200 → 正常処理
│  ├─ 401 → refreshSession → リトライ
│  │          └─ 失敗 → ログイン画面へ
│  ├─ 429 → ratelimit-reset まで待機 → リトライ (指数バックオフ, 最大3回)
│  └─ その他 → エラーハンドリング
└─────────────────┘
```

---

## 8. リッチテキスト処理（重要：デスクトップ版と同一ロジック必須）

### 8.1 ファセット (Facets) の理解

Bluesky の投稿は `app.bsky.feed.post` レコードとして保存され、リッチテキスト要素（メンション、リンク、ハッシュタグ）は **facets** 配列で表現される。

```json
{
  "text": "Hello @alice.bsky.social! Check https://example.com #bluesky",
  "facets": [
    {
      "index": { "byteStart": 6, "byteEnd": 26 },
      "features": [{ "$type": "app.bsky.richtext.facet#mention", "did": "did:plc:..." }]
    },
    {
      "index": { "byteStart": 34, "byteEnd": 54 },
      "features": [{ "$type": "app.bsky.richtext.facet#link", "uri": "https://example.com" }]
    },
    {
      "index": { "byteStart": 55, "byteEnd": 63 },
      "features": [{ "$type": "app.bsky.richtext.facet#tag", "tag": "bluesky" }]
    }
  ]
}
```

**重要**: `index` は **UTF-8 バイトオフセット**。Swift の String や Kotlin の String は UTF-16 ベースのため、バイトオフセットの変換処理が必須。

### 8.2 投稿作成時のファセット生成

1. テキスト内の `@mention`、`https://...` URL、`#hashtag` をパース
2. メンションは `resolveHandle` API で DID に解決
3. UTF-8 バイトオフセットを計算してファセット配列を生成

### 8.3 文字数カウント

- **300 grapheme 単位**（Unicode grapheme cluster）
- Swift: `String.count`（grapheme cluster ベース）
- Kotlin: `java.text.BreakIterator.getCharacterInstance()` or ICU4J

---

## 9. モバイル固有の考慮事項

### 9.1 バッテリー・データ通信最適化

| 項目 | 方針 |
|------|------|
| ポーリング間隔 | フォアグラウンド: 30〜120秒 (設定可能) / バックグラウンド: 5〜15分 |
| 画像読み込み | 遅延読み込み + キャッシュ（Kingfisher / Coil） |
| 画像リサイズ | 表示サイズに合わせたダウンサンプリング |
| バックグラウンド更新 | iOS: BGAppRefreshTask / Android: WorkManager |

### 9.2 オフライン対応（将来検討）

- 初回表示はキャッシュから、ネットワーク復帰後に更新
- 投稿キューイング（オフライン時に書いた投稿をオンライン復帰時に自動送信）

### 9.3 共有シート連携（モバイル新規）

- **受信**: 他アプリからテキスト/URLを受け取り、投稿作成画面にプリセット
  - iOS: Share Extension
  - Android: Intent Filter (`ACTION_SEND`)
- **送信**: 投稿のURLを共有
  - iOS: `UIActivityViewController`
  - Android: `Intent.ACTION_SEND`

### 9.4 ディープリンク

| 方式 | iOS | Android |
|------|-----|---------|
| カスタムスキーム | `kazahana://` | `kazahana://` |
| ユニバーサルリンク | Apple App Site Association | Android App Links (assetlinks.json) |

---

## 10. 多言語対応リソースの流用

デスクトップ版の `src/i18n/locales/*.json` を各プラットフォームの形式に変換して利用する。

| デスクトップ (JSON) | iOS | Android |
|-------------------|-----|---------|
| `ja.json` | `Localizable.xcstrings` or `ja.lproj/Localizable.strings` | `values-ja/strings.xml` |
| `en.json` | `en.lproj/Localizable.strings` | `values/strings.xml` |
| 他9言語 | 同様 | 同様 |

**変換スクリプト**: デスクトップ版のJSONから iOS/Android のリソース形式に自動変換するスクリプトの作成を推奨。

---

## 11. BSAF対応（デスクトップ版と同一仕様）

### 11.1 機能一覧

| 機能 | 詳細 |
|------|------|
| Bot定義JSONパーサー | Bot Definition JSON の読み込み・バリデーション |
| Bot登録 | URL入力でBot定義をフェッチ・登録 |
| Bot登録解除 | 登録解除 + 自動アンフォロー |
| 動的フィルタUI | Bot定義に基づくフィルタ選択肢の自動生成 |
| タイムラインフィルタリング | BSAF投稿のAND条件フィルタ |
| 重複投稿検出 | 同一イベントの折りたたみ |
| 深刻度カラーボーダー | 左ボーダー色で深刻度表示 |
| BSAFタグ表示 | 投稿下部にタグバッジ表示 |
| 自動更新チェック | アプリ起動時にBot定義の更新確認 |

### 11.2 BSAFパース・フィルタリングロジック

デスクトップ版の `src/lib/bsaf.ts` のロジックを忠実に移植する。主要な処理:

1. 投稿テキストからBSAFタグ行（`[BSAF: ...]` 形式）を抽出
2. タグをkey:valueペアにパース
3. Bot定義のフィルタ設定と照合（AND条件）
4. フィルタ通過した投稿のみ表示

---

## 12. 配布

### 12.1 iOS
- **App Store** 経由で配布
- Apple Developer Program 登録が必要
- TestFlight でベータテスト

### 12.2 Android
- **Google Play Store** 経由で配布
- Google Play Console 登録が必要
- 内部テスト / クローズドテスト → オープンテスト → 本番公開
- （オプション）GitHub Releases で APK / AAB も配布

---

## 13. 実装優先順位まとめ

| Phase | 内容 | 目標 |
|-------|------|------|
| Phase 1 | 認証 + ホームタイムライン + 投稿カード | 基本動作の確認 |
| Phase 2 | 投稿作成 + インタラクション + 画像/動画 | コア操作の実装 |
| Phase 3 | 通知 + プロフィール + 検索 + フィード | 日常利用に耐えるレベル |
| Phase 4 | DM + モデレーション + 設定 + 多言語 | 機能パリティ達成 |
| Phase 5 | BSAF + 共有シート + 高度な機能 | デスクトップ版と同等 |

---

## 14. 参考リンク

| リソース | URL |
|---------|-----|
| Bluesky公式ドキュメント | https://docs.bsky.app/ |
| AT Protocol仕様 | https://atproto.com/ |
| Bluesky API リファレンス | https://docs.bsky.app/docs/api/at-protocol-xrpc-api |
| レート制限 | https://docs.bsky.app/docs/advanced-guides/rate-limits |
| クライアントアプリテンプレート | https://docs.bsky.app/docs/starter-templates/clients |
| SwiftUI ドキュメント | https://developer.apple.com/documentation/swiftui |
| Jetpack Compose ドキュメント | https://developer.android.com/develop/ui/compose |
| Material Symbols | https://fonts.google.com/icons |
| SF Symbols | https://developer.apple.com/sf-symbols/ |
