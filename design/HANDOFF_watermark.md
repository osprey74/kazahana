# HANDOFF: ウォーターマーク機能 — Kazahana 全プラットフォーム対応

## 概要

画像投稿時にアカウント名・著作権表示・AI学習拒否文言などを画像に合成するウォーターマーク機能。
設定はプラットフォームごとにローカル保存し、Bluesky API へのアップロード前にクライアント側で画像を加工する。

---

## 共通仕様

### 対応メディア

| 種別 | 対応 | 備考 |
|------|------|------|
| JPEG | ✅ | 品質 0.92 で再エンコード |
| PNG | ✅ | JPEG 0.92 に変換（Desktop 実装に準拠） |
| WebP | ✅ | JPEG 0.92 に変換（Desktop 実装に準拠） |
| GIF | ❌ | 対象外（アニメーション維持が困難） |
| 動画 | ⚠️ | Phase 2 対応。Phase 1 はサムネイル静止画のみ |

> **注**: Desktop 実装では全画像を JPEG 0.92 に変換する方式を採用。iOS/Android でも同様の方式を推奨。

### 文言プリセット（全プラットフォーム共通）

| ID | 表示文言（`{handle}` は実アカウント名に置換） | タグ |
|----|----------------------------------------------|------|
| `copyright` | `© @{handle}　無断転載禁止` | 標準 |
| `ai_ja` | `© @{handle}　AI学習・転載禁止` | AI拒否 |
| `ai_en` | `© @{handle}　No AI Training` | EN |
| `ai_both` | `© @{handle}　No AI Training / 無断転載禁止` | AI+JP |
| `photo` | `© @{handle}　撮影・編集` | 写真 |
| `custom` | ユーザー任意入力（最大 50 文字、改行可） | 自由 |

> **注**: `　`（U+3000 全角スペース）は1行表示時のみ使用。改行時はハンドルと文言を別行にする。

### 設定スキーマ（JSON 表現・プラットフォーム間で共通）

```json
{
  "enabled": false,
  "preset": "copyright",
  "customText": "",
  "position": "br",
  "opacity": 70,
  "fontSize": 12,
  "textColor": "#FFFFFF",
  "skipVideo": true,
  "confirmBeforePost": true
}
```

| フィールド | 型 | 範囲 | 説明 |
|-----------|-----|------|------|
| `enabled` | bool | — | 機能の ON/OFF |
| `preset` | string | 上表 6 種 | 使用するプリセット ID |
| `customText` | string | 0–50 文字 | `custom` 選択時の文言（改行を含むことができる）。設定画面は textarea |
| `position` | string | `tl/tc/tr/bl/bc/br` | 表示位置 |
| `opacity` | int | 20–100（step 5） | テキスト不透明度（%） |
| `fontSize` | int | 8–20（step 1） | 基準フォントサイズ（px 相当） |
| `textColor` | string | `#RRGGBB` | テキスト色（デフォルト `#FFFFFF`） |
| `skipVideo` | bool | — | 動画本体への適用をスキップ |
| `confirmBeforePost` | bool | — | 投稿前に合成結果を確認するモーダルを表示 |

### 合成ルール

#### テキスト解決（スマート改行）

- **定型文**: まず1行版（`© @{handle}　{ラベル}`）のテキスト幅を測定し、画像幅（マージン・パディング差引後）に収まれば1行で描画。はみ出す場合のみ2行に分割（`["© @{handle}", "{ラベル}"]`）
- **カスタム**: テキスト内の改行文字 (`\n`) で分割。空行はスキップ。テキストが空なら `© @{handle}` にフォールバック

#### 描画パラメータ

- フォント: `bold {fontSize}px sans-serif`
- フォントサイズは `max(fontSize設定値, 画像幅 × 0.022)` で最低サイズを保証する（小さい画像でも読めるように）
- 背景色: `rgba(0,0,0, opacity/100 × 0.6)`（黒半透明）、角丸半径 4px
- テキスト色: `rgba({textColor の R},{G},{B}, opacity/100)`
- パディング: X方向 = `fontSize × 1.0`、Y方向 = `fontSize × 0.7`
- 行間 (lineGap) = `fontSize × 0.3`
- 背景ボックス幅 = 最長行の幅 + パディング
- 背景ボックス高さ = `fontSize × 行数 + lineGap × (行数 - 1)` + パディング
- マージン（端からの余白）= `画像幅 × 0.015`
- テキスト描画: `textBaseline = "top"`, `textAlign = "left"`、Y座標を行ごとにずらして描画

