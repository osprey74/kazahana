import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import type { Notification } from "@atproto/api/dist/client/types/app/bsky/notification/listNotifications";
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

export function useSubjectPosts(notifications: Notification[]) {
  const uris = useMemo(() => {
    const set = new Set<string>();
    for (const n of notifications) {
      if ((n.reason === "like" || n.reason === "repost") && n.reasonSubject) {
        set.add(n.reasonSubject);
      }
    }
    return [...set];
  }, [notifications]);

  const { data } = useQuery({
    queryKey: ["subjectPosts", uris],
    queryFn: async () => {
      if (uris.length === 0) return new Map<string, PostView>();
      const agent = getAgent();
      const map = new Map<string, PostView>();
      // getPosts accepts max 25 URIs per call
      for (let i = 0; i < uris.length; i += 25) {
        const batch = uris.slice(i, i + 25);
        const res = await agent.getPosts({ uris: batch });
        for (const post of res.data.posts) {
          map.set(post.uri, post);
        }
      }
      return map;
    },
    enabled: uris.length > 0,
    staleTime: 60_000,
  });

  return data ?? new Map<string, PostView>();
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
