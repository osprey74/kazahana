import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import { moderateProfile } from "@atproto/api";
import { useNotifications, useMarkAsRead, useSubjectPosts } from "../../hooks/useNotifications";
import { useModerationOpts } from "../../contexts/ModerationContext";
import { NotificationItem } from "./NotificationItem";
import { LoadingSpinner } from "../common/LoadingSpinner";
import type { Notification } from "@atproto/api/dist/client/types/app/bsky/notification/listNotifications";

export function NotificationList() {
  const { t } = useTranslation();
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    setScrollParent(document.querySelector("main"));
  }, []);
  const moderationOpts = useModerationOpts();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useNotifications();

  const markAsRead = useMarkAsRead();

  // Mark as read when page is viewed
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  // Listen for refresh event (tab click / F5 / header button)
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener("kazahana:refresh", handler);
    return () => window.removeEventListener("kazahana:refresh", handler);
  }, [refetch]);

  const items = useMemo(() => {
    if (!data?.pages) return [];
    const all = data.pages.flatMap((page) => page.notifications);
    if (!moderationOpts) return all;
    return all.filter((notification) => {
      const decision = moderateProfile(notification.author, moderationOpts);
      return !decision.ui("profileList").filter;
    });
  }, [data, moderationOpts]);

  const subjectPosts = useSubjectPosts(items);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <p>{t("notification.loadFailed")}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-1.5 bg-primary text-white text-sm rounded-btn hover:bg-blue-600"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <p>{t("notification.empty")}</p>
      </div>
    );
  }

  if (!scrollParent) return null;

  return (
    <Virtuoso
      customScrollParent={scrollParent}
      data={items}
      endReached={loadMore}
      overscan={200}
      itemContent={(_index, item: Notification) => (
        <NotificationItem notification={item} subjectPost={item.reasonSubject ? subjectPosts.get(item.reasonSubject) : subjectPosts.get(item.uri)} />
      )}
      components={{
        Footer: () => (isFetchingNextPage ? <LoadingSpinner /> : null),
      }}
    />
  );
}