#### 合成後の圧縮

ウォーターマーク合成後の画像が Bluesky の 1MB アップロード制限を超える場合があるため、合成後に圧縮処理を適用すること。Desktop では既存の `compressImageFile()` を通し、品質を段階的に下げて 1MB 以内に収める。

### 設定画面仕様

#### リアルタイムプレビュー

- 設定画面の上部にサンプル画像を `<canvas>` で表示
- 全設定項目（プリセット、位置、不透明度、文字サイズ、文字色）の変更がリアルタイムに反映
- サンプル画像はビルドに含めるアセットファイル（`src/assets/watermark-preview.jpg`）
- canvas はコンテナ幅に合わせてアスペクト比を保ったまま拡縮
- 合成描画ロジック (`drawWatermark()`) を投稿時とプレビューで共有すること

#### 文字色設定

- W3C 基本16色のカラーパレット（8列 × 2行の丸ボタン）
- HEX カラーコード直接入力欄（`#RRGGBB` 形式、バリデーション付き）
- 入力中はローカル state で管理し、有効な hex 確定時のみストアに保存（途中入力でストア更新しない）

W3C 基本16色:

| white `#FFFFFF` | silver `#C0C0C0` | gray `#808080` | black `#000000` |
|---|---|---|---|
| red `#FF0000` | maroon `#800000` | yellow `#FFFF00` | olive `#808000` |
| lime `#00FF00` | green `#008000` | aqua `#00FFFF` | teal `#008080` |
| blue `#0000FF` | navy `#000080` | fuchsia `#FF00FF` | purple `#800080` |

### 投稿フロー

```
ユーザーが「投稿」をクリック
  ↓
ウォーターマーク有効 && 画像あり？
  ├─ YES → 全画像に applyWatermark() → compressImageFile() を実行
  │        ├─ confirmBeforePost: true → 確認モーダル表示
  │        │    ├─「投稿」→ WM 付き画像で投稿
  │        │    ├─「WMなしで投稿」→ 元画像で投稿
  │        │    └─「キャンセル」→ 投稿画面に戻る
  │        └─ confirmBeforePost: false → WM 付き画像で直接投稿
  └─ NO → 元画像で直接投稿

「WMなしで投稿」ボタン（投稿画面ヘッダー）
  → ウォーターマーク合成をスキップし元画像で直接投稿
  → ウォーターマーク有効 && 画像添付時のみ表示
```

### 確認モーダル仕様

- モーダル幅: 最大 512px（Desktop 実装では `max-w-lg`）
- 画像プレビュー高さ: 1枚時 288px / 複数時 224px（`max-h-72` / `max-h-56`）
- 画像が複数の場合は 2列グリッド表示
- ボタン配置: 左に「キャンセル」、右に「WMなしで投稿」「投稿」

### 「WMなしで投稿」ボタン

2箇所に配置:
1. **投稿画面ヘッダー**: ウォーターマーク有効 && 画像添付時のみ表示。「投稿」ボタンの左隣
2. **確認モーダル**: 「キャンセル」と「投稿」の間に配置

---

## Platform A — Desktop（Tauri v2 + React + TypeScript）— 実装済み v2.4.2

### リポジトリ
`github.com/osprey74/kazahana`

### 実装ファイル構成

