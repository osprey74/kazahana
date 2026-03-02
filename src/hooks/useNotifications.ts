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
      if ((n.reason === "like" || n.reason === "repost" || n.reason === "like-via-repost" || n.reason === "repost-via-repost") && n.reasonSubject) {
        set.add(n.reasonSubject);
      }
      // Also fetch post data for reply/mention/quote so action buttons work
      if (n.reason === "reply" || n.reason === "mention" || n.reason === "quote") {
        set.add(n.uri);
      }
    }
    return [...set];
  }, [notifications]);

  const { data } = useQuery({
    queryKey: ["subjectPosts", uris],
    queryFn: async () => {
      if (uris.length === 0) return new Map<string, PostView>();
      const agent = getAgent();

      // Separate post URIs from repost record URIs
      const postUris: string[] = [];
      const repostUris: string[] = [];
      for (const uri of uris) {
        if (uri.includes("/app.bsky.feed.repost/")) {
          repostUris.push(uri);
        } else {
          postUris.push(uri);
        }
      }

      // Resolve repost URIs to original post URIs
      const repostToPostUri = new Map<string, string>();
      for (const repostUri of repostUris) {
        const match = repostUri.match(/^at:\/\/([^/]+)\/app\.bsky\.feed\.repost\/(.+)$/);
        if (!match) continue;
        try {
          const res = await agent.com.atproto.repo.getRecord({
            repo: match[1],
            collection: "app.bsky.feed.repost",
            rkey: match[2],
          });
          const subject = (res.data.value as { subject?: { uri: string } }).subject;
          if (subject?.uri) {
            repostToPostUri.set(repostUri, subject.uri);
            postUris.push(subject.uri);
          }
        } catch {
          // Repost may have been deleted
        }
      }

      // Fetch all post URIs (deduplicated)
      const uniquePostUris = [...new Set(postUris)];
      const map = new Map<string, PostView>();
      for (let i = 0; i < uniquePostUris.length; i += 25) {
        const batch = uniquePostUris.slice(i, i + 25);
        const res = await agent.getPosts({ uris: batch });
        for (const post of res.data.posts) {
          map.set(post.uri, post);
        }
      }

      // Map repost URIs to their resolved posts for lookup
      for (const [repostUri, postUri] of repostToPostUri) {
        const post = map.get(postUri);
        if (post) {
          map.set(repostUri, post);
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
