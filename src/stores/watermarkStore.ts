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
