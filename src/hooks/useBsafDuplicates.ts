import { useMemo } from "react";
import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { useBsafStore } from "../stores/bsafStore";
import { parseBsafTags } from "../lib/bsaf";

export interface BsafDuplicateInfo {
  /** Post URIs that are duplicates of this post (this post is the primary) */
  duplicateUris: string[];
  /** Handles of duplicate bots */
  duplicateHandles: string[];
}

/**
 * Compute BSAF duplicate groups from a list of feed items.
 * Returns a Map from post URI to duplicate info (only for primary posts),
 * and a Set of post URIs that should be hidden (secondary duplicates).
 */
export function useBsafDuplicates(items: FeedViewPost[]) {
  const bsafEnabled = useBsafStore((s) => s.bsafEnabled);

  return useMemo(() => {
    const duplicateInfo = new Map<string, BsafDuplicateInfo>();
    const hiddenDuplicates = new Set<string>();

    if (!bsafEnabled) return { duplicateInfo, hiddenDuplicates };

    // Group BSAF posts by event key (type+value+time+target)
    const groups = new Map<string, { uri: string; handle: string }[]>();

    for (const item of items) {
      const record = item.post.record as { tags?: string[] };
      if (!record.tags) continue;

      const parsed = parseBsafTags(record.tags);
      if (!parsed) continue;

      const key = `${parsed.type}|${parsed.value}|${parsed.time}|${parsed.target}`;
      const entry = { uri: item.post.uri, handle: item.post.author.handle };

      const group = groups.get(key);
      if (group) {
        group.push(entry);
      } else {
        groups.set(key, [entry]);
      }
    }

    // Process groups: first post is primary, rest are hidden duplicates
    for (const group of groups.values()) {
      if (group.length <= 1) continue;

      const [primary, ...rest] = group;
      duplicateInfo.set(primary.uri, {
        duplicateUris: rest.map((r) => r.uri),
        duplicateHandles: rest.map((r) => r.handle),
      });
      for (const dup of rest) {
        hiddenDuplicates.add(dup.uri);
      }
    }

    return { duplicateInfo, hiddenDuplicates };
  }, [items, bsafEnabled]);
}
