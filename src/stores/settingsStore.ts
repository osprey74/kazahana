import { create } from "zustand";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";

type Theme = "light" | "dark" | "system";

interface SettingsState {
  theme: Theme;
  pollInterval: number;
  desktopNotification: boolean;
  autoStart: boolean;
  setTheme: (theme: Theme) => void;
  setPollInterval: (seconds: number) => void;
  setDesktopNotification: (enabled: boolean) => void;
  setAutoStart: (enabled: boolean) => void;
  initAutoStart: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: (localStorage.getItem("kazahana-theme") as Theme) || "system",
  pollInterval: Number(localStorage.getItem("kazahana-poll-interval")) || 30,
  desktopNotification: localStorage.getItem("kazahana-desktop-notification") !== "false",
  autoStart: false, // Will be synced from plugin on init

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
