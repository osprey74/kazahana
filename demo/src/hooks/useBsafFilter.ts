import { useState, useMemo, useCallback } from "react";
import type { BsafPost, BotDefinition, FilterState } from "../types/bsaf";
import {
  parseBsafTags,
  postPassesFilter,
  detectDuplicates,
} from "../utils/bsafParser";

export function useBsafFilter(posts: BsafPost[], botDef: BotDefinition) {
  const [bsafEnabled, setBsafEnabled] = useState(true);
  const [filters, setFilters] = useState<FilterState>(() => {
    const initial: FilterState = {};
    for (const f of botDef.filters) {
      // Enable all by default
      initial[f.tag] = new Set(f.options.map((o) => o.value));
    }
    return initial;
  });

  // Parse BSAF tags for all posts
  const parsedPosts = useMemo(() => {
    return posts.map((post) => ({
      ...post,
      bsaf: parseBsafTags(post.tags),
    }));
  }, [posts]);

  // Detect duplicates
  const duplicateMap = useMemo(() => {
    if (!bsafEnabled) return new Map<string, string[]>();
    return detectDuplicates(parsedPosts);
  }, [parsedPosts, bsafEnabled]);

  // Get the set of post IDs that are duplicates (not the first one)
  const hiddenDuplicateIds = useMemo(() => {
    const hidden = new Set<string>();
    for (const postIds of duplicateMap.values()) {
      if (postIds.length > 1) {
        // Keep first, hide rest
        for (let i = 1; i < postIds.length; i++) {
          hidden.add(postIds[i]);
        }
      }
    }
    return hidden;
  }, [duplicateMap]);

  // Get duplicate count for a post
  const getDuplicateCount = useCallback(
    (postId: string): number => {
      for (const postIds of duplicateMap.values()) {
        if (postIds[0] === postId && postIds.length > 1) {
          return postIds.length - 1;
        }
      }
      return 0;
    },
    [duplicateMap]
  );

  // Filter posts
  const filteredPosts = useMemo(() => {
    return parsedPosts.filter((post) => {
      if (!bsafEnabled) return true; // Show all when BSAF disabled

      // Non-BSAF posts always shown
      if (!post.bsaf) return true;

      // Hide duplicates
      if (hiddenDuplicateIds.has(post.id)) return false;

      // Apply filters
      return postPassesFilter(post.bsaf, filters);
    });
  }, [parsedPosts, bsafEnabled, filters, hiddenDuplicateIds]);

  const toggleFilter = useCallback(
    (tag: string, value: string) => {
      setFilters((prev) => {
        const newSet = new Set(prev[tag]);
        if (newSet.has(value)) {
          newSet.delete(value);
        } else {
          newSet.add(value);
        }
        return { ...prev, [tag]: newSet };
      });
    },
    []
  );

  const selectAllFilter = useCallback(
    (tag: string) => {
      const allValues = botDef.filters
        .find((f) => f.tag === tag)
        ?.options.map((o) => o.value);
      if (allValues) {
        setFilters((prev) => ({
          ...prev,
          [tag]: new Set(allValues),
        }));
      }
    },
    [botDef]
  );

  const clearAllFilter = useCallback((tag: string) => {
    setFilters((prev) => ({
      ...prev,
      [tag]: new Set<string>(),
    }));
  }, []);

  return {
    bsafEnabled,
    setBsafEnabled,
    filters,
    filteredPosts,
    toggleFilter,
    selectAllFilter,
    clearAllFilter,
    getDuplicateCount,
  };
}
