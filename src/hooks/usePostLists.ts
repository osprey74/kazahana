import { useInfiniteQuery } from "@tanstack/react-query";
import { getAgent } from "../lib/agent";

export function useLikes(uri: string) {
  return useInfiniteQuery({
    queryKey: ["likes", uri],
    queryFn: async ({ pageParam }) => {
      const agent = getAgent();
      const res = await agent.getLikes({
        uri,
        limit: 20,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: !!uri,
    staleTime: 30_000,
  });
}

export function useRepostedBy(uri: string) {
  return useInfiniteQuery({
    queryKey: ["repostedBy", uri],
    queryFn: async ({ pageParam }) => {
      const agent = getAgent();
      const res = await agent.app.bsky.feed.getRepostedBy({
        uri,
        limit: 20,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: !!uri,
    staleTime: 30_000,
  });
}

export function useQuotes(uri: string) {
  return useInfiniteQuery({
    queryKey: ["quotes", uri],
    queryFn: async ({ pageParam }) => {
      const agent = getAgent();
      const res = await agent.app.bsky.feed.getQuotes({
        uri,
        limit: 20,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: !!uri,
    staleTime: 30_000,
  });
}
