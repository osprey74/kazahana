import { getAgent } from "./agent";
import i18n from "../i18n";

const SUPPORTED_LANGUAGES = [
  "ja", "en", "pt", "de", "zh-TW", "zh-CN", "fr", "ko", "es", "ru", "id",
];

/**
 * Sync app language from Bluesky user's post language.
 * Priority: manual kazahana setting > Bluesky post language > device locale.
 */
export async function syncLanguageFromBluesky(): Promise<void> {
  // Skip if user has manually set a language in kazahana settings
  if (localStorage.getItem("kazahana-lang")) return;

  try {
    const agent = getAgent();
    if (!agent.session?.did) return;

    const res = await agent.getAuthorFeed({
      actor: agent.session.did,
      limit: 20,
    });

    // Count language occurrences from recent posts
    const langCounts = new Map<string, number>();
    for (const item of res.data.feed) {
      const post = item.post.record as { langs?: string[] };
      if (post.langs) {
        for (const lang of post.langs) {
          const normalized = lang.toLowerCase();
          langCounts.set(normalized, (langCounts.get(normalized) || 0) + 1);
        }
      }
    }

    if (langCounts.size === 0) return;

    // Find the most common language
    let topLang = "";
    let topCount = 0;
    for (const [lang, count] of langCounts) {
      if (count > topCount) {
        topLang = lang;
        topCount = count;
      }
    }

    // Match against supported languages (exact match, then prefix match)
    const matched =
      SUPPORTED_LANGUAGES.find((s) => s.toLowerCase() === topLang) ||
      SUPPORTED_LANGUAGES.find((s) => s.toLowerCase() === topLang.split("-")[0]) ||
      SUPPORTED_LANGUAGES.find((s) => s.split("-")[0].toLowerCase() === topLang.split("-")[0]);

    if (matched && matched !== i18n.language) {
      await i18n.changeLanguage(matched);
    }
  } catch {
    // Non-critical: keep current language on failure
  }
}
