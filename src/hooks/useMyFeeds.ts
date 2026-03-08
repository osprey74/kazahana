import { useQuery } from "@tanstack/react-query";
import { getAgent } from "../lib/agent";

interface SavedFeed {
  uri: string;
  name: string;
  avatar?: string;
  pinned: boolean;
}

interface SavedList {
  uri: string;
  name: string;
  avatar?: string;
}

/** Shared hook for fetching parsed Bluesky preferences (cached by React Query) */
function useBskyPreferences() {
  return useQuery({
    queryKey: ["bskyPreferences"],
    queryFn: async () => {
      const agent = getAgent();
      return agent.getPreferences();
    },
    staleTime: 5 * 60_000,
  });
}

export function useSavedFeeds() {
  const { data: prefs, isLoading: prefsLoading } = useBskyPreferences();

  return useQuery({
    queryKey: ["savedFeeds", prefs?.savedFeeds],
    queryFn: async () => {
      const savedFeeds = prefs?.savedFeeds ?? [];

      // Extract feed generators from preferences
      const feedEntries = savedFeeds.filter((f) => f.type === "feed");
      if (feedEntries.length === 0) return [] as SavedFeed[];

      const pinnedMap = new Map(feedEntries.map((e) => [e.value, e.pinned]));

      // getFeedGenerators accepts max 25 URIs per call
      const agent = getAgent();
      const allFeeds: SavedFeed[] = [];
      const feedUris = feedEntries.map((e) => e.value);
      for (let i = 0; i < feedUris.length; i += 25) {
        const batch = feedUris.slice(i, i + 25);
        const res = await agent.app.bsky.feed.getFeedGenerators({ feeds: batch });
        for (const f of res.data.feeds) {
          allFeeds.push({
            uri: f.uri,
            name: f.displayName,
            avatar: f.avatar,
            pinned: pinnedMap.get(f.uri) ?? false,
          });
        }
      }

      // Preserve the order from preferences
      const orderMap = new Map(feedUris.map((uri, i) => [uri, i]));
      allFeeds.sort((a, b) => (orderMap.get(a.uri) ?? 999) - (orderMap.get(b.uri) ?? 999));

      return allFeeds;
    },
    enabled: !prefsLoading,
    staleTime: 5 * 60_000,
  });
}

export function useMyLists() {
  const { data: prefs, isLoading: prefsLoading } = useBskyPreferences();

  return useQuery({
    queryKey: ["myLists", prefs?.savedFeeds],
    queryFn: async () => {
      const agent = getAgent();
      const did = agent.session?.did;

      // Get self-created curate lists
      const selfLists: SavedList[] = [];
      if (did) {
        const res = await agent.app.bsky.graph.getLists({
          actor: did,
          limit: 50,
        });
        for (const l of res.data.lists) {
          if (l.purpose === "app.bsky.graph.defs#curatelist") {
            selfLists.push({ uri: l.uri, name: l.name, avatar: l.avatar });
          }
        }
      }

      // Get lists saved in preferences (includes lists from other users)
      const savedFeeds = prefs?.savedFeeds ?? [];
      const savedListEntries = savedFeeds.filter((f) => f.type === "list");
      const prefLists: SavedList[] = [];
      for (const entry of savedListEntries) {
        try {
          const res = await agent.app.bsky.graph.getList({ list: entry.value, limit: 1 });
          const list = res.data.list;
          if (list.purpose === "app.bsky.graph.defs#curatelist") {
            prefLists.push({ uri: list.uri, name: list.name, avatar: list.avatar });
          }
        } catch {
          // Skip lists that no longer exist or are inaccessible
        }
      }

      // Merge: preference-saved lists first, then self-created (deduplicated)
      const seen = new Set<string>();
      const result: SavedList[] = [];
      for (const l of [...prefLists, ...selfLists]) {
        if (!seen.has(l.uri)) {
          seen.add(l.uri);
          result.push(l);
        }
      }

      return result;
    },
    enabled: !prefsLoading,
    staleTime: 5 * 60_000,
  });
}
