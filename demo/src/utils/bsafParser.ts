import type { BsafPost, BsafTag, FilterState } from "../types/bsaf";

/**
 * Parse BSAF tags from a post's tags array.
 * Returns BsafTag if valid BSAF post, undefined otherwise.
 */
export function parseBsafTags(tags: string[]): BsafTag | undefined {
  if (!tags || tags.length === 0) return undefined;

  // Must contain bsaf:v1 protocol identifier
  const hasProtocol = tags.some((t) => t.startsWith("bsaf:"));
  if (!hasProtocol) return undefined;

  const parsed: Partial<BsafTag> = {};

  for (const tag of tags) {
    const colonIdx = tag.indexOf(":");
    if (colonIdx === -1) continue;

    const prefix = tag.substring(0, colonIdx);
    const val = tag.substring(colonIdx + 1);

    switch (prefix) {
      case "bsaf":
        parsed.protocol = `bsaf:${val}`;
        break;
      case "type":
        parsed.type = val;
        break;
      case "value":
        parsed.value = val;
        break;
      case "time":
        parsed.time = val;
        break;
      case "target":
        parsed.target = val;
        break;
      case "source":
        parsed.source = val;
        break;
    }
  }

  // Validate all required fields
  if (
    parsed.protocol &&
    parsed.type &&
    parsed.value &&
    parsed.time &&
    parsed.target &&
    parsed.source
  ) {
    return parsed as BsafTag;
  }

  return undefined;
}

/**
 * Check if a post passes the current filter settings.
 */
export function postPassesFilter(
  bsaf: BsafTag,
  filters: FilterState
): boolean {
  for (const [tag, enabledValues] of Object.entries(filters)) {
    if (enabledValues.size === 0) continue; // No filter set = pass all

    const postValue = bsaf[tag as keyof BsafTag];
    if (postValue && !enabledValues.has(postValue)) {
      return false;
    }
  }
  return true;
}

/**
 * Detect duplicate BSAF posts (same event from different bots).
 * Returns a map of eventKey -> array of post IDs.
 */
export function detectDuplicates(
  posts: BsafPost[]
): Map<string, string[]> {
  const eventMap = new Map<string, string[]>();

  for (const post of posts) {
    if (!post.bsaf) continue;

    const key = `${post.bsaf.type}|${post.bsaf.value}|${post.bsaf.time}|${post.bsaf.target}`;
    const existing = eventMap.get(key) || [];
    existing.push(post.id);
    eventMap.set(key, existing);
  }

  return eventMap;
}

/**
 * Earthquake intensity values (raw format per BSAF spec)
 */
const EARTHQUAKE_INTENSITIES = new Set([
  "1", "2", "3", "4", "5-", "5+", "6-", "6+", "7",
]);

/**
 * Get severity color based on BSAF value (raw format)
 *
 * Earthquake: "1","2","3","4","5-","5+","6-","6+","7"
 * Weather: "info","advisory","warning","severe-warning","special-warning"
 */
export function getSeverityColor(value: string): {
  bg: string;
  border: string;
  text: string;
  badge: string;
  icon: string;
} {
  // Earthquake intensity (raw value format)
  if (EARTHQUAKE_INTENSITIES.has(value)) {
    if (["6-", "6+", "7"].includes(value))
      return {
        bg: "#FDF2F8",
        border: "#BE185D",
        text: "#831843",
        badge: "#BE185D",
        icon: "🟣",
      };
    if (["5-", "5+"].includes(value))
      return {
        bg: "#FEF2F2",
        border: "#DC2626",
        text: "#7F1D1D",
        badge: "#DC2626",
        icon: "🔴",
      };
    if (value === "4")
      return {
        bg: "#FFFBEB",
        border: "#D97706",
        text: "#78350F",
        badge: "#D97706",
        icon: "🟡",
      };
    return {
      bg: "#F0FDF4",
      border: "#16A34A",
      text: "#14532D",
      badge: "#16A34A",
      icon: "🟢",
    };
  }

  // Weather severity
  switch (value) {
    case "special-warning":
      return {
        bg: "#FDF2F8",
        border: "#BE185D",
        text: "#831843",
        badge: "#BE185D",
        icon: "🟣",
      };
    case "severe-warning":
    case "warning":
      return {
        bg: "#FFFBEB",
        border: "#D97706",
        text: "#78350F",
        badge: "#D97706",
        icon: "🟠",
      };
    case "advisory":
      return {
        bg: "#FEFCE8",
        border: "#CA8A04",
        text: "#713F12",
        badge: "#CA8A04",
        icon: "🟡",
      };
    default:
      return {
        bg: "#EFF6FF",
        border: "#2563EB",
        text: "#1E3A5F",
        badge: "#2563EB",
        icon: "ℹ️",
      };
  }
}

/**
 * Get Japanese label for value tag (raw format -> display label)
 */
export function getValueLabel(value: string): string {
  const map: Record<string, string> = {
    "1": "震度1",
    "2": "震度2",
    "3": "震度3",
    "4": "震度4",
    "5-": "震度5弱",
    "5+": "震度5強",
    "6-": "震度6弱",
    "6+": "震度6強",
    "7": "震度7",
    info: "情報",
    advisory: "注意報",
    warning: "警報",
    "severe-warning": "重大警報",
    "special-warning": "特別警報",
  };
  return map[value] || value;
}

/**
 * Get Japanese label for type tag
 */
export function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    earthquake: "地震",
    tsunami: "津波",
    eruption: "噴火",
    ashfall: "降灰",
    "weather-warning": "気象警報",
    "special-warning": "特別警報",
    "landslide-warning": "土砂災害",
    "tornado-warning": "竜巻注意",
    "heavy-rain": "記録的大雨",
  };
  return map[type] || type;
}

/**
 * Get Japanese label for target tag
 */
export function getTargetLabel(target: string): string {
  const map: Record<string, string> = {
    "jp-hokkaido": "北海道",
    "jp-tohoku": "東北",
    "jp-kanto": "関東",
    "jp-hokuriku": "北陸",
    "jp-chubu": "中部",
    "jp-kinki": "近畿",
    "jp-chugoku": "中国",
    "jp-shikoku": "四国",
    "jp-kyushu": "九州",
    "jp-okinawa": "沖縄",
  };
  return map[target] || target;
}

/**
 * Format ISO 8601 time to Japanese local time string
 */
export function formatJstTime(isoTime: string): string {
  const date = new Date(isoTime);
  return date.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