```
src/
├── types/watermark.ts              ← 型定義 + デフォルト設定
├── stores/watermarkStore.ts        ← Zustand ストア（設定の状態管理 + 永続化）
├── lib/watermark.ts                ← drawWatermark() 共有関数 + applyWatermark()
├── assets/watermark-preview.jpg    ← 設定プレビュー用サンプル画像
└── components/
    ├── settings/WatermarkSettings.tsx  ← 設定 UI（プレビュー + カラーピッカー含む）
    ├── WatermarkConfirmModal.tsx       ← 投稿前確認モーダル
    └── post/ComposeModal.tsx          ← 既存ファイルに追記（投稿フロー統合）

変更済み既存ファイル:
├── App.tsx                         ← watermarkStore.init() 呼び出し追加
├── stores/settingsStore.ts         ← confirmDraftImageQuality 設定追加
├── components/settings/SettingsView.tsx ← ウォーターマーク設定セクション + 下書き警告設定追加
└── i18n/locales/{ja,en}.json       ← watermark.* / draft.* キー追加
```

### 依存（追加インストール不要）

- `@tauri-apps/plugin-store` (npm) — v2.7.0
- `tauri-plugin-store` (Cargo) — v2

### 型定義 `src/types/watermark.ts`

```typescript
export type WatermarkPosition = "tl" | "tc" | "tr" | "bl" | "bc" | "br";
export type WatermarkPreset = "copyright" | "ai_ja" | "ai_en" | "ai_both" | "photo" | "custom";

export interface WatermarkSettings {
  enabled: boolean;
  preset: WatermarkPreset;
  customText: string;
  position: WatermarkPosition;
  opacity: number;
  fontSize: number;
  textColor: string;
  skipVideo: boolean;
  confirmBeforePost: boolean;
}

export const DEFAULT_WATERMARK_SETTINGS: WatermarkSettings = {
  enabled: false,
  preset: "copyright",
  customText: "",
  position: "br",
  opacity: 70,
  fontSize: 12,
  textColor: "#FFFFFF",
  skipVideo: true,
  confirmBeforePost: true,
};
```

### 設定状態管理 `src/stores/watermarkStore.ts`

> **重要**: React hook（useState + useEffect）ではなく **Zustand ストア** を使用すること。
> hook 方式では設定画面と投稿画面で独立した state が生まれ、設定変更が投稿フローに反映されない問題が発生する。

```typescript
import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";
import { STORE_FILE } from "../lib/constants";
import { DEFAULT_WATERMARK_SETTINGS, type WatermarkSettings } from "../types/watermark";

const STORE_KEY = "watermark";

interface WatermarkState {
  settings: WatermarkSettings;
  loaded: boolean;
  init: () => Promise<void>;
  update: (patch: Partial<WatermarkSettings>) => Promise<void>;
}

export const useWatermarkStore = create<WatermarkState>((set, get) => ({
  settings: DEFAULT_WATERMARK_SETTINGS,
  loaded: false,

  init: async () => {
    const store = await load(STORE_FILE, { defaults: {}, autoSave: true });
    const saved = await store.get<WatermarkSettings>(STORE_KEY);
    if (saved) {
      set({ settings: { ...DEFAULT_WATERMARK_SETTINGS, ...saved }, loaded: true });
    } else {
      set({ loaded: true });
    }
  },

  update: async (patch: Partial<WatermarkSettings>) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    const store = await load(STORE_FILE, { defaults: {}, autoSave: true });
    await store.set(STORE_KEY, next);
  },
}));
```

### 合成ロジック `src/lib/watermark.ts`

