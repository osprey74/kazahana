# かざはな（Kazahana）— Bluesky Desktop Client 仕様書

**バージョン**: 1.0 (MVP)
**作成日**: 2025-02-21
**プラットフォーム**: Windows 11 / macOS
**フレームワーク**: Tauri v2 + React + TypeScript

---

## 1. プロジェクト概要

### 1.1 背景
BlueskyのPWA版はChromiumプロセスのメモリ肥大化により、長時間利用でPCが重くなる問題がある。ネイティブデスクトップクライアントを構築し、メモリ効率の良いBluesky体験を提供する。

### 1.2 コンセプト
- **軽量**: OS標準WebView利用でメモリ消費を最小化
- **高速**: ネイティブアプリならではの起動速度とレスポンス
- **シンプル**: 1カラムUI、必要十分な機能に絞ったMVP

### 1.3 アプリ名
- **日本語名**: かざはな（風花）
- **英語名**: Kazahana
- **パッケージID**: com.kazahana.app

---

## 2. 技術スタック

### 2.1 コア
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Tauri | v2 (latest) | デスクトップアプリフレームワーク |
| React | 18+ | UIフレームワーク |
| TypeScript | 5+ | 型安全な開発 |
| Vite | 6+ | ビルドツール |

### 2.2 フロントエンド
| ライブラリ | 用途 |
|-----------|------|
| `@atproto/api` | Bluesky公式TypeScript SDK |
| TailwindCSS 3+ | スタイリング |
| `@tanstack/react-query` | データフェッチ・キャッシュ管理 |
| Zustand | 軽量状態管理 |
| `react-router-dom` | ルーティング |
| `date-fns` | 日時フォーマット |
| `react-virtuoso` | 仮想スクロール（パフォーマンス最適化） |

### 2.3 Tauri (Rust) プラグイン
| プラグイン | 用途 |
|-----------|------|
| `tauri-plugin-store` | セッション情報の暗号化永続保存 |
| `tauri-plugin-notification` | OS通知連携 |
| `tauri-plugin-autostart` | OS起動時の自動起動（オプション） |
| `tauri-plugin-updater` | アプリ自動更新 |

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
- HTTP 429 レスポンス時は `ratelimit-reset` ヘッダーに基づくバックオフ
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
| 機能 | 詳細 |
|------|------|
| ログイン | ハンドル（例: user.bsky.social）+ アプリパスワード |
| PDS自動解決 | ハンドルからPDSホストを自動解決 |
| セッション永続化 | Tauri Store で暗号化保存、再起動時に自動復元 |
| トークンリフレッシュ | accessJwt期限切れ時に自動更新 |
| ログアウト | セッション破棄、保存データクリア |

### 4.2 タイムライン
| 機能 | API | 詳細 |
|------|-----|------|
| ホームTL表示 | `app.bsky.feed.getTimeline` | カーソルベースのページネーション |
| 投稿カード | — | アバター、表示名、ハンドル、本文、画像、タイムスタンプ |
| 無限スクロール | cursor param | 仮想スクロール（react-virtuoso）でメモリ効率化 |
| 新着表示 | — | 上部に「N件の新着投稿」バー表示 |
| プルリフレッシュ | — | 最新投稿の取得 |
| リンクカード | `app.bsky.embed.external` | OGP情報のプレビュー表示 |
| 引用投稿 | `app.bsky.embed.record` | 引用元の埋め込み表示 |
| リプライ表示 | replyParent/replyRoot | 返信先の表示 |

### 4.3 投稿作成
| 機能 | 詳細 |
|------|------|
| テキスト投稿 | 300文字制限、リアルタイム文字数カウンター |
| 画像添付 | 最大4枚、プレビュー表示、D&D対応 |
| リプライ | 返信先投稿を引用表示 |
| リッチテキスト | メンション（@handle）、URL、ハッシュタグの自動検出とファセット生成 |
| 投稿確認 | 送信前プレビュー（オプション） |

