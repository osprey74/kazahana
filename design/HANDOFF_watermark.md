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
| `custom` | ユーザー任意入力（最大 50 文字） | 自由 |

> **注**: `　`（U+3000 全角スペース）を `©` とプリセット文言の間に使用すること。

### 設定スキーマ（JSON 表現・プラットフォーム間で共通）

```json
{
  "enabled": false,
  "preset": "copyright",
  "customText": "",
  "position": "br",
  "opacity": 70,
  "fontSize": 12,
  "skipVideo": true,
  "confirmBeforePost": true
}
```

| フィールド | 型 | 範囲 | 説明 |
|-----------|-----|------|------|
| `enabled` | bool | — | 機能の ON/OFF |
| `preset` | string | 上表 6 種 | 使用するプリセット ID |
| `customText` | string | 0–50 文字 | `custom` 選択時の文言（改行を含むことができる） |
| `position` | string | `tl/tc/tr/bl/bc/br` | 表示位置 |
| `opacity` | int | 20–100（step 5） | テキスト不透明度（%） |
| `fontSize` | int | 8–20（step 1） | 基準フォントサイズ（px 相当） |
| `skipVideo` | bool | — | 動画本体への適用をスキップ |
| `confirmBeforePost` | bool | — | 投稿前に合成結果を確認するモーダルを表示 |

### 合成ルール

- テキストは **複数行** で描画する（半透明の角丸背景の上に白文字）
- 改行ルール:
  - **定型文**: `© @{handle}` と続きの文言で2行に分割（例: `["© @handle", "無断転載禁止"]`）
  - **カスタム**: テキスト内の改行文字 (`\n`) で分割。設定画面は textarea で改行入力可能
- フォント: `bold {fontSize}px sans-serif`
- フォントサイズは `max(fontSize設定値, 画像幅 × 0.022)` で最低サイズを保証する（小さい画像でも読めるように）
- 背景色 alpha = `opacity / 100 × 0.6`（黒背景）、角丸半径 4px
- テキスト alpha = `opacity / 100`（白文字）
- パディング: X方向 = `fontSize × 1.0`、Y方向 = `fontSize × 0.7`
- 行間 (lineGap) = `fontSize × 0.3`
- 背景ボックス幅 = 最長行の幅 + パディング
- 背景ボックス高さ = `fontSize × 行数 + lineGap × (行数 - 1)` + パディング
- マージン（端からの余白）= `画像幅 × 0.015`
- テキスト描画: `textBaseline = "top"`, `textAlign = "left"`、Y座標を行ごとにずらして描画

### 投稿フロー

```
ユーザーが「投稿」をクリック
  ↓
ウォーターマーク有効 && 画像あり？
  ├─ YES → 全画像に applyWatermark() を実行
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

## Platform A — Desktop（Tauri v2 + React + TypeScript）— 実装済み v2.4.1

### リポジトリ
`github.com/osprey74/kazahana`

### 実装ファイル構成

```
src/
├── types/watermark.ts              ← 型定義 + デフォルト設定
├── stores/watermarkStore.ts        ← Zustand ストア（設定の状態管理 + 永続化）
├── lib/watermark.ts                ← Canvas API 合成ロジック
└── components/
    ├── settings/WatermarkSettings.tsx  ← 設定 UI パネル
    ├── WatermarkConfirmModal.tsx       ← 投稿前確認モーダル
    └── post/ComposeModal.tsx          ← 既存ファイルに追記（投稿フロー統合）

変更済み既存ファイル:
├── App.tsx                         ← watermarkStore.init() 呼び出し追加
├── components/settings/SettingsView.tsx ← ウォーターマーク設定セクション追加
└── i18n/locales/{ja,en}.json       ← watermark.* キー追加
```

### 依存（追加インストール不要）

Desktop では以下が既にインストール済み:
- `@tauri-apps/plugin-store` (npm) — v2.4.2
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
    const store = await load(STORE_FILE, { autoSave: true });
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
    const store = await load(STORE_FILE, { autoSave: true });
    await store.set(STORE_KEY, next);
  },
}));
```

### 合成ロジック `src/lib/watermark.ts`