```typescript
import type { WatermarkSettings, WatermarkPosition } from "../types/watermark";

interface PresetText {
  single: string;
  multi: string[];
}

function resolvePresetText(settings: WatermarkSettings, handle: string): PresetText | null {
  const h = `© @${handle}`;
  const map: Record<string, { label: string }> = {
    copyright: { label: "無断転載禁止" },
    ai_ja:     { label: "AI学習・転載禁止" },
    ai_en:     { label: "No AI Training" },
    ai_both:   { label: "No AI Training / 無断転載禁止" },
    photo:     { label: "撮影・編集" },
  };
  const entry = map[settings.preset];
  if (!entry) return null;
  return {
    single: `${h}\u3000${entry.label}`,
    multi: [h, entry.label],
  };
}

function resolveCustomLines(settings: WatermarkSettings, handle: string): string[] {
  const lines = settings.customText.split("\n").filter((l) => l.length > 0);
  return lines.length > 0 ? lines : [`© @${handle}`];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  if (h.length !== 6) return { r: 255, g: 255, b: 255 };
  const n = parseInt(h, 16);
  if (isNaN(n)) return { r: 255, g: 255, b: 255 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/**
 * Draw watermark directly onto a canvas context.
 * Shared between actual compositing (applyWatermark) and settings preview.
 */
export function drawWatermark(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  imgWidth: number,
  imgHeight: number,
  settings: WatermarkSettings,
  handle: string,
): void {
  const fontSize = Math.max(settings.fontSize, Math.round(imgWidth * 0.022));
  ctx.font = `bold ${fontSize}px sans-serif`;

  const padX = Math.round(fontSize * 1.0);
  const margin = Math.round(imgWidth * 0.015);
  const maxAvailableWidth = imgWidth - margin * 2 - padX * 2;

  // Smart line break: single line if fits, multi-line if overflows
  let lines: string[];
  const preset = resolvePresetText(settings, handle);
  if (preset) {
    const singleWidth = ctx.measureText(preset.single).width;
    lines = singleWidth <= maxAvailableWidth ? [preset.single] : preset.multi;
  } else {
    lines = resolveCustomLines(settings, handle);
  }

  const lineGap = Math.round(fontSize * 0.3);
  const maxLineWidth = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const padY = Math.round(fontSize * 0.7);
  const boxW = maxLineWidth + padX * 2;
  const boxH = fontSize * lines.length + lineGap * (lines.length - 1) + padY * 2;

  const x = calcX(settings.position, imgWidth, boxW, margin);
  const y = calcY(settings.position, imgHeight, boxH, margin);

  ctx.fillStyle = `rgba(0,0,0,${(settings.opacity / 100 * 0.6).toFixed(2)})`;
  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, 4);
  ctx.fill();

  const rgb = hexToRgb(settings.textColor ?? "#FFFFFF");
  ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${(settings.opacity / 100).toFixed(2)})`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  for (let i = 0; i < lines.length; i++) {
    const ly = y + padY + i * (fontSize + lineGap);
    ctx.fillText(lines[i], x + padX, ly);
  }
}

export async function applyWatermark(
  file: File,
  settings: WatermarkSettings,
  handle: string,
): Promise<File> {
  const img = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  drawWatermark(ctx, img.width, img.height, settings, handle);

  img.close();

  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 });
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
}
```

### ComposeModal への組み込み（抜粋）

```typescript
// WM 合成後に compressImageFile で 1MB 制限内に圧縮
const wmImages: ImageFile[] = await Promise.all(
  images.map(async (img) => {
    const wmFile = await compressImageFile(await applyWatermark(img.file, wmSettings, handle));
    return { ...img, file: wmFile, preview: URL.createObjectURL(wmFile) };
  }),
);
```

---

## Platform B — iOS（Swift / SwiftUI）

### リポジトリ
`github.com/osprey74/kazahana-ios`

### 実装ファイル構成

```
Kazahana/
├── Models/WatermarkSettings.swift
├── Services/WatermarkService.swift
├── Views/Settings/WatermarkSettingsView.swift
└── Views/Post/PostView.swift  ← 既存ファイルに追記
```

### 設計ポイント（Desktop 実装からの知見）

> **重要**: 設定の状態管理は **グローバルに共有される仕組み** を使うこと。
> Desktop では React hook（useState）を使って設定画面と投稿画面で状態が分離する問題が発生した。
> iOS では `@Published` を持つ `ObservableObject` をシングルトンまたは `@EnvironmentObject` で共有する方式を推奨。

### モデル `Models/WatermarkSettings.swift`

```swift
import Foundation

enum WatermarkPreset: String, CaseIterable, Codable {
    case copyright, ai_ja, ai_en, ai_both, photo, custom
}

enum WatermarkPosition: String, CaseIterable, Codable {
    case tl, tc, tr, bl, bc, br
}

