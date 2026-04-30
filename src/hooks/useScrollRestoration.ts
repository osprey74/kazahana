import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { loadScrollPosition, saveScrollPosition } from "../lib/scrollRestoration";

interface UseScrollRestorationParams {
  items: FeedViewPost[];
  firstItemIndex?: number;
}

interface RangeChange {
  startIndex: number;
  endIndex: number;
}

interface UseScrollRestorationResult {
  initialTopMostItemIndex: number;
  onRangeChanged: (range: RangeChange) => void;
}

/**
 * Persists Virtuoso scroll position per react-router history entry, so
 * navigating away and coming back (browser-style) restores the previous view.
 */
export function useScrollRestoration({
  items,
  firstItemIndex = 0,
}: UseScrollRestorationParams): UseScrollRestorationResult {
  const location = useLocation();
  const initialIndexRef = useRef<number | null>(null);
  const trackRef = useRef(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Lazily resolve the initial index on the first render where items are present.
  // Computed during render (not in an effect) so Virtuoso can mount with the right offset.
  // Note: `initialTopMostItemIndex` is in data-array index space — Virtuoso applies
  // the `firstItemIndex` offset internally. Don't add it here.
  if (initialIndexRef.current === null && items.length > 0) {
    const saved = loadScrollPosition(location.key);
    if (saved) {
      const idx = items.findIndex((it) => it.post.uri === saved.topUri);
      initialIndexRef.current = idx >= 0 ? idx : 0;
    } else {
      initialIndexRef.current = 0;
    }
    trackRef.current = true;
  }

  // A new history entry resets restoration so the next mount picks up its own saved position.
  useEffect(() => {
    initialIndexRef.current = null;
    trackRef.current = false;
  }, [location.key]);

  const onRangeChanged = useCallback(
    (range: RangeChange) => {
      if (!trackRef.current) return;
      const localIndex = range.startIndex - firstItemIndex;
      const item = itemsRef.current[localIndex];
      if (!item) return;
      saveScrollPosition(location.key, { topUri: item.post.uri });
    },
    [firstItemIndex, location.key],
  );

  return {
    initialTopMostItemIndex: initialIndexRef.current ?? 0,
    onRangeChanged,
  };
}
