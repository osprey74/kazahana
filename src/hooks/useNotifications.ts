import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import type { Notification } from "@atproto/api/dist/client/types/app/bsky/notification/listNotifications";
import { getAgent } from "../lib/agent";
import { sendNotification, type NotificationReasonCounts } from "../lib/notifications";

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
  const prevCount = useRef<number | null>(null);

  const query = useQuery({
    queryKey: ["unreadCount"],
    queryFn: async () => {
      const agent = getAgent();
      const res = await agent.countUnreadNotifications();
      return res.data.count;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Trigger OS notification when unread count increases
  useEffect(() => {
    const count = query.data;
    if (count == null) return;

    if (prevCount.current !== null && count > prevCount.current) {
      const newCount = count - prevCount.current;
      // Fetch recent notifications to get reason breakdown
      (async () => {
        try {
          const agent = getAgent();
          const res = await agent.listNotifications({ limit: Math.min(newCount, 30) });
          const reasons: NotificationReasonCounts = {};
          for (const n of res.data.notifications) {
            const key = n.reason as keyof NotificationReasonCounts;
            reasons[key] = (reasons[key] ?? 0) + 1;
          }
          sendNotification(reasons);
        } catch {
          // Fallback: send without reason breakdown
          sendNotification({ like: newCount });
        }
      })();
    }
    prevCount.current = count;
  }, [query.data]);

  return query;
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