struct WatermarkSettings: Codable {
    var enabled: Bool = false
    var preset: WatermarkPreset = .copyright
    var customText: String = ""
    var position: WatermarkPosition = .br
    var opacity: Double = 70       // 20–100
    var fontSize: Double = 12      // 8–20
    var textColor: String = "#FFFFFF"
    var skipVideo: Bool = true
    var confirmBeforePost: Bool = true

    static let defaultsKey = "watermarkSettings"
}
```

### 合成サービス `Services/WatermarkService.swift`

```swift
import UIKit

struct WatermarkService {

    static func resolveLines(settings: WatermarkSettings, handle: String, maxWidth: CGFloat, font: UIFont) -> [String] {
        let h = "© @\(handle)"

        if settings.preset == .custom {
            let lines = settings.customText.components(separatedBy: "\n").filter { !$0.isEmpty }
            return lines.isEmpty ? [h] : lines
        }

        let labelMap: [WatermarkPreset: String] = [
            .copyright: "無断転載禁止",
            .ai_ja: "AI学習・転載禁止",
            .ai_en: "No AI Training",
            .ai_both: "No AI Training / 無断転載禁止",
            .photo: "撮影・編集",
        ]
        guard let label = labelMap[settings.preset] else { return [h] }

        // Try single line first
        let single = "\(h)\u{3000}\(label)"
        let attrs: [NSAttributedString.Key: Any] = [.font: font]
        let singleWidth = (single as NSString).size(withAttributes: attrs).width
        return singleWidth <= maxWidth ? [single] : [h, label]
    }

    static func hexToUIColor(_ hex: String, alpha: CGFloat) -> UIColor {
        var h = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex
        guard h.count == 6, let n = UInt64(h, radix: 16) else {
            return UIColor.white.withAlphaComponent(alpha)
        }
        let r = CGFloat((n >> 16) & 0xFF) / 255.0
        let g = CGFloat((n >> 8) & 0xFF) / 255.0
        let b = CGFloat(n & 0xFF) / 255.0
        return UIColor(red: r, green: g, blue: b, alpha: alpha)
    }

    static func apply(to image: UIImage, settings: WatermarkSettings, handle: String) -> UIImage {
        let size = image.size
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            image.draw(at: .zero)

            let baseFontSize = max(settings.fontSize, size.width * 0.022)
            let font = UIFont.boldSystemFont(ofSize: baseFontSize)
            let textAlpha = settings.opacity / 100.0
            let bgAlpha   = textAlpha * 0.6
            let lineGap   = baseFontSize * 0.3
            let padX = baseFontSize * 1.0
            let padY = baseFontSize * 0.7
            let margin = size.width * 0.015
            let maxAvailableWidth = size.width - margin * 2 - padX * 2

            let lines = resolveLines(settings: settings, handle: handle, maxWidth: maxAvailableWidth, font: font)

            let attrs: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: hexToUIColor(settings.textColor, alpha: textAlpha)
            ]
            let maxLineWidth = lines.map { ($0 as NSString).size(withAttributes: attrs).width }.max() ?? 0
            let boxW = maxLineWidth + padX * 2
            let boxH = baseFontSize * CGFloat(lines.count) + lineGap * CGFloat(lines.count - 1) + padY * 2

            let origin = calcOrigin(pos: settings.position, imgSize: size,
                                    boxSize: CGSize(width: boxW, height: boxH), margin: margin)
            let boxRect = CGRect(origin: origin, size: CGSize(width: boxW, height: boxH))

            let bgPath = UIBezierPath(roundedRect: boxRect, cornerRadius: 4)
            UIColor.black.withAlphaComponent(bgAlpha).setFill()
            bgPath.fill()

