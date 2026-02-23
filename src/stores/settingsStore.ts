import { create } from "zustand";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";

type Theme = "light" | "dark" | "system";

interface SettingsState {
  theme: Theme;
  pollInterval: number;
  desktopNotification: boolean;
  autoStart: boolean;
  videoVolume: number;
  showVia: boolean;
  setTheme: (theme: Theme) => void;
  setPollInterval: (seconds: number) => void;
  setDesktopNotification: (enabled: boolean) => void;
  setAutoStart: (enabled: boolean) => void;
  setVideoVolume: (volume: number) => void;
  setShowVia: (enabled: boolean) => void;
  initAutoStart: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: (localStorage.getItem("kazahana-theme") as Theme) || "system",
  pollInterval: Number(localStorage.getItem("kazahana-poll-interval")) || 30,
  desktopNotification: localStorage.getItem("kazahana-desktop-notification") !== "false",
  autoStart: false, // Will be synced from plugin on init
  videoVolume: Number(localStorage.getItem("kazahana-video-volume")) || 50,
  showVia: localStorage.getItem("kazahana-show-via") !== "false",

  setTheme: (theme: Theme) => {
    localStorage.setItem("kazahana-theme", theme);
    set({ theme });
    applyTheme(theme);
  },

  setPollInterval: (seconds: number) => {
    localStorage.setItem("kazahana-poll-interval", String(seconds));
    set({ pollInterval: seconds });
  },

  setDesktopNotification: (enabled: boolean) => {
    localStorage.setItem("kazahana-desktop-notification", String(enabled));
    set({ desktopNotification: enabled });
  },

  setVideoVolume: (volume: number) => {
    localStorage.setItem("kazahana-video-volume", String(volume));
    set({ videoVolume: volume });
  },

  setShowVia: (enabled: boolean) => {
    localStorage.setItem("kazahana-show-via", String(enabled));
    set({ showVia: enabled });
  },

  setAutoStart: (enabled: boolean) => {
    if (enabled) {
      enable().catch(() => {});
    } else {
      disable().catch(() => {});
    }
    set({ autoStart: enabled });
  },

  initAutoStart: () => {
    isEnabled()
      .then((enabled) => set({ autoStart: enabled }))
      .catch(() => {});
  },

}));

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // system
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}
