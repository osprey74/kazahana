import type { WatermarkSettings, WatermarkPosition } from "../types/watermark";
import i18n from "../i18n";

interface PresetText {
  single: string;
  multi: string[];
}

function resolvePresetText(settings: WatermarkSettings, handle: string): PresetText | null {
  const h = `© @${handle}`;
  const stampKeyMap: Record<string, string> = {
    copyright: "watermark.stampCopyright",
    ai_ja:     "watermark.stampAiJa",
    ai_en:     "watermark.stampAiEn",
    ai_both:   "watermark.stampAiBoth",
    photo:     "watermark.stampPhoto",
  };
  const key = stampKeyMap[settings.preset];
  if (!key) return null;
  const label = i18n.t(key);
  return {
    single: `${h}\u3000${label}`,
    multi: [h, label],
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

function resolveLines(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  settings: WatermarkSettings,
  handle: string,
  maxAvailableWidth: number,
): string[] {
  const preset = resolvePresetText(settings, handle);
  if (preset) {
    const singleWidth = ctx.measureText(preset.single).width;
    return singleWidth <= maxAvailableWidth ? [preset.single] : preset.multi;
  }
  return resolveCustomLines(settings, handle);
}

/** Draw a single watermark box (background + text) at the given position. */
function drawBox(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  x: number,
  y: number,
  boxW: number,
  boxH: number,
  lines: string[],
  fontSize: number,
  lineGap: number,
  padX: number,
  padY: number,
  bgAlpha: number,
  textFill: string,
): void {
  ctx.fillStyle = `rgba(0,0,0,${bgAlpha.toFixed(2)})`;
  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, 4);
  ctx.fill();

  ctx.fillStyle = textFill;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  for (let i = 0; i < lines.length; i++) {
    const ly = y + padY + i * (fontSize + lineGap);
    ctx.fillText(lines[i], x + padX, ly);
  }
}

/** Draw a rotated watermark box (background + text) centered at (cx, cy). Used for tiling. */
function drawTileBox(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  cx: number,
  cy: number,
  boxW: number,
  boxH: number,
  lines: string[],
  fontSize: number,
  lineGap: number,
  padX: number,
  padY: number,
  bgAlpha: number,
  textFill: string,
  angle: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const x = -boxW / 2;
  const y = -boxH / 2;

  ctx.fillStyle = `rgba(0,0,0,${bgAlpha.toFixed(2)})`;
  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, 4);
  ctx.fill();

  ctx.fillStyle = textFill;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  for (let i = 0; i < lines.length; i++) {
    const ly = y + padY + i * (fontSize + lineGap);
    ctx.fillText(lines[i], x + padX, ly);
  }

  ctx.restore();
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

  const lines = resolveLines(ctx, settings, handle, maxAvailableWidth);

  const lineGap = Math.round(fontSize * 0.3);
  const maxLineWidth = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const padY = Math.round(fontSize * 0.7);
  const boxW = maxLineWidth + padX * 2;
  const boxH = fontSize * lines.length + lineGap * (lines.length - 1) + padY * 2;

  const rgb = hexToRgb(settings.textColor ?? "#FFFFFF");
  const bgAlpha = settings.opacity / 100 * 0.6;
  const textFill = `rgba(${rgb.r},${rgb.g},${rgb.b},${(settings.opacity / 100).toFixed(2)})`;

  if (settings.position === "tile") {
    // Checkerboard tiling (~20% coverage, -30° rotation, with background box)
    // Anchor the center tile at the image center so at least one is fully visible
    const tileArea = boxW * boxH;
    const spacing = Math.sqrt(tileArea / 0.2);
    const angle = -Math.PI / 6; // -30°
    const centerX = imgWidth / 2;
    const centerY = imgHeight / 2;
    const extend = Math.max(imgWidth, imgHeight) * 0.5;
    // Compute how many steps from center to cover the extended area
    const stepsX = Math.ceil(extend / spacing);
    const stepsY = Math.ceil(extend / spacing);
    for (let iy = -stepsY; iy <= stepsY; iy++) {
      const cy = centerY + iy * spacing;
      const isOddRow = ((iy % 2) + 2) % 2 !== 0;
      const offsetX = isOddRow ? spacing / 2 : 0;
      for (let ix = -stepsX; ix <= stepsX; ix++) {
        const cx = centerX + ix * spacing + offsetX;
        drawTileBox(ctx, cx, cy, boxW, boxH, lines, fontSize, lineGap, padX, padY, bgAlpha, textFill, angle);
      }
    }
  } else if (settings.position === "random") {
    // Random position (single, within bounds)
    const availW = imgWidth - boxW - margin * 2;
    const availH = imgHeight - boxH - margin * 2;
    const x = margin + (availW > 0 ? Math.random() * availW : 0);
    const y = margin + (availH > 0 ? Math.random() * availH : 0);
    drawBox(ctx, x, y, boxW, boxH, lines, fontSize, lineGap, padX, padY, bgAlpha, textFill);
  } else {
    // Fixed 6-direction position
    const x = calcX(settings.position, imgWidth, boxW, margin);
    const y = calcY(settings.position, imgHeight, boxH, margin);
    drawBox(ctx, x, y, boxW, boxH, lines, fontSize, lineGap, padX, padY, bgAlpha, textFill);
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

function calcX(pos: WatermarkPosition, w: number, bw: number, m: number): number {
  if (pos.endsWith("l")) return m;
  if (pos.endsWith("c")) return Math.round((w - bw) / 2);
  return w - bw - m;
}

function calcY(pos: WatermarkPosition, h: number, bh: number, m: number): number {
  if (pos.startsWith("t")) return m;
  return h - bh - m;
}