            for (i, line) in lines.enumerated() {
                let ly = origin.y + padY + CGFloat(i) * (baseFontSize + lineGap)
                (line as NSString).draw(at: CGPoint(x: origin.x + padX, y: ly), withAttributes: attrs)
            }
        }
    }

    private static func calcOrigin(pos: WatermarkPosition, imgSize: CGSize,
                                   boxSize: CGSize, margin: CGFloat) -> CGPoint {
        let x: CGFloat; let y: CGFloat
        switch pos {
        case .tl: x = margin;                                  y = margin
        case .tc: x = (imgSize.width - boxSize.width) / 2;    y = margin
        case .tr: x = imgSize.width - boxSize.width - margin;  y = margin
        case .bl: x = margin;                                  y = imgSize.height - boxSize.height - margin
        case .bc: x = (imgSize.width - boxSize.width) / 2;    y = imgSize.height - boxSize.height - margin
        case .br: x = imgSize.width - boxSize.width - margin;  y = imgSize.height - boxSize.height - margin
        }
        return CGPoint(x: x, y: y)
    }
}
```

### iOS 実装時の注意

- `UIGraphicsImageRenderer` はスレッドセーフではないため、合成処理はメインスレッドまたは専用シリアルキューで実行すること
- 「WMなしで投稿」ボタンと確認モーダルの実装は Desktop と同じフローに従うこと
- 出力は JPEG 0.92 で統一。合成後に 1MB 超過時は品質を下げて圧縮すること
- 設定画面にリアルタイムプレビューと文字色パレットを実装すること

---

## Platform C — Android（Kotlin / Jetpack Compose）

### リポジトリ
`github.com/osprey74/kazahana-android`

### 実装ファイル構成

```
app/src/main/java/app/kazahana/
├── data/WatermarkSettings.kt
├── data/WatermarkRepository.kt
├── ui/settings/WatermarkSettingsScreen.kt
└── ui/post/PostViewModel.kt  ← 既存ファイルに追記
```

### 設計ポイント（Desktop 実装からの知見）

> **重要**: 設定の状態管理は ViewModel + Repository パターンでグローバルに管理すること。
> DataStore の Flow を ViewModel で collect し、Compose UI に公開する。

### データクラス `data/WatermarkSettings.kt`

```kotlin
import kotlinx.serialization.Serializable

enum class WatermarkPreset { COPYRIGHT, AI_JA, AI_EN, AI_BOTH, PHOTO, CUSTOM }
enum class WatermarkPosition { TL, TC, TR, BL, BC, BR }

@Serializable
data class WatermarkSettings(
    val enabled: Boolean = false,
    val preset: WatermarkPreset = WatermarkPreset.COPYRIGHT,
    val customText: String = "",
    val position: WatermarkPosition = WatermarkPosition.BR,
    val opacity: Float = 70f,       // 20–100
    val fontSize: Float = 12f,      // 8–20
    val textColor: String = "#FFFFFF",
    val skipVideo: Boolean = true,
    val confirmBeforePost: Boolean = true
)
```

### 合成ロジック

```kotlin
import android.graphics.*
import kotlin.math.max
import kotlin.math.roundToInt

object WatermarkService {

    fun hexToColor(hex: String): Int {
        return try {
            Color.parseColor(hex)
        } catch (e: Exception) {
            Color.WHITE
        }
    }

    fun resolveLines(settings: WatermarkSettings, handle: String,
                     maxWidth: Float, paint: Paint): List<String> {
        val h = "© @$handle"

        if (settings.preset == WatermarkPreset.CUSTOM) {
            val lines = settings.customText.split("\n").filter { it.isNotEmpty() }
            return if (lines.isEmpty()) listOf(h) else lines
        }

        val labelMap = mapOf(
            WatermarkPreset.COPYRIGHT to "無断転載禁止",
            WatermarkPreset.AI_JA to "AI学習・転載禁止",
            WatermarkPreset.AI_EN to "No AI Training",
            WatermarkPreset.AI_BOTH to "No AI Training / 無断転載禁止",
            WatermarkPreset.PHOTO to "撮影・編集",
        )
        val label = labelMap[settings.preset] ?: return listOf(h)

        val single = "$h\u3000$label"
        return if (paint.measureText(single) <= maxWidth) listOf(single) else listOf(h, label)
    }

