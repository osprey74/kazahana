import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getAgent } from "../lib/agent";

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: async ({ pageParam }) => {
      const agent = getAgent();
      const res = await agent.listNotifications({
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

export function useUnreadCount() {
  return useQuery({
    queryKey: ["unreadCount"],
    queryFn: async () => {
      const agent = getAgent();
      const res = await agent.countUnreadNotifications();
      return res.data.count;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    try {
      const agent = getAgent();
      await agent.updateSeenNotifications();
      queryClient.setQueryData(["unreadCount"], 0);
    } catch {
      // non-critical
    }
  }, [queryClient]);
}
