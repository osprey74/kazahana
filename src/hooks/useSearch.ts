import { useInfiniteQuery } from "@tanstack/react-query";
import { getAgent } from "../lib/agent";

export function useSearchActors(query: string) {
  return useInfiniteQuery({
    queryKey: ["searchActors", query],
    queryFn: async ({ pageParam }) => {
      const agent = getAgent();
      const res = await agent.searchActors({
        term: query,
        limit: 20,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: query.length > 0,
    staleTime: 60_000,
  });
}

export function useSearchPosts(query: string) {
  return useInfiniteQuery({
    queryKey: ["searchPosts", query],
    queryFn: async ({ pageParam }) => {
      const agent = getAgent();
      const res = await agent.app.bsky.feed.searchPosts({
        q: query,
        limit: 20,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: query.length > 0,
    staleTime: 60_000,
  });
}