    fun apply(source: Bitmap, settings: WatermarkSettings, handle: String): Bitmap {
        val result = source.copy(Bitmap.Config.ARGB_8888, true)
        val canvas = Canvas(result)

        val baseFontSize = max(settings.fontSize, source.width * 0.022f)
        val textAlpha = (settings.opacity / 100f * 255).roundToInt()
        val bgAlpha   = (settings.opacity / 100f * 0.6f * 255).roundToInt()
        val lineGap   = baseFontSize * 0.3f
        val margin = (source.width * 0.015f).roundToInt()

        val textColor = hexToColor(settings.textColor)
        val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = textColor
            alpha = textAlpha
            textSize = baseFontSize
            typeface = Typeface.DEFAULT_BOLD
        }

        val padX = baseFontSize * 1.0f
        val maxAvailableWidth = source.width - margin * 2 - padX * 2
        val lines = resolveLines(settings, handle, maxAvailableWidth, textPaint)

        val maxLineWidth = lines.maxOf { textPaint.measureText(it) }
        val padY = baseFontSize * 0.7f
        val boxW = maxLineWidth + padX * 2
        val boxH = baseFontSize * lines.size + lineGap * (lines.size - 1) + padY * 2

        val (boxX, boxY) = calcOrigin(
            settings.position,
            source.width.toFloat(), source.height.toFloat(),
            boxW, boxH, margin.toFloat()
        )