### 4.4 インタラクション
| 機能 | API |
|------|-----|
| いいね | `com.atproto.repo.createRecord` (app.bsky.feed.like) |
| いいね取消 | `com.atproto.repo.deleteRecord` |
| リポスト | `com.atproto.repo.createRecord` (app.bsky.feed.repost) |
| 引用リポスト | 投稿作成 + `app.bsky.embed.record` |
| スレッド表示 | `app.bsky.feed.getPostThread` |

### 4.5 通知
| 機能 | API | 詳細 |
|------|-----|------|
| 通知一覧 | `app.bsky.notification.listNotifications` | いいね、リポスト、フォロー、メンション、リプライ |
| 未読数 | `app.bsky.notification.getUnreadCount` | タブに未読バッジ表示 |
| 既読処理 | `app.bsky.notification.updateSeen` | 通知タブ表示時に既読化 |
| OS通知 | Tauri Notification plugin | バックグラウンド時のシステム通知 |

### 4.6 プロフィール
| 機能 | API |
|------|-----|
| プロフィール表示 | `app.bsky.actor.getProfile` |
| ユーザー投稿一覧 | `app.bsky.feed.getAuthorFeed` |
| フォロー/フォロワー | `app.bsky.graph.getFollows` / `getFollowers` |
| フォロー/解除 | `com.atproto.repo.createRecord` / `deleteRecord` |

### 4.7 検索
| 機能 | API |
|------|-----|
| ユーザー検索 | `app.bsky.actor.searchActors` |
| 投稿検索 | `app.bsky.feed.searchPosts` |

### 4.8 システム機能
| 機能 | 詳細 |
|------|------|
| システムトレイ | 最小化時にトレイに常駐、未読バッジ |
| 閉じる動作 | ✕ボタンでトレイに最小化（設定で変更可能） |
| 自動起動 | OS起動時の自動起動（オプション） |
| テーマ | ライト/ダーク/システム連動 |

---

## 5. UI設計

### 5.1 画面構成

```
┌──────────────────────────────────────────────────┐
│  かざはな                             ─  □  ✕   │
├──────────────────────────────────────────────────┤
│  [🏠 ホーム] [🔍 検索] [🔔 通知(3)] [👤 プロフィール] │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │ [Avatar] DisplayName  @handle    · 2m    │    │
│  │                                          │    │
│  │ 投稿テキストがここに表示されます。         │    │
│  │ @mention や #hashtag はリンク化           │    │
│  │                                          │    │
│  │ ┌────────────┬────────────┐              │    │
│  │ │  画像1      │  画像2      │              │    │
│  │ └────────────┴────────────┘              │    │
│  │                                          │    │
│  │  💬 5    🔁 3    ♡ 12    ⋯               │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │ 次の投稿...                                │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  [      ✏️ 新しい投稿を作成      ]   ← FAB      │
└──────────────────────────────────────────────────┘
```

### 5.2 画面一覧
| 画面 | パス | 内容 |
|------|------|------|
| ログイン | `/login` | ハンドル＋パスワード入力 |
| ホーム | `/` | ホームタイムライン |
| 検索 | `/search` | ユーザー/投稿検索 |
| 通知 | `/notifications` | 通知一覧 |
| プロフィール | `/profile/:handle` | ユーザープロフィール |
| スレッド | `/post/:uri` | スレッド/投稿詳細 |
| 投稿作成 | モーダル | 新規投稿/リプライ |
| 設定 | `/settings` | テーマ、自動起動等 |

### 5.3 デザインガイドライン
- **カラーパレット**:
  - Primary: `#0085FF` (Bluesky Blue)
  - Background Light: `#FFFFFF` / Dark: `#1A1A2E`
  - Text Light: `#1A1A1A` / Dark: `#E8E8E8`
  - Border Light: `#E4E4E4` / Dark: `#2E2E42`
  - Accent: `#0085FF`
- **フォント**: システムフォント (`font-family: system-ui`)
- **角丸**: カード `8px`、ボタン `6px`、アバター `50%`
- **レスポンシブ**: 最小幅 400px、最大幅 600px（コンテンツエリア）

---

## 6. プロジェクト構造

