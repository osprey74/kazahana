import { fetch } from "@tauri-apps/plugin-http";
import type { BsafBotDefinition, BsafParsedTags, BsafRegisteredBot } from "../types/bsaf";

/**
 * Validate a parsed JSON object as a BSAF Bot Definition.
 * Returns the typed definition on success, null on failure.
 */
export function validateBotDefinition(json: unknown): BsafBotDefinition | null {
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;

  if (typeof obj.bsaf_schema !== "string") return null;
  if (typeof obj.updated_at !== "string") return null;
  if (typeof obj.self_url !== "string") return null;

  const bot = obj.bot as Record<string, unknown> | undefined;
  if (!bot || typeof bot !== "object") return null;
  if (typeof bot.handle !== "string") return null;
  if (typeof bot.did !== "string") return null;
  if (typeof bot.name !== "string") return null;
  if (typeof bot.description !== "string") return null;
  if (typeof bot.source !== "string") return null;

  if (!Array.isArray(obj.filters)) return null;
  for (const filter of obj.filters) {
    if (!filter || typeof filter !== "object") return null;
    if (typeof filter.tag !== "string") return null;
    if (typeof filter.label !== "string") return null;
    if (!Array.isArray(filter.options)) return null;
    for (const opt of filter.options) {
      if (!opt || typeof opt !== "object") return null;
      if (typeof opt.value !== "string") return null;
      if (typeof opt.label !== "string") return null;
    }
  }

  return json as BsafBotDefinition;
}

/**
 * Parse BSAF tags from a post's tags array.
 * Returns null if the post is not a BSAF post (missing "bsaf:v1").
 */
export function parseBsafTags(tags: string[]): BsafParsedTags | null {
  if (!tags.includes("bsaf:v1")) return null;

  const parsed: Partial<BsafParsedTags> = { version: "v1" };

  for (const tag of tags) {
    const colonIdx = tag.indexOf(":");
    if (colonIdx === -1) continue;
    const key = tag.slice(0, colonIdx);
    const val = tag.slice(colonIdx + 1);

    switch (key) {
      case "type": parsed.type = val; break;
      case "value": parsed.value = val; break;
      case "time": parsed.time = val; break;
      case "target": parsed.target = val; break;
      case "source": parsed.source = val; break;
    }
  }

  if (!parsed.type || !parsed.value || !parsed.time || !parsed.target || !parsed.source) {
    return null;
  }

  return parsed as BsafParsedTags;
}

/**
 * Determine if a BSAF post should be shown based on user's filter settings.
 */
export function shouldShowBsafPost(parsed: BsafParsedTags, bot: BsafRegisteredBot): boolean {
  for (const filter of bot.definition.filters) {
    const enabledValues = bot.filterSettings[filter.tag];
    if (!enabledValues) continue;

    // Get the post's value for this filter tag
    const postValue = (parsed as unknown as Record<string, string>)[filter.tag];
    if (postValue === undefined) continue;

    // If the value is not in the enabled list, hide the post
    if (!enabledValues.includes(postValue)) return false;
  }
  return true;
}

/**
 * Check if two BSAF posts are duplicates (same event from different bots).
 */
export function isBsafDuplicate(a: BsafParsedTags, b: BsafParsedTags): boolean {
  return a.type === b.type &&
    a.value === b.value &&
    a.time === b.time &&
    a.target === b.target &&
    a.source !== b.source;
}

/**
 * Earthquake intensity values (raw format per BSAF spec)
 */
const EARTHQUAKE_INTENSITIES = new Set([
  "1", "2", "3", "4", "5-", "5+", "6-", "6+", "7",
]);

/**
 * Get severity border color based on BSAF value (raw format).
 *
 * Earthquake: "1","2","3","4","5-","5+","6-","6+","7"
 * Weather: "info","advisory","warning","severe-warning","special-warning"
 */
export function getSeverityBorderColor(value: string): string {
  if (EARTHQUAKE_INTENSITIES.has(value)) {
    if (["6-", "6+", "7"].includes(value)) return "#BE185D";
    if (["5-", "5+"].includes(value)) return "#DC2626";
    if (value === "4") return "#D97706";
    return "#16A34A";
  }
  switch (value) {
    case "special-warning": return "#BE185D";
    case "severe-warning":
    case "warning": return "#D97706";
    case "advisory": return "#CA8A04";
    default: return "#2563EB";
  }
}

/**
 * Convert GitHub blob/tree URLs to raw content URLs.
 * e.g. https://github.com/user/repo/blob/main/file.json
 *   → https://raw.githubusercontent.com/user/repo/main/file.json
 */
function toRawUrl(url: string): string {
  const match = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/);
  if (match) {
    return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}`;
  }
  return url;
}

/**
 * Fetch and validate a Bot Definition JSON from a URL.
 * Uses Tauri HTTP plugin to bypass CORS restrictions.
 * Automatically converts GitHub blob URLs to raw URLs.
 */
export async function fetchBotDefinitionFromUrl(url: string): Promise<BsafBotDefinition> {
  const rawUrl = toRawUrl(url);
  const res = await fetch(rawUrl);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const json = await res.json();
  const definition = validateBotDefinition(json);
  if (!definition) {
    throw new Error("Invalid Bot Definition JSON");
  }
  return definition;
}
