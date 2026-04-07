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

export async function applyWatermark(
  file: File,
  settings: WatermarkSettings,
  handle: string,
): Promise<File> {
  const img = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const fontSize = Math.max(settings.fontSize, Math.round(img.width * 0.022));
  ctx.font = `bold ${fontSize}px sans-serif`;

  const padX = Math.round(fontSize * 1.0);
  const margin = Math.round(img.width * 0.015);
  const maxAvailableWidth = img.width - margin * 2 - padX * 2;

  // Determine lines: preset tries single first, falls back to multi if too wide
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
