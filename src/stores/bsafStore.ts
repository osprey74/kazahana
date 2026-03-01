import { create } from "zustand";
import type { BsafBotDefinition, BsafRegisteredBot } from "../types/bsaf";

interface BsafState {
  bsafEnabled: boolean;
  registeredBots: BsafRegisteredBot[];

  setBsafEnabled: (enabled: boolean) => void;
  registerBot: (definition: BsafBotDefinition) => void;
  unregisterBot: (did: string) => void;
  updateBotDefinition: (did: string, definition: BsafBotDefinition) => void;
  setFilterOptions: (did: string, tag: string, values: string[]) => void;
  setLastCheckedAt: (did: string, timestamp: string) => void;
}

function loadBots(): BsafRegisteredBot[] {
  try {
    const raw = localStorage.getItem("kazahana-bsaf-bots");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBots(bots: BsafRegisteredBot[]) {
  localStorage.setItem("kazahana-bsaf-bots", JSON.stringify(bots));
}

export const useBsafStore = create<BsafState>((set) => ({
  bsafEnabled: localStorage.getItem("kazahana-bsaf-enabled") === "true",
  registeredBots: loadBots(),

  setBsafEnabled: (enabled: boolean) => {
    localStorage.setItem("kazahana-bsaf-enabled", String(enabled));
    set({ bsafEnabled: enabled });
  },

  registerBot: (definition: BsafBotDefinition) => {
    set((state) => {
      // Initialize all filter options as enabled
      const filterSettings: Record<string, string[]> = {};
      for (const filter of definition.filters) {
        filterSettings[filter.tag] = filter.options.map((o) => o.value);
      }

      const bot: BsafRegisteredBot = {
        definition,
        filterSettings,
        registeredAt: new Date().toISOString(),
        lastCheckedAt: new Date().toISOString(),
      };

      const bots = [...state.registeredBots, bot];
      saveBots(bots);
      return { registeredBots: bots };
    });
  },

  unregisterBot: (did: string) => {
    set((state) => {
      const bots = state.registeredBots.filter((b) => b.definition.bot.did !== did);
      saveBots(bots);
      return { registeredBots: bots };
    });
  },

  updateBotDefinition: (did: string, definition: BsafBotDefinition) => {
    set((state) => {
      const bots = state.registeredBots.map((bot) => {
        if (bot.definition.bot.did !== did) return bot;

        // Preserve existing filter settings, add new options as enabled, remove deleted options
        const filterSettings: Record<string, string[]> = {};
        for (const filter of definition.filters) {
          const existing = bot.filterSettings[filter.tag] ?? [];
          const validValues = new Set(filter.options.map((o) => o.value));
          // Keep existing enabled values that are still valid, add new ones
          const kept = existing.filter((v) => validValues.has(v));
          const newValues = filter.options
            .map((o) => o.value)
            .filter((v) => !existing.includes(v) && !kept.includes(v));
          filterSettings[filter.tag] = [...kept, ...newValues];
        }

        return { ...bot, definition, filterSettings };
      });
      saveBots(bots);
      return { registeredBots: bots };
    });
  },

  setFilterOptions: (did: string, tag: string, values: string[]) => {
    set((state) => {
      const bots = state.registeredBots.map((bot) => {
        if (bot.definition.bot.did !== did) return bot;
        return {
          ...bot,
          filterSettings: { ...bot.filterSettings, [tag]: values },
        };
      });
      saveBots(bots);
      return { registeredBots: bots };
    });
  },

  setLastCheckedAt: (did: string, timestamp: string) => {
    set((state) => {
      const bots = state.registeredBots.map((bot) => {
        if (bot.definition.bot.did !== did) return bot;
        return { ...bot, lastCheckedAt: timestamp };
      });
      saveBots(bots);
      return { registeredBots: bots };
    });
  },
}));
