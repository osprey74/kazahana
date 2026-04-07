import { useRef, useEffect, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWatermarkStore } from "../../stores/watermarkStore";
import { useAuthStore } from "../../stores/authStore";
import { drawWatermark } from "../../lib/watermark";
import { Icon } from "../common/Icon";
import type { WatermarkPosition, WatermarkPreset } from "../../types/watermark";
import previewSrc from "../../assets/watermark-preview.jpg";

const PRESETS: { id: WatermarkPreset; labelKey: string }[] = [
  { id: "copyright", labelKey: "watermark.presetCopyright" },
  { id: "ai_ja", labelKey: "watermark.presetAiJa" },
  { id: "ai_en", labelKey: "watermark.presetAiEn" },
  { id: "ai_both", labelKey: "watermark.presetAiBoth" },
  { id: "photo", labelKey: "watermark.presetPhoto" },
  { id: "custom", labelKey: "watermark.presetCustom" },
];

const POSITIONS: { id: WatermarkPosition; labelKey: string }[] = [
  { id: "tl", labelKey: "watermark.posTopLeft" },
  { id: "tc", labelKey: "watermark.posTopCenter" },
  { id: "tr", labelKey: "watermark.posTopRight" },
  { id: "bl", labelKey: "watermark.posBottomLeft" },
  { id: "bc", labelKey: "watermark.posBottomCenter" },
  { id: "br", labelKey: "watermark.posBottomRight" },
  { id: "random", labelKey: "watermark.posRandom" },
  { id: "tile", labelKey: "watermark.posTile" },
];

const W3C_COLORS = [
  { name: "white",   hex: "#FFFFFF" },
  { name: "silver",  hex: "#C0C0C0" },
  { name: "gray",    hex: "#808080" },
  { name: "black",   hex: "#000000" },
  { name: "red",     hex: "#FF0000" },
  { name: "maroon",  hex: "#800000" },
  { name: "yellow",  hex: "#FFFF00" },
  { name: "olive",   hex: "#808000" },
  { name: "lime",    hex: "#00FF00" },
  { name: "green",   hex: "#008000" },
  { name: "aqua",    hex: "#00FFFF" },
  { name: "teal",    hex: "#008080" },
  { name: "blue",    hex: "#0000FF" },
  { name: "navy",    hex: "#000080" },
  { name: "fuchsia", hex: "#FF00FF" },
  { name: "purple",  hex: "#800080" },
];