```typescript
import type { WatermarkSettings, WatermarkPosition } from "../types/watermark";

export function resolveWatermarkLines(settings: WatermarkSettings, handle: string): string[] {
  const h = `© @${handle}`;
  const map: Record<string, string[]> = {
    copyright: [h, "無断転載禁止"],
    ai_ja:     [h, "AI学習・転載禁止"],
    ai_en:     [h, "No AI Training"],
    ai_both:   [h, "No AI Training / 無断転載禁止"],
    photo:     [h, "撮影・編集"],
    custom:    settings.customText.split("\n").filter((l) => l.length > 0),
  };
  const lines = map[settings.preset] ?? map.copyright;
  return lines.length > 0 ? lines : [h];
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

  const lines = resolveWatermarkLines(settings, handle);
  const fontSize = Math.max(settings.fontSize, Math.round(img.width * 0.022));
  ctx.font = `bold ${fontSize}px sans-serif`;

  const lineGap = Math.round(fontSize * 0.3);
  const maxLineWidth = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const padX = Math.round(fontSize * 1.0);
  const padY = Math.round(fontSize * 0.7);
  const boxW = maxLineWidth + padX * 2;
  const boxH = fontSize * lines.length + lineGap * (lines.length - 1) + padY * 2;
  const margin = Math.round(img.width * 0.015);

  const x = calcX(settings.position, img.width, boxW, margin);
  const y = calcY(settings.position, img.height, boxH, margin);

  ctx.fillStyle = `rgba(0,0,0,${(settings.opacity / 100 * 0.6).toFixed(2)})`;
  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, 4);
  ctx.fill();

  ctx.fillStyle = `rgba(255,255,255,${(settings.opacity / 100).toFixed(2)})`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  for (let i = 0; i < lines.length; i++) {
    const ly = y + padY + i * (fontSize + lineGap);
    ctx.fillText(lines[i], x + padX, ly);
  }

  img.close();

  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 });
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
}

function calcX(pos: WatermarkPosition, w: number, bw: number, m: number): number {
  if (pos.endsWith("l")) return m;
  if (pos.endsWith("c")) return Math.round((w - bw) / 2);
  return w - bw - m;
}

function calcY(pos: WatermarkPosition, h: number, bh: number, m: number): number {
  if (pos.startsWith("t")) return m;
  return h - bh - m;
}
```

### ComposeModal への組み込み（抜粋）

```typescript
// --- インポート ---
import { useAuthStore } from "../../stores/authStore";
import { useWatermarkStore } from "../../stores/watermarkStore";
import { applyWatermark } from "../../lib/watermark";
import { WatermarkConfirmModal } from "../WatermarkConfirmModal";

// --- state ---
const [showWatermarkConfirm, setShowWatermarkConfirm] = useState(false);
const [watermarkedPreviews, setWatermarkedPreviews] = useState<string[]>([]);
const [watermarkedImages, setWatermarkedImages] = useState<ImageFile[]>([]);
const wmSettings = useWatermarkStore((s) => s.settings);
const handle = useAuthStore((s) => s.profile?.handle ?? "");

// --- 投稿処理（元画像 or WM画像を受け取る共通関数） ---
const submitPost = async (finalImages: ImageFile[]) => {
  const imageData = await Promise.all(
    finalImages.map(async (img) => {
      const buf = await img.file.arrayBuffer();
      return { data: new Uint8Array(buf), mimeType: img.file.type, alt: img.alt };
    }),
  );
  createPost.mutate({ text, images: imageData.length > 0 ? imageData : undefined, ... });
};

// --- 「投稿」ボタン → WM 合成 → 確認 or 直接投稿 ---
const handleSubmit = async () => {
  if (!canPost) return;
  if (wmSettings.enabled && images.length > 0 && handle) {
    const wmImages = await Promise.all(
      images.map(async (img) => {
        const wmFile = await applyWatermark(img.file, wmSettings, handle);
        return { ...img, file: wmFile, preview: URL.createObjectURL(wmFile) };
      }),
    );
    if (wmSettings.confirmBeforePost) {
      setWatermarkedImages(wmImages);
      setWatermarkedPreviews(wmImages.map((img) => img.preview));
      setShowWatermarkConfirm(true);
      return;
    }
    submitPost(wmImages);
    return;
  }
  submitPost(images);
};

// --- 「WMなしで投稿」→ 元画像で直接投稿 ---
const handlePostWithoutWatermark = () => {
  watermarkedPreviews.forEach((url) => URL.revokeObjectURL(url));
  setWatermarkedPreviews([]);
  setWatermarkedImages([]);
  setShowWatermarkConfirm(false);
  submitPost(images);
};
```

