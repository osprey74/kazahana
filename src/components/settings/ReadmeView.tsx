import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "../common/Icon";

const README_JA = `# kazahana

**軽量な Bluesky デスクトップクライアント**

## 概要

kazahana は、Bluesky 向けの軽量デスクトップクライアントです。
Tauri v2 を採用し、OS標準の WebView を利用することで、低メモリで快適に動作します。

## 特徴

- 🪶 軽量 — Chromium を内蔵しない Tauri v2 で、メモリ使用量を大幅に削減
- 🖥️ クロスプラットフォーム — Windows / macOS 対応
- ⚡ 高速 — ネイティブアプリならではの起動速度とレスポンス
- 🔓 オープンソース — MIT ライセンスで自由に利用可能

## 技術スタック

- Tauri v2 — デスクトップアプリフレームワーク
- React — UI フレームワーク
- TypeScript — 型安全な開発
- Vite — ビルドツール
- TailwindCSS — スタイリング
- @atproto/api — Bluesky 公式 SDK

## ライセンス

MIT License

© 2026 osprey74`;

const README_EN = `# kazahana

**A lightweight Bluesky desktop client**

## Overview

kazahana is a lightweight desktop client for Bluesky.
Built with Tauri v2, it leverages the OS-native WebView for a low-memory, smooth experience.

## Features

- 🪶 Lightweight — Tauri v2 with no bundled Chromium, dramatically reducing memory usage
- 🖥️ Cross-platform — Windows / macOS support
- ⚡ Fast — Native app startup speed and responsiveness
- 🔓 Open Source — Freely available under the MIT License

## Tech Stack

- Tauri v2 — Desktop app framework
- React — UI framework
- TypeScript — Type-safe development
- Vite — Build tool
- TailwindCSS — Styling
- @atproto/api — Official Bluesky SDK

## License

MIT License

© 2026 osprey74`;

function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      elements.push(<h1 key={key++} className="text-xl font-bold text-text-light dark:text-text-dark mb-2">{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} className="text-base font-bold text-text-light dark:text-text-dark mt-4 mb-2">{line.slice(3)}</h2>);
    } else if (line.startsWith("- ")) {
      elements.push(<li key={key++} className="text-sm text-text-light dark:text-text-dark ml-4 mb-1">{line.slice(2)}</li>);
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(<p key={key++} className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{line.slice(2, -2)}</p>);
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-1" />);
    } else {
      elements.push(<p key={key++} className="text-sm text-text-light dark:text-text-dark mb-1">{line}</p>);
    }
  }

  return elements;
}

export function ReadmeView() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const content = i18n.language.startsWith("ja") ? README_JA : README_EN;

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigate("/settings")}
          className="text-sm text-primary hover:underline"
        >
          <Icon name="arrow_back" size={16} className="inline-block align-text-bottom" /> {t("thread.back")}
        </button>
        <h2 className="text-lg font-bold text-text-light dark:text-text-dark">{t("settings.readme")}</h2>
      </div>
      <div>{renderMarkdown(content)}</div>
    </div>
  );
}
