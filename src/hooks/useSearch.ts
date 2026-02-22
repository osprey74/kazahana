import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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

export function useSearchActorsTypeahead(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ["searchActorsTypeahead", debouncedQuery],
    queryFn: async () => {
      const agent = getAgent();
      const res = await agent.searchActorsTypeahead({
        q: debouncedQuery,
        limit: 8,
      });
      return res.data.actors;
    },
    enabled: debouncedQuery.length > 0,
    staleTime: 30_000,
  });
}
