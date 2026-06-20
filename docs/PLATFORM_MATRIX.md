# kazahana Platform Feature Matrix

> **Last updated:** 2026-06-20 (Desktop で OGP 取得時の文字コード自動判定対応。Content-Type / `<meta charset>` を優先し、Shift_JIS / EUC-JP 等の非 UTF-8 サイトでリンクカードが文字化けしない実装に改修。Issue #12 の Desktop 分対応完了。iOS / Android は同 Issue で順次対応予定。2026-06-13 までの履歴: Bluesky v1.124 グループチャットを Android v3.4.0 で実装し Google Play 公開。Phase 1〜5 相当（受信・招待リンク参加・作成/owner 操作・`allowGroupInvites`・参加申請のアプリ内通知）に対応。プロフィール QR コードも Android v3.4.0 で対応。残: `listConvoRequests` 統合・メンバー追加 UI・投稿内招待リンク解決・取り下げ UI。iOS は Phase 1 から未着手)
> **Source:** Compiled from the following repositories
> - Desktop (Windows / macOS Tauri build): https://github.com/osprey74/kazahana
> - macOS (Catalyst) — generated from kazahana-ios: https://github.com/osprey74/kazahana-ios
> - iOS: https://github.com/osprey74/kazahana-ios
> - Android: https://github.com/osprey74/kazahana-android

> **過渡期注記:** Tauri 版 macOS は 6 ヶ月の移行期間を経て deprecate 予定です。期間終了後に「macOS (Tauri)」列を削除し「macOS (Catalyst)」を「macOS」へリネームします。**「macOS (Catalyst)」列の値は暫定的に `❓` を設定しております。実装状況の検証後に更新する必要があります。**

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | 実装済み |
| 🚧 | 対応中 / 部分実装 |
| ⬜ | 未実装（対応予定） |
| N/A | プラットフォーム非対象（仕様上不要） |
| ❓ | 要確認（ソースから判定不能） |

> **Windows / macOS (Tauri)** は同一バイナリのため基本的に同一扱いです。
> **macOS (Catalyst)** は kazahana-ios コードベースから生成されるネイティブ Mac Catalyst アプリで、Mac App Store にて配信中です。

---

## 1. タイムライン・閲覧

| 機能 | Windows | macOS (Tauri) | macOS (Catalyst) | Android | iOS | 備考 |
|------|:-------:|:-------------:|:----------------:|:-------:|:---:|------|
| ホームタイムライン | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 自動更新（ポーリング間隔設定） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 無限スクロール | ✅ | ✅ | ❓ | ✅ | ✅ | |
| Pull-to-Refresh | N/A | N/A | ❓ | ✅ | ✅ | Desktop はタブクリック/F5/ヘッダーボタンで代替 |
| 手動リロード | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 既読位置マーカー | ✅ | ✅ | ❓ | N/A | N/A | Desktop 独自実装 / Catalyst は HANDOFF Phase 3 で移植予定 |
| スティッキーフィードタブヘッダー | ✅ | ✅ | ❓ | ✅ | ✅ | |
| ホームタブ再タップでスクロール先頭＋再読み込み | N/A | N/A | ❓ | ✅ | ✅ | |
| カスタムフィード切り替え | ✅ | ✅ | ❓ | ✅ | ✅ | |
| リストフィード表示 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| フィードクイックジャンプメニュー | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 非ピン留めフィード表示 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| フィード並び替え（ドラッグ） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| フィード表示/非表示設定 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 全フィード表示 / 表示中のみ切り替え | ✅ | ✅ | ❓ | ✅ | ✅ | |

---

## 2. 投稿表示

| 機能 | Windows | macOS (Tauri) | macOS (Catalyst) | Android | iOS | 備考 |
|------|:-------:|:-------------:|:----------------:|:-------:|:---:|------|
| リッチテキスト（メンション/URL/ハッシュタグ） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 画像グリッド表示（≤4枚、`app.bsky.embed.images`） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 画像カルーセル表示(5〜10枚、`app.bsky.embed.gallery`) | ✅ | ✅ | ❓ | ✅ | ✅ | 2026-06-06 Bluesky v1.123 で正式リリース（atproto #4827 / social-app #10707）。5 枚以上で横スクロールカルーセル + 枚数バッジ。Android v3.3.0 / iOS v3.3.0 で対応 |
| 画像ライトボックス（フルスクリーン） | ✅ | ✅ | ❓ | ✅ | ✅ | Desktop: キーボードナビ対応 |
| 画像表示モード設定（アプリ内/ブラウザ） | ✅ | ✅ | ❓ | N/A | N/A | |
| 動画再生（HLS） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| リンクカード（OGP） | ✅ | ✅ | ❓ | ✅ | ✅ | 文字コード自動判定: Desktop v3.4.2 で Content-Type / `<meta charset>` を優先する HTML living standard 準拠の検出に対応（Shift_JIS / EUC-JP 等の非 UTF-8 サイト文字化け解消）。iOS / Android は Issue #12 で順次対応予定 |
| Standard Site 拡張リンクカード（受信） | ✅ | ✅ | ❓ | ✅ | ⬜ | 公開日 / 読了時間 / パブリケーション情報・著者・テーマカラー表示。HANDOFF_kazahana-standard-site-embed.md 参照 |
| 引用投稿表示 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| スレッド表示（親チェーン＋返信一覧） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| ALT テキスト表示（投稿カード、128文字） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| ピン留め投稿表示 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| Bot 自動化ラベルバッジ | ✅ | ✅ | ❓ | ✅ | ✅ | |
| Bluesky 認証マーク（verifiedStatus / trustedVerifierStatus） | ✅ | ✅ | ❓ | ✅ | ✅ | `app.bsky.actor.defs#verificationState` を読み取り、認証済み / 信頼された認証機関を表示名横にバッジ表示 |
| VIA（投稿元アプリ）表示 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 翻訳ボタン（Google翻訳） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 通知からのポスト表示（画像/動画/リンクカード） | ✅ | ✅ | ❓ | ✅ | ✅ | |

---

## 3. 投稿アクション

| 機能 | Windows | macOS (Tauri) | macOS (Catalyst) | Android | iOS | 備考 |
|------|:-------:|:-------------:|:----------------:|:-------:|:---:|------|
| いいね / いいね解除 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| リポスト / リポスト解除 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 引用リポスト | ✅ | ✅ | ❓ | ✅ | ✅ | |
| リプライ | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 投稿削除 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| ブックマーク | ✅ | ✅ | ❓ | ✅ | ✅ | |
| スレッドゲート（返信制限） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| ポストゲート（引用制限） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 投稿非表示（preferences hiddenPosts） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| スレッド通知ミュート | ✅ | ✅ | ❓ | ✅ | ✅ | |
| リンクコピー | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 外部ブラウザで開く | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 画像・動画の一括保存 | ✅ | ✅ | ❓ | ✅ | ✅ | ポストの三点メニューから全メディアを端末に保存 |

---

## 4. 投稿作成

| 機能 | Windows | macOS (Tauri) | macOS (Catalyst) | Android | iOS | 備考 |
|------|:-------:|:-------------:|:----------------:|:-------:|:---:|------|
| テキスト投稿 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 画像添付（≤4枚、`app.bsky.embed.images`） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 画像添付(5〜10枚、`app.bsky.embed.gallery` 送信) | ✅ | ✅ | ❓ | ✅ | ✅ | 5 枚以上選択で自動的に `embed.gallery` 種別へ昇格、≤4 で `embed.images` に降格。alt / aspectRatio 必須付与。Android v3.3.0 / iOS v3.3.0 で対応 |
| 動画添付 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 動画上限 300MB（Bluesky v1.123 拡張） | ✅ | ✅ | ❓ | ✅ | ✅ | social-app #10497/#10683 で feature gate 解除。lexicon `video.maxSize` は 100MB のまま（サーバ受容範囲＝トランスコード前提）。iOS は `getUploadLimits` API 連携 + 300MB クライアントガード。Android v3.3.0 / iOS v3.3.0 で対応 |
| 画像クロップ（オリジナル/正方形/自由） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 画像回転（90度単位） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| ALT テキスト入力 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| ALT テキスト自動生成（Claude API） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 画像自動圧縮 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| リンクカード自動生成（URL貼り付け） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| Standard Site 拡張リンクカード（送信） | ✅ | ✅ | ❓ | ✅ | ⬜ | `getEmbedExternalView` 経由でプレビュー取得、`associatedRefs` を投稿レコードに含める。HANDOFF_kazahana-standard-site-embed.md 参照 |
| メンションオートコンプリート（`@`） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| ハッシュタグ/URL ファセット自動検出 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| ドラッグ＆ドロップ画像添付 | ✅ | ✅ | ❓ | N/A | N/A | Desktop 固有 / Catalyst は macOS のドラッグ＆ドロップ対応要確認 |
| クリップボード画像ペースト | ✅ | ✅ | ❓ | N/A | N/A | Desktop 固有 / Catalyst は macOS のペースト対応要確認 |
| 下書き保存（最大20件） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| キーボードショートカット（N / ESC / Alt+Enter） | ✅ | ✅ | ❓ | N/A | N/A | |
| Option+Enter（macOS） | N/A | ✅ | ❓ | N/A | N/A | macOS のみ |
| プロフィールページからの自動メンション挿入 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| ウォーターマーク合成（画像） | ✅ | ✅ | ❓ | ✅ | ⬜ | 投稿前に著作権・AI拒否文言を画像に合成。Canvas API / CoreGraphics / Android Canvas。HANDOFF_watermark.md 参照 |
| ウォーターマーク — プリセット文言（6種） | ✅ | ✅ | ❓ | ✅ | ⬜ | 無断転載禁止 / AI学習禁止(JP) / No AI Training / AI+JP / 撮影・編集 / カスタム入力 |
| ウォーターマーク — 位置・不透明度・サイズ設定 | ✅ | ✅ | ❓ | ✅ | ⬜ | 6方向（＋ランダム/タイル）/ 不透明度 20〜100% / フォントサイズ 8〜20px |
| ウォーターマーク — 投稿前確認モーダル | ✅ | ✅ | ❓ | ✅ | ⬜ | `confirmBeforePost` 設定。合成結果を確認してから送信。WMなし投稿ボタンあり |
| ウォーターマーク — 動画スキップ設定 | ✅ | ✅ | ❓ | ✅ | ⬜ | `skipVideo` 設定。Phase 1 は動画本体へは非適用 |
| 長文投稿サービス連携（standard.site） | ✅ | ✅ | ❓ | ✅ | ⬜ | 設定済み URL を OS 既定ブラウザ（Android: Custom Tabs）で開く軽量ハンドオフ。HANDOFF_kazahana-standard-site.md 参照 |
---

## 5. 通知

| 機能 | Windows | macOS (Tauri) | macOS (Catalyst) | Android | iOS | 備考 |
|------|:-------:|:-------------:|:----------------:|:-------:|:---:|------|
| 通知一覧 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 未読バッジ | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 通知タイプ別アイコン・カラー | ✅ | ✅ | ❓ | ✅ | ✅ | |
| like / repost / follow / mention / reply / quote | ✅ | ✅ | ❓ | ✅ | ✅ | |
| like-via-repost / repost-via-repost | ✅ | ✅ | ❓ | ✅ | ✅ | |
| verified / unverified（認証通知） | ✅ | ✅ | ❓ | ✅ | ✅ | アカウント認証付与・解除通知の表示対応 |
| 通知アクションボタン（返信/RT/いいね） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 通知画像サムネイル | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 通知グルーピング表示（同種アクションまとめ） | ✅ | ✅ | ❓ | ✅ | ✅ | 「〇〇ほかN人が…」形式・複数アバター表示 |
| OS ネイティブ通知（バックグラウンド） | ✅ | ✅ | ❓ | ✅ | ✅ | Desktop: tauri-plugin-notification / iOS: BGAppRefreshTask + UNUserNotificationCenter / Android: WorkManager |
| 通知ポスト内容プログレッシブ読み込み | ✅ | ✅ | ❓ | ✅ | ✅ | 10件ずつバッチ分割＋バッチ内via-repost並列解決でUI段階描画 |

---

## 6. プロフィール

| 機能 | Windows | macOS (Tauri) | macOS (Catalyst) | Android | iOS | 備考 |
|------|:-------:|:-------------:|:----------------:|:-------:|:---:|------|
| プロフィール表示（バナー/アバター/統計） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| フォロー / フォロー解除 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 投稿タブ | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 返信タブ | ✅ | ✅ | ❓ | ✅ | ✅ | |
| メディアタブ | ✅ | ✅ | ❓ | ✅ | ✅ | |
| いいねタブ | ✅ | ✅ | ❓ | ✅ | ✅ | |
| スターターパックタブ | ✅ | ✅ | ❓ | ✅ | ✅ | |
| フォロワー / フォロー中一覧 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| ピン留め投稿表示 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| ブックマークタブ（自分のプロフィール） | ✅ | ✅ | ❓ | ✅ | ✅ | 自分のプロフィールでのみ表示 |
| プロフィール内検索 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| **プロフィール QR コード生成・共有** | N/A | N/A | N/A | ✅ | ⬜ | Bluesky v1.124 同梱機能。自分のプロフィールから QR シートを開き `bsky.app/profile/{handle}` を符号化。リンクのコピー / 共有 / QR 画像のギャラリー保存。iOS / Android のみ（Desktop はスコープ外）。HANDOFF_kazahana-profile-qr.md。Android v3.4.0：ZXing で生成、`MediaStore` 保存 |

---

## 7. 検索

| 機能 | Windows | macOS (Tauri) | macOS (Catalyst) | Android | iOS | 備考 |
|------|:-------:|:-------------:|:----------------:|:-------:|:---:|------|
| 投稿検索 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| ユーザー検索 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 検索履歴（永続化） | ✅ | ✅ | ❓ | ✅ | ✅ | Desktop: 200件 / iOS・Android: 20件 |
| スティッキー検索ヘッダー | ✅ | ✅ | ❓ | ✅ | ✅ | |

---

## 8. ダイレクトメッセージ・グループチャット

| 機能 | Windows | macOS (Tauri) | macOS (Catalyst) | Android | iOS | 備考 |
|------|:-------:|:-------------:|:----------------:|:-------:|:---:|------|
| 会話一覧 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| メッセージ送受信 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 絵文字リアクション | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 新規会話作成 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| メッセージ削除 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| ミュート / 退出 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| メッセージリクエスト承認 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| URL / ハッシュタグのリンク化 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| DM 自動更新（ポーリング） | ✅ | ✅ | ❓ | ✅ | ✅ | iOS・Android: 15秒 |
| DM 新規会話作成履歴 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| **グループ会話表示（`groupConvo` kind）** | ✅ | ✅ | ❓ | ✅ | ⬜ | Bluesky v1.124 グループチャット受信対応。グループ名 + メンバー数 + ロック状態を会話一覧およびスレッドヘッダに表示。HANDOFF_kazahana-group-chat.md Phase 1。Android v3.4.0：会話一覧は重ねアバター表示 |
| **グループシステムメッセージ表示** | ✅ | ✅ | ❓ | ✅ | ⬜ | 全 12 種（addMember / memberJoin / lockConvo / editGroup / createJoinLink ほか）を中央寄せ italic で表示。Android v3.4.0 対応 |
| **招待リンク embed 受信表示（`chat.bsky.embed.joinLink`）** | ✅ | ✅ | ❓ | ✅ | ⬜ | チャットメッセージ内の招待リンクカード描画。有効 / 無効化 / 無効リンクの 3 状態。Android v3.4.0 対応（参加アクションも接続済み） |
| **グループロック中の入力抑止** | ✅ | ✅ | ❓ | ✅ | ⬜ | `lockStatus: locked` / `locked-permanently` 時は入力欄を非表示にロック通知を表示。Android v3.4.0 対応 |
| **参加リクエスト一覧（`listConvoRequests`）** | ✅ | ✅ | ❓ | ⬜ | ⬜ | incoming 招待 + outgoing 参加申請を統合取得。`useConvoRequests` フック。Android：既存のメッセージリクエスト（`status`）流用のため `listConvoRequests` 統合は未実装 |
| グループ作成（`createGroup`） | ✅ | ✅ | ❓ | ✅ | ⬜ | Desktop: `CreateGroupModal` で名前 ≤50 文字 + メンバー ≤49 名選択。エラー 7 種（UserForbidsGroups / NotFollowedBySender 等）をローカライズ。Android v3.4.0：`CreateGroupScreen` |
| グループメンバー管理（追加・削除） | ✅ | ✅ | ❓ | 🚧 | ⬜ | Desktop: `GroupSettingsView` 内で `addMembers` / `removeMembers`。`getConvoMembers` でページング表示。Android v3.4.0：削除（kick）のみ UI 実装。追加 UI は未実装（`addMembers` は repository 実装済み） |
| グループ名編集（`editGroup`） | ✅ | ✅ | ❓ | ✅ | ⬜ | owner のみ。Desktop: 設定画面の編集ボタン。Android v3.4.0：設定画面の編集ダイアログ |
| 招待リンク生成・無効化（owner） | ✅ | ✅ | ❓ | ✅ | ⬜ | Desktop: `createJoinLink` / `editJoinLink`（joinRule + requireApproval）/ `enableJoinLink` / `disableJoinLink`。コピー・外部ブラウザで開く UI。Android v3.4.0：生成 / 有効・無効トグル / コピー / 共有（`editJoinLink` は未使用） |
| **招待 URL `bsky.app/chat/<code>` の in-app 解決** | ✅ | ✅ | ❓ | 🚧 | ⬜ | `lib/externalLink.ts` ヘルパー経由で `PostContent` / `LinkCard` / `MessageBubble` が `/chat/:code` ルートへ内部遷移。Android v3.4.0：DM メッセージ内リンクのみ対応。投稿内リンクは未対応 |
| **招待リンク参加プレビュー画面（`getJoinLinkPreviews`）** | ✅ | ✅ | ❓ | ✅ | ⬜ | `/chat/:code` で `JoinLinkView` を表示。グループ名 / メンバー数 / オーナー / 参加 CTA / pending・joined・disabled・invalid 状態。Android v3.4.0：`JoinGroupScreen` |
| **招待リンクからの参加（`requestJoin`）** | ✅ | ✅ | ❓ | ✅ | ⬜ | `joined` 時は会話画面へ自動遷移、`pending` 時はバナー表示。`ConvoLocked` / `FollowRequired` / `InvalidCode` / `LinkDisabled` / `MemberLimitReached` / `UserKicked` のエラーをローカライズ表示。Android v3.4.0：`joined` で会話へ遷移、`pending` でトースト |
| **参加申請の取り下げ（`withdrawJoinRequest`）** | ✅ | ✅ | ❓ | ⬜ | ⬜ | プレビュー画面で `viewer.requestedAt` が存在する場合に取り下げボタンを表示。Android：repository のみ実装、取り下げ UI 未実装 |
| 参加申請承認 / 拒否 | ✅ | ✅ | ❓ | ✅ | ⬜ | Desktop: `JoinRequestsView`（/messages/:convoId/requests）。`listJoinRequests` ページング + `approveJoinRequest` / `rejectJoinRequest`。画面オープン時に `updateJoinRequestsRead` で自動既読化。Android v3.4.0：`GroupSettingsScreen` 内に申請一覧 + 承認 / 拒否、`updateJoinRequestsRead` 自動既読化 |
| グループロック操作（owner） | ✅ | ✅ | ❓ | ✅ | ⬜ | Desktop: 設定画面のトグル。`lockConvo` / `unlockConvo`。`locked-permanently` 状態は解除 UI 非表示。Android v3.4.0：設定画面のトグル |
| 招待リンク embed のチャット送信（owner→他 DM への共有） | 🚧 | 🚧 | ❓ | ⬜ | ⬜ | `useSendJoinLinkMessage` フックのみ実装。チャット選択ピッカー UI は未着手。当面は URL を通常テキストとして貼る運用で代替 |
| グループ招待プライバシー設定（`allowGroupInvites`） | ✅ | ✅ | ❓ | ✅ | ⬜ | Desktop: 設定画面 > チャット セクションのラジオ選択（全員 / フォロー中 / 誰からも）。`chat.bsky.actor.declaration/self` レコードへ `putRecord`、`allowIncoming` 既存値を保持しつつ更新。Android v3.4.0：設定 > チャット |
| **未読参加申請バッジ + アプリ内通知（owner）** | ⬜ | ⬜ | ❓ | ✅ | ⬜ | Android v3.4.0 独自：`unreadJoinRequestCount` を会話一覧・チャットヘッダ・メッセージタブのバッジに表示。新規申請をアプリ起動中ローカル通知で通知（サーバープッシュは push backend 制約で不可。HANDOFF [A-8]/[I-9]） |

---

## 9. コンテンツモデレーション

| 機能 | Windows | macOS (Tauri) | macOS (Catalyst) | Android | iOS | 備考 |
|------|:-------:|:-------------:|:----------------:|:-------:|:---:|------|
| ラベルフィルタリング（hide/warn/ignore） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 投稿ブラー表示 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| メディアブラー表示 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 成人向けコンテンツ設定 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 通報機能（投稿/ユーザー） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| ミュート / ブロック | ✅ | ✅ | ❓ | ✅ | ✅ | |

---

## 10. BSAF（Bluesky Structured Alert Feed）

| 機能 | Windows | macOS (Tauri) | macOS (Catalyst) | Android | iOS | 備考 |
|------|:-------:|:-------------:|:----------------:|:-------:|:---:|------|
| BSAF マスタートグル | ✅ | ✅ | ❓ | ✅ | ✅ | |
| Bot 定義 JSON 登録（URL） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| Bot 登録解除（自動アンフォロー） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 動的フィルタ UI（type/value/target） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| AND 条件フィルタリング | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 重複投稿検出・折りたたみ | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 深刻度カラーボーダー | ✅ | ✅ | ❓ | ✅ | ✅ | |
| BSAF タグバッジ表示 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| Bot 定義自動更新チェック | ✅ | ✅ | ❓ | ✅ | ✅ | |
| ローカル JSON ファイルからの登録 | ✅ | ✅ | ❓ | N/A | N/A | Desktop: ファイルダイアログ対応 / Catalyst は HANDOFF Phase 3 で対応予定 |

---

## 10.5. 避難誘導補助（Evacuation Assist）

| 機能 | Windows | macOS (Tauri) | macOS (Catalyst) | Android | iOS | 備考 |
|------|:-------:|:-------------:|:----------------:|:-------:|:---:|------|
| 避難誘導マスタートグル | N/A | N/A | ❓ | ✅ | ✅ | 設定画面で ON/OFF、bsaf-kikikuru-bot 自動登録 |
| 避難所データ同梱（オフライン対応） | N/A | N/A | ❓ | ✅ | ✅ | 国土地理院 指定緊急避難場所データ 115,447件、zlib 圧縮 |
| 最寄り避難所検索 | N/A | N/A | ❓ | ✅ | ✅ | 測位（Android: FusedLocation / iOS: CoreLocation）+ Haversine、災害種別フィルタ |
| 警報バナー表示（BSAF 自動検知） | N/A | N/A | ❓ | ✅ | ✅ | レベル3/4/5 色分け、タップで避難所一覧 |
| コンパス簡易ナビ（オフライン） | N/A | N/A | ❓ | ✅ | ✅ | 方位角 + 直線距離リアルタイム更新 |
| OS 地図アプリ委譲 | N/A | N/A | ❓ | ✅ | ✅ | Apple Maps / Google Maps |
| オンボーディングダイアログ（初回案内） | N/A | N/A | ❓ | ✅ | ✅ | |
| 免責文言・出典表示 | N/A | N/A | ❓ | ✅ | ✅ | 気象庁危険度情報・国土地理院データ |

---

## 11. 設定

| 機能 | Windows | macOS (Tauri) | macOS (Catalyst) | Android | iOS | 備考 |
|------|:-------:|:-------------:|:----------------:|:-------:|:---:|------|
| テーマ（ライト/ダーク/システム） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 多言語対応（11言語） | ✅ | ✅ | ❓ | ✅ | ✅ | ja/en/pt/de/zh-TW/zh-CN/fr/ko/es/ru/id |
| Claude API キー管理 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 自動更新間隔設定（30/60/90/120秒） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| VIA 表示設定 | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 投稿言語（Bluesky アカウント設定から優先取得） | ⬜ | ⬜ | ❓ | ✅ | ✅ | アプリ設定 → Bluesky設定 → 端末ロケールの優先順 |
| ログインハンドル履歴（オートコンプリート） | ✅ | ✅ | ❓ | N/A | N/A | |
| ウォーターマーク設定画面 | ✅ | ✅ | ❓ | ✅ | ⬜ | ON/OFF、プリセット選択、位置・不透明度・サイズ・文字色、確認モーダル設定。各 OS 標準のストレージに永続化 |

---

## 12. プラットフォーム固有機能

### Desktop 固有（Tauri 版）

| 機能 | Windows | macOS (Tauri) | 備考 |
|------|:-------:|:-------------:|------|
| システムトレイアイコン | ✅ | ✅ | 左クリック復元・右クリックメニュー |
| OS 起動時自動スタート | ✅ | ✅ | tauri-plugin-autostart |
| ウィンドウサイズ/位置の保存・復元 | ✅ | ✅ | tauri-plugin-window-state |
| 閉じるボタン動作設定（終了/最小化） | ✅ | ✅ | |
| Dock アイコンからのウィンドウ復元 | N/A | ✅ | macOS のみ |
| ブックマークレット連携 | ✅ | ✅ | kazahana://compose |
| カスタム URI スキーム（compose） | ✅ | ✅ | |
| 自動更新（tauri-plugin-updater） | ⬜ | ⬜ | コード署名導入後に実装 |

### macOS (Catalyst) 固有

| 機能 | macOS (Catalyst) | 備考 |
|------|:----------------:|------|
| Mac App Store 経由の自動更新 | ❓ | App Store による自動配信 |
| システムトレイアイコン（AppKit ブリッジ） | ❓ | HANDOFF Phase 3 で実装予定（NSStatusItem） |
| OS 起動時自動スタート | ❓ | HANDOFF Phase 3 で実装予定（SMAppService） |
| 閉じるボタン動作設定（終了/最小化） | ❓ | HANDOFF Phase 3 で実装予定（NSWindow ブリッジ） |
| メニューバー（標準 macOS メニュー） | ❓ | HANDOFF Phase 2 で実装予定 |
| キーボードショートカット（macOS 標準） | ❓ | HANDOFF Phase 2 で実装予定 |
| ローカル JSON ファイル登録（BSAF Bot） | ❓ | HANDOFF Phase 3 で実装予定（.fileImporter） |
| サポーターバッジ（StoreKit IAP） | ❓ | iOS と同一の IAP プロダクトを利用 |

### iOS 固有

| 機能 | iOS | 備考 |
|------|:---:|------|
| Share Extension（他アプリからの共有受信） | ✅ | KeyChain accessGroup 共有 |
| 共有シート（他アプリへの共有送信） | ✅ | UIActivityViewController |
| ディープリンク（profile/post/hashtag） | ✅ | kazahana://profile/{} 等 |
| バックグラウンドポーリング（BGAppRefreshTask） | ✅ | |
| ローカルプッシュ通知 | ✅ | |
| スワイプバック対応（ナビバー非表示時） | ✅ | |
| マルチアカウント（切替/追加/削除） | ✅ | v1.1.0 で実装 |
| サポーターバッジ（IAP 30日） | ✅ | StoreKit 2 |

### Android 固有

| 機能 | Android | 備考 |
|------|:-------:|------|
| WorkManager バックグラウンドポーリング | ✅ | |
| プッシュ通知 | ✅ | |
| 共有シート受信（Intent Filter） | ✅ | |
| App Links（ディープリンク） | ✅ | |

---

## 13. アカウント管理

| 機能 | Windows | macOS (Tauri) | macOS (Catalyst) | Android | iOS | 備考 |
|------|:-------:|:-------------:|:----------------:|:-------:|:---:|------|
| ログイン（アプリパスワード） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| セッション永続化・自動リフレッシュ | ✅ | ✅ | ❓ | ✅ | ✅ | |
| レート制限ハンドリング（429 バックオフ） | ✅ | ✅ | ❓ | ✅ | ✅ | |
| マルチアカウント | ✅ | ✅ | ❓ | ✅ | ✅ | |
| 独自 PDS ログイン（DNS/well-known からの PDS 自動解決） | ✅ | ✅ | ❓ | ⬜ | ✅ | Desktop v2.7.0 / iOS v3.1.0 で実装。Android は後追い |

---

## 差異サマリー（要対応）

### iOS / Android 先行実装（Desktop 未実装）

| 機能 | Windows | macOS (Tauri) | 備考 |
|------|:-------:|:-------------:|------|
| 投稿言語（Bluesky アカウント設定から優先取得） | ⬜ | ⬜ | iOS / Android 実装済み |

### Desktop 先行実装（Android 未実装）

| 機能 | Android | 備考 |
|------|:-------:|------|
| 独自 PDS ログイン（DNS/well-known からの PDS 自動解決） | ⬜ | Desktop v2.7.0 / iOS v3.1.0 で実装。Android は did:plc の DID ドキュメントからの PDS 解決のみ対応（ハンドル解決は bsky.social 固定） |

### Desktop / Android 実装済み（iOS 未実装）

| 機能 | iOS | 備考 |
|------|:---:|------|
| Standard Site 拡張リンクカード（受信・送信） | ⬜ | HANDOFF_kazahana-standard-site-embed.md 参照 |
| ウォーターマーク合成（設定画面・プリセット・確認モーダル含む） | ⬜ | HANDOFF_watermark.md 参照 |
| 長文投稿サービス連携（standard.site） | ⬜ | HANDOFF_kazahana-standard-site.md 参照 |

### Desktop 未実装

| 機能 | Desktop |
|------|:-------:|
| 自動更新（tauri-plugin-updater） | ⬜ |
| 投稿言語（Bluesky アカウント設定から優先取得） | ⬜ |

### macOS (Catalyst) 検証待ち

> 全機能について `❓`（要確認）状態です。kazahana-ios コードベースから生成されるため、基本的に iOS 列の値を引き継ぐ想定ですが、HANDOFF Phase 3 で実装予定の Desktop 機能パリティ（既読位置マーカー / ログインハンドル履歴 / 画像表示モード設定 / システムトレイ / 自動スタート / 閉じるボタン動作設定 / ローカル JSON 登録）の実装状況確認後に値を更新する必要があります。

---

## 更新ルール

1. 新機能追加・バグ修正 PR のマージ時は **このファイルを必ず更新** する
2. ステータスは `✅ → ⬜ → 🚧 → ✅` の順で遷移させる
3. `❓` は次回の確認時に `✅` か `⬜` に解消する（放置しない）
4. `N/A` の再分類は プラットフォーム仕様変更時のみ行う
5. **過渡期**: macOS (Tauri) deprecation 完了後（HANDOFF Phase 6 終了時）に macOS (Tauri) 列を削除し、macOS (Catalyst) を macOS にリネームする