```
kazahana/
├── src-tauri/                    # Rust バックエンド
│   ├── src/
│   │   ├── main.rs              # エントリーポイント
│   │   ├── lib.rs               # Tauriセットアップ
│   │   └── tray.rs              # システムトレイ
│   ├── icons/                   # アプリアイコン
│   ├── Cargo.toml
│   └── tauri.conf.json          # Tauri設定
│
├── src/                          # React フロントエンド
│   ├── main.tsx                 # エントリーポイント
│   ├── App.tsx                  # ルートコンポーネント + ルーティング
│   │
│   ├── components/              # UIコンポーネント
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx    # メインレイアウト（タブバー含む）
│   │   │   ├── TabBar.tsx       # 上部タブナビゲーション
│   │   │   └── TitleBar.tsx     # カスタムタイトルバー
│   │   ├── timeline/
│   │   │   ├── TimelineView.tsx # タイムライン全体
│   │   │   ├── PostCard.tsx     # 投稿カード
│   │   │   └── PostContent.tsx  # リッチテキスト表示
│   │   ├── post/
│   │   │   ├── ComposeModal.tsx # 投稿作成モーダル
│   │   │   ├── ImageUpload.tsx  # 画像アップロード
│   │   │   └── RichTextInput.tsx # リッチテキスト入力
│   │   ├── thread/
│   │   │   └── ThreadView.tsx   # スレッド表示
│   │   ├── profile/
│   │   │   ├── ProfileView.tsx  # プロフィール画面
│   │   │   └── ProfileHeader.tsx
│   │   ├── notification/
│   │   │   ├── NotificationList.tsx
│   │   │   └── NotificationItem.tsx
│   │   ├── search/
│   │   │   ├── SearchView.tsx
│   │   │   └── SearchResults.tsx
│   │   ├── auth/
│   │   │   └── LoginForm.tsx
│   │   └── common/
│   │       ├── Avatar.tsx
│   │       ├── Button.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ImageGrid.tsx
│   │
│   ├── hooks/                   # カスタムフック
│   │   ├── useAuth.ts           # 認証管理
│   │   ├── useTimeline.ts       # タイムライン取得
│   │   ├── useNotifications.ts  # 通知取得
│   │   ├── useProfile.ts        # プロフィール取得
│   │   ├── usePost.ts           # 投稿作成/削除
│   │   └── useSearch.ts         # 検索
│   │
│   ├── stores/                  # 状態管理 (Zustand)
│   │   ├── authStore.ts         # 認証状態
│   │   ├── composeStore.ts      # 投稿作成状態
│   │   └── settingsStore.ts     # アプリ設定
│   │
│   ├── lib/                     # ユーティリティ
│   │   ├── agent.ts             # BskyAgent設定・管理
│   │   ├── richtext.ts          # リッチテキストヘルパー
│   │   ├── session.ts           # セッション永続化
│   │   └── constants.ts         # 定数定義
│   │
│   ├── types/                   # 型定義
│   │   └── index.ts
│   │
│   └── styles/
│       └── globals.css          # TailwindCSS base + カスタム
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## 7. 実装優先順位

### Phase 1: 基盤構築
1. Tauri + React + Vite プロジェクト初期化
2. TailwindCSS + 基本レイアウト（AppLayout, TabBar）
3. 認証機能（ログイン、セッション永続化、自動リフレッシュ）

### Phase 2: コア機能
4. タイムライン表示（PostCard, 無限スクロール）
5. 投稿カードのリッチテキスト表示（メンション、リンク、ハッシュタグ）
6. 画像表示（ImageGrid, ライトボックス）
7. インタラクション（いいね、リポスト）

### Phase 3: 投稿・通知
8. 投稿作成（ComposeModal, 画像添付）
9. リプライ機能
10. スレッド表示
11. 通知一覧 + 未読バッジ

### Phase 4: プロフィール・検索・仕上げ
12. プロフィール画面
13. フォロー/アンフォロー
14. 検索機能
15. システムトレイ + OS通知
16. ダーク/ライトテーマ
17. 設定画面

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
| クライアントアプリテンプレート | https://docs.bsky.app/docs/starter-templates/clients |
| OAuth実装ガイド | https://docs.bsky.app/docs/advanced-guides/oauth-client |
| Jetstream (リアルタイム) | https://docs.bsky.app/blog/jetstream |
