import type { BsafBotDefinition } from "../types/bsaf";
import { useBsafStore } from "../stores/bsafStore";
import { fetchBotDefinitionFromUrl } from "./bsaf";

/**
 * Check all registered BSAF bots for definition updates.
 * Called once on app startup when BSAF is enabled.
 * Batches all store mutations into a single update to avoid cascading re-renders.
 */
export async function checkBsafBotUpdates(): Promise<void> {
  const { registeredBots } = useBsafStore.getState();

  // Collect results first, then apply in one batch
  const updates = new Map<string, { definition?: BsafBotDefinition; lastCheckedAt: string }>();

  for (const bot of registeredBots) {
    const { self_url } = bot.definition;
    if (!self_url) continue;

    try {
      const newDef = await fetchBotDefinitionFromUrl(self_url);
      const now = new Date().toISOString();
      const entry: { definition?: BsafBotDefinition; lastCheckedAt: string } = { lastCheckedAt: now };

      if (newDef.updated_at !== bot.definition.updated_at) {
        entry.definition = newDef;
      }

      updates.set(bot.definition.bot.did, entry);
    } catch {
      console.warn(`BSAF: Failed to check updates for ${bot.definition.bot.name}`);
    }
  }

  if (updates.size === 0) return;

  // Apply all updates in a single store mutation
  useBsafStore.setState((state) => {
    const newBots = state.registeredBots.map((bot) => {
      const update = updates.get(bot.definition.bot.did);
      if (!update) return bot;

      let updated = { ...bot, lastCheckedAt: update.lastCheckedAt };

      if (update.definition) {
        // Merge filter settings: keep existing valid values, add new options as enabled
        const filterSettings: Record<string, string[]> = {};
        for (const filter of update.definition.filters) {
          const existing = bot.filterSettings[filter.tag] ?? [];
          const validValues = new Set(filter.options.map((o) => o.value));
          const kept = existing.filter((v) => validValues.has(v));
          const newValues = filter.options
            .map((o) => o.value)
            .filter((v) => !existing.includes(v) && !kept.includes(v));
          filterSettings[filter.tag] = [...kept, ...newValues];
        }
        updated = { ...updated, definition: update.definition, filterSettings };
      }

      return updated;
    });

    localStorage.setItem("kazahana-bsaf-bots", JSON.stringify(newBots));
    return { registeredBots: newBots };
  });
}
