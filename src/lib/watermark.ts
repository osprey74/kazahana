import type { WatermarkSettings, WatermarkPosition } from "../types/watermark";

export function resolveWatermarkText(settings: WatermarkSettings, handle: string): string {
  const h = `@${handle}`;
  const map: Record<string, string> = {
    copyright: `© ${h}\u3000無断転載禁止`,
    ai_ja:     `© ${h}\u3000AI学習・転載禁止`,
    ai_en:     `© ${h}\u3000No AI Training`,
    ai_both:   `© ${h}\u3000No AI Training / 無断転載禁止`,
    photo:     `© ${h}\u3000撮影・編集`,
    custom:    settings.customText,
  };
  return map[settings.preset] ?? map.copyright;
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

  const text = resolveWatermarkText(settings, handle);
  const fontSize = Math.max(settings.fontSize, Math.round(img.width * 0.022));
  ctx.font = `bold ${fontSize}px sans-serif`;

  const textWidth = ctx.measureText(text).width;
  const padX = Math.round(fontSize * 1.0);
  const padY = Math.round(fontSize * 0.7);
  const boxW = textWidth + padX * 2;
  const boxH = fontSize + padY * 2;
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
  ctx.fillText(text, x + padX, y + padY);

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
