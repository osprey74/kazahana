# リポスト経由の通知ナビゲーション — 調査記録 (2026-03-01)

## 背景

macOS版v2.0.1で「リポスト経由の通知クリックで投稿が見つかりません」が修正されていないとの報告を受け調査。

## 元のバグ (v2.0.1で修正済み — commit b6daa42)

- **症状**: 通知タブでリポスト経由の通知をクリック → 「投稿が見つかりません」と表示
- **原因**: `notification.reasonSubject` がリポストレコードURI（`at://did/app.bsky.feed.repost/rkey`）の場合、`getPostThread` がポストとして解決できない
- **修正内容**:
  1. `useSubjectPosts` フック: リポストURIを検出 → `getRecord` で元ポストURI取得 → ポストデータをマップに格納
  2. `NotificationItem.handleClick`: `targetUri` にリポストURIが含まれ `subjectPost` が解決済みなら元ポストURIに差し替え
  3. `NotificationList`: reason種別に応じた subjectPost lookup キー分岐

## v2.0.4で追加した防御処理 (commit 0381f0e)

- **問題**: `useSubjectPosts` のリポストURI解決（追加API呼び出し）が完了する前にユーザーがクリックすると、生のリポストURIが `useThread` に渡される（レースコンディション）
- **修正**: `useThread.ts` に `resolveRepostUri()` 関数を追加。`getPostThread` 呼び出し前にリポストURIを検出・解決するフォールバック処理

## Bluesky通知モデル（仕様上の正常ルート）

| アクション | 通知の宛先 | reasonSubject |
|---|---|---|
| ユーザBがユーザAのポストをいいね | ユーザA（元ポスト作者） | ユーザAのポストURI |
| ユーザBがユーザAのポストをリポスト | ユーザA（元ポスト作者） | ユーザAのポストURI |
| ユーザBがユーザAのポストをリポスト → ユーザCがそのポストをいいね | ユーザA（元ポスト作者） | ユーザAのポストURI |
| ユーザBがユーザAのポストをリポスト → ユーザCがそのポストをリポスト | ユーザA（元ポスト作者） | ユーザAのポストURI |

**重要**: リポストは元ポストへのアクションであり、リポストしたユーザ（ユーザB）には通知が届かない。通知は常に元ポストの作者に送られる。

## テスト実施内容 (v2.0.4 — macOS + Windows)

### テスト1: 通常のいいね通知クリック
- **操作**: 通知タブで過去のいいね通知をクリック
- **結果**: 正常遷移。`targetUri` = `at://did/app.bsky.feed.post/...`（正しいポストURI）

### テスト2: リポスト通知クリック（メインアカウント投稿 → サブアカウントリポスト）
- **操作**: メインアカウントで投稿作成 → サブアカウントでリポスト → メインアカウントの通知をクリック
- **結果**: 正常遷移。`targetUri` = `at://did/app.bsky.feed.post/...`（正しいポストURI）

### テスト3: リポスト経由の通知再現試行
- **操作**: メインアカウントで他者のポストをリポスト → サブアカウントで同じポストをリポスト
- **結果**: メインアカウントに通知が届かない（Bluesky仕様通り — 通知は元ポスト作者にのみ届く）

### 結論
- v2.0.4で「投稿が見つかりません」は再現せず
- `reasonSubject` にリポストレコードURIが入る条件は通常のUI操作では発生しにくい
- 元のバグ報告（あやがねさん）は特定のAPI挙動下で発生した可能性がある
- v2.0.4の二重防御（useSubjectPosts + useThread resolveRepostUri）で対応済み

## デバッグ用の一時的変更（リリース前に除去が必要）

- `src-tauri/src/lib.rs`: `window.open_devtools()` の無条件呼び出し
- `src/hooks/useThread.ts`: `console.log` / `console.warn` / `console.error`
- `src/components/notification/NotificationItem.tsx`: `console.log` / `console.warn`
