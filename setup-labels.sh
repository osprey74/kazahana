#!/bin/bash
# kazahana GitHub Issues ラベル一括作成スクリプト
# 実行場所: どこからでも可（--repo オプションで指定しているため）
# 前提: gh コマンドが認証済みであること（gh auth login）

REPO="osprey74/kazahana"

echo "Creating labels for $REPO ..."

gh label create "platform:desktop" \
  --color "0075ca" \
  --description "Win/macOS 固有" \
  --repo "$REPO"

gh label create "platform:ios" \
  --color "0075ca" \
  --description "iOS 固有" \
  --repo "$REPO"

gh label create "platform:android" \
  --color "0075ca" \
  --description "Android 固有" \
  --repo "$REPO"

gh label create "platform:all" \
  --color "0075ca" \
  --description "全プラットフォーム共通" \
  --repo "$REPO"

gh label create "parity" \
  --color "e4e669" \
  --description "プラットフォーム間差異の是正" \
  --repo "$REPO"

gh label create "matrix:update" \
  --color "d93f0b" \
  --description "PLATFORM_MATRIX.md の更新が必要" \
  --repo "$REPO"

echo "Done! Check: https://github.com/$REPO/labels"