### App.tsx 初期化

```typescript
import { useWatermarkStore } from "./stores/watermarkStore";

// AuthGate 内
const initWatermark = useWatermarkStore((s) => s.init);
useEffect(() => {
  // ... 他の初期化と並列
  initWatermark();
}, [/* ... */, initWatermark]);
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
    var skipVideo: Bool = true
    var confirmBeforePost: Bool = true

    static let defaultsKey = "watermarkSettings"
}
```

### 設定永続化

```swift
extension WatermarkSettings {
    static func load() -> WatermarkSettings {
        guard let data = UserDefaults.standard.data(forKey: defaultsKey),
              let settings = try? JSONDecoder().decode(WatermarkSettings.self, from: data)
        else { return WatermarkSettings() }
        return settings
    }

    func save() {
        guard let data = try? JSONEncoder().encode(self) else { return }
        UserDefaults.standard.set(data, forKey: WatermarkSettings.defaultsKey)
    }
}
```

### 合成サービス `Services/WatermarkService.swift`

```swift
import UIKit

struct WatermarkService {

    static func resolveLines(settings: WatermarkSettings, handle: String) -> [String] {
        let h = "© @\(handle)"
        switch settings.preset {
        case .copyright: return [h, "無断転載禁止"]
        case .ai_ja:     return [h, "AI学習・転載禁止"]
        case .ai_en:     return [h, "No AI Training"]
        case .ai_both:   return [h, "No AI Training / 無断転載禁止"]
        case .photo:     return [h, "撮影・編集"]
        case .custom:
            let lines = settings.customText.components(separatedBy: "\n").filter { !$0.isEmpty }
            return lines.isEmpty ? [h] : lines
        }
    }

    static func apply(to image: UIImage, settings: WatermarkSettings, handle: String) -> UIImage {
        let lines = resolveLines(settings: settings, handle: handle)
        let size = image.size

        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            image.draw(at: .zero)

            let baseFontSize = max(settings.fontSize, size.width * 0.022)
            let font = UIFont.boldSystemFont(ofSize: baseFontSize)
            let textAlpha = settings.opacity / 100.0
            let bgAlpha   = textAlpha * 0.6
            let lineGap   = baseFontSize * 0.3

            let attrs: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: UIColor.white.withAlphaComponent(textAlpha)
            ]
            let maxLineWidth = lines.map { ($0 as NSString).size(withAttributes: attrs).width }.max() ?? 0
            let padX = baseFontSize * 1.0
            let padY = baseFontSize * 0.7
            let boxW = maxLineWidth + padX * 2
            let boxH = baseFontSize * CGFloat(lines.count) + lineGap * CGFloat(lines.count - 1) + padY * 2
            let margin = size.width * 0.015

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
        let x: CGFloat
        let y: CGFloat
        switch pos {
        case .tl: x = margin;                                    y = margin
        case .tc: x = (imgSize.width - boxSize.width) / 2;     y = margin
        case .tr: x = imgSize.width - boxSize.width - margin;   y = margin
        case .bl: x = margin;                                    y = imgSize.height - boxSize.height - margin
        case .bc: x = (imgSize.width - boxSize.width) / 2;     y = imgSize.height - boxSize.height - margin
        case .br: x = imgSize.width - boxSize.width - margin;   y = imgSize.height - boxSize.height - margin
        }
        return CGPoint(x: x, y: y)
    }
}
```

### PostView への組み込み（抜粋）

```swift
// 投稿処理の画像アップロード直前
func prepareImageForUpload(_ uiImage: UIImage) -> UIImage {
    guard settings.enabled else { return uiImage }
    return WatermarkService.apply(to: uiImage, settings: settings, handle: currentHandle)
}
```

### iOS 実装時の注意

- `UIGraphicsImageRenderer` はスレッドセーフではないため、合成処理はメインスレッドまたは専用シリアルキューで実行すること
- 「WMなしで投稿」ボタンと確認モーダルの実装は Desktop と同じフローに従うこと
- 出力は JPEG 0.92 で統一（`renderer.jpegData(compressionQuality: 0.92)`）

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
    val skipVideo: Boolean = true,
    val confirmBeforePost: Boolean = true
)
```

### 設定永続化 `data/WatermarkRepository.kt`

DataStore を使用。

```kotlin
import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json

