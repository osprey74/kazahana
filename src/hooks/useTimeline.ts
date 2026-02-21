import { useInfiniteQuery } from "@tanstack/react-query";
import { getAgent } from "../lib/agent";

export function useTimeline() {
  return useInfiniteQuery({
    queryKey: ["timeline"],
    queryFn: async ({ pageParam }) => {
      const agent = getAgent();
      const res = await agent.getTimeline({
        limit: 30,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
