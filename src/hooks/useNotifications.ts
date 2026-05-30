import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppBskyNotificationListNotifications, AppBskyFeedDefs } from "@atproto/api";
type Notification = AppBskyNotificationListNotifications.Notification;
type PostView = AppBskyFeedDefs.PostView;
import { getAgent } from "../lib/agent";
import { sendNotification, type NotificationReasonCounts } from "../lib/notifications";

/** A group of notifications with the same reason targeting the same post */
export interface NotificationGroup {
  id: string;
  reason: string;
  reasonSubject?: string;
  notifications: Notification[];
  isRead: boolean;
  indexedAt: string;
}

const GROUPABLE_REASONS = new Set(["like", "repost", "like-via-repost", "repost-via-repost"]);

/** Group flat notifications by reason + reasonSubject (like/repost only) */
export function groupNotifications(notifications: Notification[]): NotificationGroup[] {
  const groups: NotificationGroup[] = [];
  const keyToIndex: Record<string, number> = {};

  for (const notif of notifications) {
    let groupKey: string | null = null;
    if (GROUPABLE_REASONS.has(notif.reason) && notif.reasonSubject) {
      groupKey = `${notif.reason}:${notif.reasonSubject}`;
    }

    if (groupKey && groupKey in keyToIndex) {
      const idx = keyToIndex[groupKey];
      groups[idx].notifications.push(notif);
      if (!notif.isRead) groups[idx].isRead = false;
    } else {
      const id = groupKey ?? notif.uri;
      keyToIndex[id] = groups.length;
      groups.push({
        id,
        reason: notif.reason,
        reasonSubject: notif.reasonSubject,
        notifications: [notif],
        isRead: notif.isRead,
        indexedAt: notif.indexedAt,
      });
    }
  }
  return groups;
}

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

/** Resolve a post URI, handling repost record URIs */
async function resolvePostUri(uri: string): Promise<string | null> {
  if (!uri.includes("/app.bsky.feed.repost/")) return uri;
  const match = uri.match(/^at:\/\/([^/]+)\/app\.bsky\.feed\.repost\/(.+)$/);
  if (!match) return null;
  try {
    const agent = getAgent();
    const res = await agent.com.atproto.repo.getRecord({
      repo: match[1],
      collection: "app.bsky.feed.repost",
      rkey: match[2],
    });
    return (res.data.value as { subject?: { uri: string } }).subject?.uri ?? null;
  } catch {
    return null;
  }
}

/** Get the subject post URI for a notification group */
function getSubjectUri(group: NotificationGroup): string | null {
  const notif = group.notifications[0];
  const { reason } = notif;
  if (reason === "reply" || reason === "mention" || reason === "quote") return notif.uri;
  if (GROUPABLE_REASONS.has(reason) && notif.reasonSubject) return notif.reasonSubject;
  return null;
}

/** Batch-load subject posts for grouped notifications, 10 groups at a time */
export function useBatchSubjectPosts(groups: NotificationGroup[]) {
  const [subjectPosts, setSubjectPosts] = useState<Record<string, PostView>>({});
  const [loadedBatch, setLoadedBatch] = useState(0);
  const prevGroupsRef = useRef<string>("");

  // Reset when groups change (new data loaded)
  const groupsKey = groups.map((g) => g.id).join(",");
  useEffect(() => {
    if (groupsKey !== prevGroupsRef.current) {
      prevGroupsRef.current = groupsKey;
      setSubjectPosts({});
      setLoadedBatch(0);
    }
  }, [groupsKey]);

  // Load posts in batches of 10 groups
  useEffect(() => {
    if (groups.length === 0) return;
    const BATCH_SIZE = 10;
    const start = loadedBatch * BATCH_SIZE;
    if (start >= groups.length) return;
    const batch = groups.slice(start, start + BATCH_SIZE);

    let cancelled = false;
    (async () => {
      const agent = getAgent();
      // Collect URIs for this batch, resolving repost URIs in parallel
      const uriEntries = await Promise.all(
        batch.map(async (group) => {
          const rawUri = getSubjectUri(group);
          if (!rawUri) return null;
          const resolved = await resolvePostUri(rawUri);
          return resolved ? { groupId: group.id, rawUri, resolved } : null;
        })
      );

      const validEntries = uriEntries.filter((e): e is NonNullable<typeof e> => e !== null);
      // Deduplicate resolved URIs
      const uniqueUris = [...new Set(validEntries.map((e) => e.resolved))];
      if (uniqueUris.length === 0 || cancelled) return;

      // Fetch posts in chunks of 25 (API limit)
      const fetched: Record<string, PostView> = {};
      for (let i = 0; i < uniqueUris.length; i += 25) {
        const chunk = uniqueUris.slice(i, i + 25);
        try {
          const res = await agent.getPosts({ uris: chunk });
          for (const post of res.data.posts) {
            fetched[post.uri] = post;
          }
        } catch {
          // continue with partial results
        }
      }

      if (cancelled) return;

      // Map posts back to group IDs and raw URIs
      const newPosts: Record<string, PostView> = {};
      for (const entry of validEntries) {
        const post = fetched[entry.resolved];
        if (post) {
          newPosts[entry.rawUri] = post;
        }
      }

      setSubjectPosts((prev) => ({ ...prev, ...newPosts }));
      setLoadedBatch((prev) => prev + 1);
    })();

    return () => { cancelled = true; };
  }, [groups, loadedBatch]); // eslint-disable-line react-hooks/exhaustive-deps

  return subjectPosts;
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
