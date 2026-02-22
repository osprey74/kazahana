import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { getAgent } from "../lib/agent";
import { useSettingsStore } from "../stores/settingsStore";

const MAX_POSTS = 1024;
const PAGE_SIZE = 100;

/** Unique key for a feed item (handles reposts of the same post) */
function feedItemKey(item: FeedViewPost): string {
  const reason = item.reason as { by?: { did?: string } } | undefined;
  if (reason?.by?.did) {
    return `${item.post.uri}:repost:${reason.by.did}`;
  }
  return item.post.uri;
}

// ── Module-level persistence (survives tab-switch unmount/remount) ──
let _prepended: FeedViewPost[] = [];
let _dividerUri: string | null = null;
let _readingPos: string | null = null;
let _wasAtTop = true;

export function useTimeline() {
  const pollInterval = useSettingsStore((s) => s.pollInterval);

  // Initialise from persisted values so tab-switch restores state
  const [prependedPosts, setPrependedPosts] = useState<FeedViewPost[]>(
    () => _prepended,
  );
  const [dividerPostUri, setDividerPostUri] = useState<string | null>(
    () => _dividerUri,
  );

  const readingPositionRef = useRef<string | null>(_readingPos);
  const wasAtTopRef = useRef(_wasAtTop);

  // Sync state changes back to module-level persistence
  useEffect(() => {
    _prepended = prependedPosts;
  }, [prependedPosts]);
  useEffect(() => {
    _dividerUri = dividerPostUri;
  }, [dividerPostUri]);

  const query = useInfiniteQuery({
    queryKey: ["timeline"],
    queryFn: async ({ pageParam }) => {
      const agent = getAgent();
      const res = await agent.getTimeline({
        limit: PAGE_SIZE,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Base items from infinite query (initial load + pagination)
  const baseItems = useMemo(() => {
    if (!query.data?.pages) return [];
    return query.data.pages.flatMap((page) => page.feed);
  }, [query.data]);

  // Merge prepended + base, deduplicate, cap at MAX_POSTS
  const items = useMemo(() => {
    const seen = new Set<string>();
    const result: FeedViewPost[] = [];
    for (const item of [...prependedPosts, ...baseItems]) {
      const key = feedItemKey(item);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    return result.slice(0, MAX_POSTS);
  }, [prependedPosts, baseItems]);

  const itemsRef = useRef<FeedViewPost[]>([]);
  itemsRef.current = items;

  // Called by TimelineView via Virtuoso's rangeChanged
  const reportViewportTop = useCallback((topIndex: number) => {
    const isAtTop = topIndex <= 0;

    if (isAtTop && !wasAtTopRef.current) {
      // User scrolled back to top — clear bookmark and divider
      readingPositionRef.current = null;
      _readingPos = null;
      setDividerPostUri(null);
    } else if (!isAtTop && wasAtTopRef.current) {
      // User just started scrolling down — capture reading position
      const pos = itemsRef.current[0]?.post.uri ?? null;
      readingPositionRef.current = pos;
      _readingPos = pos;
    }

    wasAtTopRef.current = isAtTop;
    _wasAtTop = isAtTop;
  }, []);

  // Poll for new posts every POLL_INTERVAL
  useEffect(() => {
    if (query.isLoading || query.isError) return;

    const poll = async () => {
      try {
        const current = itemsRef.current;
        if (current.length === 0) return;

        const agent = getAgent();
        const res = await agent.getTimeline({ limit: PAGE_SIZE });
        const latestFeed = res.data.feed;

        const existingKeys = new Set(current.map(feedItemKey));
        const newPosts = latestFeed.filter(
          (p) => !existingKeys.has(feedItemKey(p)),
        );

        if (newPosts.length > 0) {
          // Place divider at reading position (scrolled down) or list head (at top)
          const readPos = readingPositionRef.current;
          setDividerPostUri(readPos ?? current[0]?.post.uri ?? null);
          setPrependedPosts((prev) => [...newPosts, ...prev]);
        }
      } catch {
        // Silently ignore poll errors
      }
    };

    const id = setInterval(poll, pollInterval * 1000);
    return () => clearInterval(id);
  }, [query.isLoading, query.isError, pollInterval]);

  // Refetch that also clears all state
  const refetch = useCallback(() => {
    setPrependedPosts([]);
    setDividerPostUri(null);
    readingPositionRef.current = null;
    wasAtTopRef.current = true;
    _prepended = [];
    _dividerUri = null;
    _readingPos = null;
    _wasAtTop = true;
    return query.refetch();
  }, [query.refetch]);

  return {
    items,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch,
    dividerPostUri,
    reportViewportTop,
  };
}
