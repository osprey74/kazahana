[日本語](README.ja.md)

# 🌸 Kazahana

**A lightweight Bluesky desktop client**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=github)](https://github.com/sponsors/osprey74)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-ff5e5b?logo=ko-fi)](https://ko-fi.com/osprey74)

---

## Overview

Kazahana is a lightweight desktop client for [Bluesky](https://bsky.app/).
Built with Tauri v2, it leverages the OS-native WebView for a low-memory, smooth experience.

## Philosophy

Kazahana is designed as a **lightweight, always-running companion app** — not a full-featured standalone replacement for the official Bluesky web client.

- **Daily essentials in Kazahana** — Timeline browsing, posting, notifications, search, DMs, and other frequently used operations are optimized for a smooth desktop experience.
- **Configuration via Bluesky web** — Account management, block/mute list management, list creation, feed generator setup, and other infrequent administrative tasks are left to [bsky.app](https://bsky.app/). Settings made on the web are automatically reflected in Kazahana through the AT Protocol's server-side sync.

## Features

- 🪶 **Lightweight** — Tauri v2 with no bundled Chromium, dramatically reducing memory usage
- 🖥️ **Cross-platform** — Windows / macOS support
- ⚡ **Fast** — Native app startup speed and responsiveness
- 🔓 **Open Source** — Freely available under the MIT License

### Implemented

- [x] Timeline with auto-refresh (configurable interval)
- [x] Reading position marker
- [x] Post / Reply
- [x] Like / Repost
- [x] Image attachments (up to 4, with ALT text)
- [x] Image lightbox with keyboard navigation
- [x] Link card (OGP preview)
- [x] Thread view
- [x] Notifications (like, repost, follow, mention, reply, quote, like-via-repost, repost-via-repost)
- [x] User profile / Follow / Unfollow / Likes / Media tabs / Pinned post
- [x] Search (posts & users)
- [x] Dark / Light / System theme
- [x] i18n (Japanese / English)
- [x] Content moderation (label-based filtering, blur, settings)
- [x] Custom feeds & list feeds (tab selector)
- [x] Threadgate & postgate (reply / quote restrictions)
- [x] Video attachments (upload, HLS playback, volume setting)
- [x] Desktop notifications (with reason breakdown: like/repost/reply/mention/follow/quote/like-via-repost/repost-via-repost)
- [x] Auto-start on OS boot (optional)
- [x] Bookmarks
- [x] Quote post
- [x] Direct messages
- [x] Bookmarklet & custom URI protocol (`kazahana://compose`) for quick sharing from browser
- [x] Window size & position persistence (save on exit, restore on launch)
- [x] System tray: left-click to restore, right-click menu (Open Window / Minimize / Exit)
- [x] Configurable close button behavior (exit or minimize to tray)
- [x] Image drag & drop onto compose modal (with auto-compression for large images)
- [x] Clipboard image paste (screenshot paste with JPEG compression)
- [x] Translate button in post menu (Google Translate integration)
- [x] Notification action buttons (reply, repost, like directly from notifications)
- [x] Color-coded notification icons (red heart for likes, green for reposts)
- [x] Feed/list quick-jump menu in header
- [x] Image display mode setting (in-app lightbox or external browser)
- [x] Sticky feed tab header on scroll
- [x] Auto-mention when composing from profile page (N key or FAB button)
- [x] Non-pinned feed display & feed visibility settings (show all / visible only in quick-jump)
- [x] Repost notification subject resolution (show original post for repost-via likes)
- [x] Profile post search (search posts by specific user)
- [x] Drag & drop feed/list reordering in settings
- [x] Chat message reactions (emoji stamps with quick picker)
- [x] BSAF (Bluesky Structured Alert Feed) compatible client

### BSAF Support

Kazahana supports the [BSAF protocol](https://github.com/osprey74/bsaf-protocol), enabling structured filtering of alert bot posts (e.g., earthquake/tsunami alerts from JMA bots).

> **How to Register a BSAF Bot**: [Registration Guide (English)](https://osprey74.github.io/kazahana/en/guide/bsaf-bot-registration.html) | [登録ガイド（日本語）](https://osprey74.github.io/kazahana/ja/guide/bsaf-bot-registration.html)

- **Register BSAF-compatible bots** via URL or local JSON file in Settings
- **Per-bot filter settings** — choose which categories, severity levels, and regions to display
- **AND-based filtering** — all filter conditions must match for a post to appear (e.g., if you set type to "earthquake" and region to "Hokkaido", only Hokkaido earthquake posts are shown)
- **Filters apply to Home Timeline and Custom Feeds only** — bot profile pages always show all posts unfiltered, so you can check the full history of alerts regardless of your filter settings
- **Severity-colored border** — BSAF posts display a left border colored by severity level (e.g., red for strong earthquakes, yellow for warnings)
- **BSAF tag display** — structured tags (type, value, target, source, etc.) are shown below the post body
- **Duplicate detection** — when multiple bots report the same event, duplicates are automatically collapsed
- **Auto-update** — bot definitions are checked for updates on each app launch

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Tauri v2](https://v2.tauri.app/) | Desktop app framework |
| [React](https://react.dev/) | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| [Vite](https://vite.dev/) | Build tool |
| [TailwindCSS](https://tailwindcss.com/) | Styling |
| [@atproto/api](https://www.npmjs.com/package/@atproto/api) | Official Bluesky SDK |

## Development

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/) (LTS)
- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Windows)

See [Tauri v2 Prerequisites](https://v2.tauri.app/start/prerequisites/) for details.

### Setup

```bash
# Clone the repository
git clone https://github.com/osprey74/kazahana.git
cd kazahana

# Install dependencies
npm install

# Start the dev server
npm run tauri dev
```

### Build

```bash
# Production build
npm run tauri build
```

## License

[MIT License](LICENSE)

## Support

If you enjoy Kazahana, please consider supporting its development ☕

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=github)](https://github.com/sponsors/osprey74)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-ff5e5b?logo=ko-fi)](https://ko-fi.com/osprey74)
