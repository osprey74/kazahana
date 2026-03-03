import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
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

/** Fetch a single subject post for a notification (lazy, per-item) */
export function useSubjectPost(notification: Notification) {
  const uri = useMemo(() => {
    const { reason } = notification;
    if (reason === "reply" || reason === "mention" || reason === "quote") {
      return notification.uri;
    }
    if ((reason === "like" || reason === "repost" || reason === "like-via-repost" || reason === "repost-via-repost") && notification.reasonSubject) {
      return notification.reasonSubject;
    }
    return null;
  }, [notification]);

  const { data } = useQuery({
    queryKey: ["subjectPost", uri],
    queryFn: async () => {
      if (!uri) return null;
      const agent = getAgent();

      // Resolve repost record URI to original post URI
      let postUri = uri;
      if (uri.includes("/app.bsky.feed.repost/")) {
        const match = uri.match(/^at:\/\/([^/]+)\/app\.bsky\.feed\.repost\/(.+)$/);
        if (!match) return null;
        try {
          const res = await agent.com.atproto.repo.getRecord({
            repo: match[1],
            collection: "app.bsky.feed.repost",
            rkey: match[2],
          });
          const subject = (res.data.value as { subject?: { uri: string } }).subject;
          if (!subject?.uri) return null;
          postUri = subject.uri;
        } catch {
          return null;
        }
      }

      const res = await agent.getPosts({ uris: [postUri] });
      return res.data.posts[0] ?? null;
    },
    enabled: !!uri,
    staleTime: 60_000,
  });

  return data ?? undefined;
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