val Context.dataStore by preferencesDataStore(name = "kazahana_settings")

class WatermarkRepository(private val context: Context) {
    private val KEY = stringPreferencesKey("watermark_settings")

    val settings: Flow<WatermarkSettings> = context.dataStore.data.map { prefs ->
        prefs[KEY]?.let { Json.decodeFromString(it) } ?: WatermarkSettings()
    }

    suspend fun save(settings: WatermarkSettings) {
        context.dataStore.edit { prefs ->
            prefs[KEY] = Json.encodeToString(settings)
        }
    }
}
```

### 合成ロジック

```kotlin
import android.graphics.*
import kotlin.math.max
import kotlin.math.roundToInt

object WatermarkService {

    fun resolveLines(settings: WatermarkSettings, handle: String): List<String> {
        val h = "© @$handle"
        return when (settings.preset) {
            WatermarkPreset.COPYRIGHT -> listOf(h, "無断転載禁止")
            WatermarkPreset.AI_JA    -> listOf(h, "AI学習・転載禁止")
            WatermarkPreset.AI_EN    -> listOf(h, "No AI Training")
            WatermarkPreset.AI_BOTH  -> listOf(h, "No AI Training / 無断転載禁止")
            WatermarkPreset.PHOTO    -> listOf(h, "撮影・編集")
            WatermarkPreset.CUSTOM   -> {
                val lines = settings.customText.split("\n").filter { it.isNotEmpty() }
                if (lines.isEmpty()) listOf(h) else lines
            }
        }
    }

    fun apply(source: Bitmap, settings: WatermarkSettings, handle: String): Bitmap {
        val result = source.copy(Bitmap.Config.ARGB_8888, true)
        val canvas = Canvas(result)
        val lines = resolveLines(settings, handle)

        val baseFontSize = max(settings.fontSize, source.width * 0.022f)
        val textAlpha = (settings.opacity / 100f * 255).roundToInt()
        val bgAlpha   = (settings.opacity / 100f * 0.6f * 255).roundToInt()
        val lineGap   = baseFontSize * 0.3f
        val margin = (source.width * 0.015f).roundToInt()

        val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            alpha = textAlpha
            textSize = baseFontSize
            typeface = Typeface.DEFAULT_BOLD
        }

        val maxLineWidth = lines.maxOf { line ->
            val bounds = Rect()
            textPaint.getTextBounds(line, 0, line.length, bounds)
            bounds.width().toFloat()
        }
        val padX = baseFontSize * 1.0f
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

### PostViewModel への組み込み（抜粋）

```kotlin
fun prepareImageForUpload(bitmap: Bitmap): Bitmap {
    val s = _watermarkSettings.value
    return if (s.enabled) WatermarkService.apply(bitmap, s, currentHandle) else bitmap
}
```

### Android 実装時の注意

- 大きな画像（4K 以上）を処理する場合は OOM に注意。必要に応じて Bitmap を縮小してから合成し、アップロード前にリサイズすること
- 「WMなしで投稿」ボタンと確認モーダルの実装は Desktop と同じフローに従うこと
- 出力は JPEG 0.92 で統一（`bitmap.compress(Bitmap.CompressFormat.JPEG, 92, outputStream)`）

---

## 実装フェーズ

| Phase | 内容 | 対象 |
|-------|------|------|
| Phase 1 | 画像合成 + プリセット6種 + 位置・不透明度・文字サイズ設定 + 確認モーダル + WMなし投稿 | Desktop ✅ / iOS / Android |
| Phase 2 | 動画サムネイルへのウォーターマーク適用 | Desktop 優先 |
| Phase 3 | 動画本体への合成（FFmpeg 検討） | 別途 HANDOFF 作成 |

---

## i18n キー一覧

各プラットフォームで以下のキーを用意すること（Desktop 実装を正とする）:

| キー | 日本語 | English |
|------|--------|---------|
| `watermark.title` | ウォーターマーク | Watermark |
| `watermark.enable` | 画像にウォーターマークを自動合成する | Automatically add watermark to images |
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
| `watermark.fontSize` | 文字サイズ | Font Size |
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
- [x] 定型文がハンドル名と文言で2行に分割されるか（Desktop 確認済み）
- [x] カスタムテキストで改行を含む場合に複数行で描画されるか（Desktop 確認済み）
- [ ] opacity / fontSize のスライダーがリアルタイムにプレビューへ反映されるか
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
