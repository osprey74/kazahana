import { useInfiniteQuery } from "@tanstack/react-query";
import { getAgent } from "../lib/agent";
import type { FeedSource } from "../stores/feedStore";

export function useFeed(feed: FeedSource) {
  return useInfiniteQuery({
    queryKey: ["feed", feed.type, feed.type !== "home" ? feed.uri : null],
    queryFn: async ({ pageParam }) => {
      const agent = getAgent();
      if (feed.type === "custom") {
        const res = await agent.app.bsky.feed.getFeed({
          feed: feed.uri,
          limit: 50,
          cursor: pageParam as string | undefined,
        });
        return res.data;
      }
      // list
      const res = await agent.app.bsky.feed.getListFeed({
        list: (feed as Extract<FeedSource, { type: "list" }>).uri,
        limit: 50,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: feed.type !== "home",
    staleTime: 30_000,
  });
}
