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
- [x] User profile / Follow / Unfollow
- [x] Search (posts & users)
- [x] Dark / Light / System theme
- [x] i18n (Japanese / English)
- [x] Content moderation (label-based filtering, blur, settings)
- [ ] Quote post
- [ ] Rich text input (mentions, links)
- [ ] Desktop notifications

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