        val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.BLACK
            alpha = bgAlpha
        }
        canvas.drawRoundRect(
            RectF(boxX, boxY, boxX + boxW, boxY + boxH), 4f, 4f, bgPaint
        )
        for ((i, line) in lines.withIndex()) {
            val ly = boxY + padY + baseFontSize + i * (baseFontSize + lineGap)
            canvas.drawText(line, boxX + padX, ly, textPaint)
        }

        return result
    }

    private fun calcOrigin(
        pos: WatermarkPosition,
        imgW: Float, imgH: Float,
        boxW: Float, boxH: Float,
        margin: Float
    ): Pair<Float, Float> {
        val x = when {
            pos.name.endsWith("L") -> margin
            pos.name.endsWith("C") -> (imgW - boxW) / 2
            else                   -> imgW - boxW - margin
        }
        val y = when {
            pos.name.startsWith("T") -> margin
            else                     -> imgH - boxH - margin
        }
        return Pair(x, y)
    }
}
```

### Android 実装時の注意

- 大きな画像（4K 以上）を処理する場合は OOM に注意。必要に応じて Bitmap を縮小してから合成し、アップロード前にリサイズすること
- 「WMなしで投稿」ボタンと確認モーダルの実装は Desktop と同じフローに従うこと
- 出力は JPEG 0.92 で統一。合成後に 1MB 超過時は品質を下げて圧縮すること
- 設定画面にリアルタイムプレビューと文字色パレットを実装すること

---

## 実装フェーズ

| Phase | 内容 | 対象 |
|-------|------|------|
| Phase 1 | 画像合成 + プリセット6種 + 位置・不透明度・文字サイズ・文字色設定 + スマート改行 + 確認モーダル + WMなし投稿 + プレビュー + 合成後圧縮 | Desktop ✅ / iOS / Android |
| Phase 2 | 動画サムネイルへのウォーターマーク適用 | Desktop 優先 |
| Phase 3 | 動画本体への合成（FFmpeg 検討） | 別途 HANDOFF 作成 |

---

## i18n キー一覧

各プラットフォームで以下のキーを用意すること（Desktop 実装を正とする）:

| キー | 日本語 | English |
|------|--------|---------|
| `watermark.title` | ウォーターマーク | Watermark |
| `watermark.enable` | 画像にウォーターマークを自動合成する | Automatically add watermark to images |
| `watermark.preview` | プレビュー | Preview |
| `watermark.preset` | 文言プリセット | Text Preset |
| `watermark.presetCopyright` | 無断転載禁止 | No Repost |
| `watermark.presetAiJa` | AI学習・転載禁止 | AI/Repost Ban (JP) |
| `watermark.presetAiEn` | No AI Training | No AI Training |
| `watermark.presetAiBoth` | AI+無断転載禁止 | AI + No Repost |
| `watermark.presetPhoto` | 撮影・編集 | Photo/Edit |
| `watermark.presetCustom` | カスタム | Custom |
| `watermark.customPlaceholder` | 任意の文言を入力（最大50文字） | Enter custom text (max 50 characters) |
| `watermark.position` | 表示位置 | Position |
| `watermark.posTopLeft` | 左上 | Top Left |
| `watermark.posTopCenter` | 中央上 | Top Center |
| `watermark.posTopRight` | 右上 | Top Right |
| `watermark.posBottomLeft` | 左下 | Bottom Left |
| `watermark.posBottomCenter` | 中央下 | Bottom Center |
| `watermark.posBottomRight` | 右下 | Bottom Right |
| `watermark.opacity` | 不透明度 | Opacity |
| `watermark.fontSize` | 文字サイズ（文字の最小サイズは画像幅から自動設定されます） | Font Size (minimum size is automatically set based on image width) |
| `watermark.textColor` | 文字色 | Text Color |
| `watermark.confirmBeforePost` | 投稿前にウォーターマークの合成結果を確認する | Preview watermark before posting |
| `watermark.skipVideo` | 動画には適用しない | Do not apply to videos |
| `watermark.hint` | ウォーターマークは投稿前に画像へ合成されます。AI学習拒否の文言は意思表示としての効果です。 | Watermarks are composited onto images before posting. AI training opt-out text serves as a declaration of intent. |
| `watermark.confirmTitle` | ウォーターマーク確認 | Watermark Preview |
| `watermark.confirmMessage` | ウォーターマークが合成された画像を確認してください。 | Please confirm the watermarked images before posting. |
| `watermark.postWithout` | WMなしで投稿 | Post without WM |

---

## テスト観点

- [x] 各プリセット文言が `{handle}` を正しく置換して表示されるか（Desktop 確認済み）
- [x] 6 方向すべての位置に正しく描画されるか（Desktop 確認済み）
- [x] `confirmBeforePost: true` のとき確認モーダルが表示されるか（Desktop 確認済み）
- [x] 確認モーダルの「WMなしで投稿」が元画像で投稿されるか（Desktop 確認済み）
- [x] 投稿画面ヘッダーの「WMなしで投稿」が元画像で投稿されるか（Desktop 確認済み）
- [x] 定型文が画像幅に収まれば1行、はみ出す場合のみ2行に分割されるか（Desktop 確認済み）
- [x] カスタムテキストで改行を含む場合に複数行で描画されるか（Desktop 確認済み）
- [x] 設定画面のプレビューが設定変更にリアルタイムで反映されるか（Desktop 確認済み）
- [x] 文字色パレット選択・HEXコード入力がプレビューと合成結果に反映されるか（Desktop 確認済み）
- [x] 合成後に 1MB を超える画像が自動圧縮されるか（Desktop 確認済み）
- [ ] 設定が再起動後も保持されているか
- [ ] 横長・縦長・正方形など複数アスペクト比で文字が欠けないか
- [ ] 動画ファイル選択時に `skipVideo: true` なら合成がスキップされるか

---

## 注意事項

- AI学習禁止の文言は現時点では **意思表示・心理的抑止** としての効果であり、法的拘束力は未確定（2026年4月時点）
- FFmpeg を使った動画本体への合成は Phase 3 以降で別途 HANDOFF を作成すること
- iOS の `UIGraphicsImageRenderer` はスレッドセーフではないため、合成処理はメインスレッドまたは専用シリアルキューで実行すること
- Android で大きな画像（4K 以上）を処理する場合は OOM に注意。必要に応じて Bitmap を縮小してから合成し、アップロード前にリサイズすること
- **設定の状態管理は必ずグローバル共有方式を採用すること**（Desktop の Zustand ストア / iOS の ObservableObject シングルトン / Android の ViewModel + Repository）。コンポーネントローカルの state では設定画面と投稿画面間で同期されない
- **hex → RGB 変換**: `parseInt("000000", 16)` は `0` を返すため、`|| defaultValue` パターンではなくビットシフト `(n >> 16) & 255` を使用すること（Desktop で black が white になるバグあり、修正済み）
- **HEX カラーコード入力**: 途中入力（例: `#FF`）でストアを更新するとレンダリングサイクルで入力が消える。ローカル state で入力値を管理し、有効な hex 確定時のみストアに保存すること