function isValidHex(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function WatermarkSettings() {
  const { t } = useTranslation();
  const settings = useWatermarkStore((s) => s.settings);
  const update = useWatermarkStore((s) => s.update);
  const handle = useAuthStore((s) => s.profile?.handle ?? "user.bsky.social");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [colorInput, setColorInput] = useState(settings.textColor ?? "#FFFFFF");

  // Sync colorInput when settings change externally (e.g. palette click)
  useEffect(() => {
    setColorInput(settings.textColor ?? "#FFFFFF");
  }, [settings.textColor]);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const img = imgRef.current;
    if (!canvas || !container || !img || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Scale to container width while preserving aspect ratio
    const displayWidth = container.clientWidth;
    const scale = displayWidth / img.naturalWidth;
    const displayHeight = Math.round(img.naturalHeight * scale);

    canvas.width = displayWidth;
    canvas.height = displayHeight;
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
    drawWatermark(ctx, displayWidth, displayHeight, settings, handle);
  }, [settings, handle]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      drawPreview();
    };
    img.src = previewSrc;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  return (
    <div>
      {/* Enable toggle */}
      <label className="flex items-center gap-2 cursor-pointer ml-4 mb-3">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => update({ enabled: e.target.checked })}
          className="w-4 h-4 rounded accent-primary"
        />
        <span className="text-sm text-text-light dark:text-text-dark">{t("watermark.enable")}</span>
      </label>

      {settings.enabled && (
        <div className="ml-4 space-y-4">
          {/* Preview */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t("watermark.preview")}</h4>
            <div ref={containerRef}>
              <canvas
                ref={canvasRef}
                className="w-full rounded border border-border-light dark:border-border-dark"
              />
            </div>
          </div>

          {/* Preset */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t("watermark.preset")}</h4>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => update({ preset: p.id })}
                  className={`px-3 py-1.5 text-xs rounded-btn transition-colors ${
                    settings.preset === p.id
                      ? "bg-primary text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {t(p.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom text input */}
          {settings.preset === "custom" && (
            <div>
              <textarea
                value={settings.customText}
                onChange={(e) => update({ customText: e.target.value.slice(0, 50) })}
                placeholder={t("watermark.customPlaceholder")}
                maxLength={50}
                rows={3}
                className="w-full text-sm px-3 py-1.5 rounded border border-border-light dark:border-border-dark bg-transparent text-text-light dark:text-text-dark placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
              />
              <p className="text-[11px] text-gray-400 mt-1">{settings.customText.length}/50</p>
            </div>
          )}

          {/* Position */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t("watermark.position")}</h4>
            <div className="grid grid-cols-3 gap-1.5 max-w-[240px]">
              {POSITIONS.filter((p) => !["random", "tile"].includes(p.id)).map((p) => (
                <button
                  key={p.id}
                  onClick={() => update({ position: p.id })}
                  className={`px-2 py-1.5 text-xs rounded-btn transition-colors ${
                    settings.position === p.id
                      ? "bg-primary text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {t(p.labelKey)}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 mt-1.5 max-w-[240px]">
              {POSITIONS.filter((p) => ["random", "tile"].includes(p.id)).map((p) => (
                <button
                  key={p.id}
                  onClick={() => update({ position: p.id })}
                  className={`flex-1 px-2 py-1.5 text-xs rounded-btn transition-colors ${
                    settings.position === p.id
                      ? "bg-primary text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {t(p.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Opacity */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t("watermark.opacity")}</h4>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={20}
                max={100}
                step={5}
                value={settings.opacity}
                onChange={(e) => update({ opacity: Number(e.target.value) })}
                className="flex-1 h-1.5 accent-primary cursor-pointer"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 w-10 text-right">{settings.opacity}%</span>
            </div>
          </div>

          {/* Font size */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t("watermark.fontSize")}</h4>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={8}
                max={20}
                step={1}
                value={settings.fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="flex-1 h-1.5 accent-primary cursor-pointer"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 w-10 text-right">{settings.fontSize}px</span>
            </div>
          </div>

          {/* Text color */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t("watermark.textColor")}</h4>
            <div className="grid grid-cols-8 gap-1.5 max-w-[240px] mb-2">
              {W3C_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => update({ textColor: c.hex })}
                  title={c.name}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    settings.textColor?.toUpperCase() === c.hex
                      ? "border-primary scale-110"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={colorInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setColorInput(v);
                  if (isValidHex(v)) update({ textColor: v.toUpperCase() });
                }}
                onBlur={() => {
                  if (isValidHex(colorInput)) {
                    const upper = colorInput.toUpperCase();
                    setColorInput(upper);
                    update({ textColor: upper });
                  } else {
                    setColorInput(settings.textColor ?? "#FFFFFF");
                  }
                }}
                maxLength={7}
                placeholder="#FFFFFF"
                className="w-24 text-sm px-2 py-1 rounded border border-border-light dark:border-border-dark bg-transparent text-text-light dark:text-text-dark font-mono focus:outline-none focus:border-primary"
              />
              <div
                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: isValidHex(colorInput) ? colorInput : (settings.textColor ?? "#FFFFFF") }}
              />
            </div>
          </div>

          {/* Confirm before post */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.confirmBeforePost}
              onChange={(e) => update({ confirmBeforePost: e.target.checked })}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-sm text-text-light dark:text-text-dark">{t("watermark.confirmBeforePost")}</span>
          </label>

          {/* Skip video */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.skipVideo}
              onChange={(e) => update({ skipVideo: e.target.checked })}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-sm text-text-light dark:text-text-dark">{t("watermark.skipVideo")}</span>
          </label>

          {/* Hint */}
          <p className="text-[11px] text-gray-400 flex items-start gap-1">
            <Icon name="info" size={14} className="mt-0.5 shrink-0" />
            <span>{t("watermark.hint")}</span>
          </p>
        </div>
      )}
    </div>
  );
}
