import { useQuery } from "@tanstack/react-query";
import { getAgent } from "../lib/agent";

interface SavedFeed {
  uri: string;
  name: string;
  avatar?: string;
}

interface SavedList {
  uri: string;
  name: string;
  avatar?: string;
}

export function useSavedFeeds() {
  return useQuery({
    queryKey: ["savedFeeds"],
    queryFn: async () => {
      const agent = getAgent();
      const prefsRes = await agent.app.bsky.actor.getPreferences();
      const prefs = prefsRes.data.preferences;

      // Extract pinned feed URIs from savedFeedsPrefV2
      const feedUris: string[] = [];
      for (const pref of prefs) {
        if (pref.$type === "app.bsky.actor.defs#savedFeedsPrefV2") {
          const items = (pref as { items?: Array<{ type: string; value: string; pinned: boolean }> }).items;
          if (items) {
            for (const item of items) {
              if (item.type === "feed" && item.pinned) {
                feedUris.push(item.value);
              }
            }
          }
        }
      }

      if (feedUris.length === 0) return [] as SavedFeed[];

      const res = await agent.app.bsky.feed.getFeedGenerators({ feeds: feedUris });
      return res.data.feeds.map((f) => ({
        uri: f.uri,
        name: f.displayName,
        avatar: f.avatar,
      })) as SavedFeed[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useMyLists() {
  return useQuery({
    queryKey: ["myLists"],
    queryFn: async () => {
      const agent = getAgent();
      const did = agent.session?.did;
      if (!did) return [] as SavedList[];

      const res = await agent.app.bsky.graph.getLists({
        actor: did,
        limit: 50,
      });

      return res.data.lists
        .filter((l) => l.purpose === "app.bsky.graph.defs#curatelist")
        .map((l) => ({
          uri: l.uri,
          name: l.name,
          avatar: l.avatar,
        })) as SavedList[];
    },
    staleTime: 5 * 60_000,
  });
}
