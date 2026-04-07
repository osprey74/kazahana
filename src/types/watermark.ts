export type WatermarkPosition = "tl" | "tc" | "tr" | "bl" | "bc" | "br" | "random" | "tile";
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
