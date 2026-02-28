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
- [x] Notifications (like, repost, follow, mention, reply, quote)
- [x] User profile / Follow / Unfollow / Likes / Media tabs / Pinned post
- [x] Search (posts & users)
- [x] Dark / Light / System theme
- [x] i18n (Japanese / English)
- [x] Content moderation (label-based filtering, blur, settings)
- [x] Custom feeds & list feeds (tab selector)
- [x] Threadgate & postgate (reply / quote restrictions)
- [x] Video attachments (upload, HLS playback, volume setting)
- [x] Desktop notifications (with reason breakdown: like/repost/reply/mention/follow/quote)
- [x] Auto-start on OS boot (optional)
- [x] Bookmarks
- [x] Quote post
- [x] Direct messages
- [x] Bookmarklet & custom URI protocol (`kazahana://compose`) for quick sharing from browser
- [x] Window size & position persistence (save on exit, restore on launch)
- [x] System tray: left-click to restore, right-click menu (Open Window / Minimize / Exit)
- [x] Configurable close button behavior (exit or minimize to tray)

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
