import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import { moderateProfile } from "@atproto/api";
import { useNotifications, useMarkAsRead, groupNotifications, useBatchSubjectPosts, type NotificationGroup } from "../../hooks/useNotifications";
import { useModerationOpts } from "../../contexts/ModerationContext";
import { GroupedNotificationItem } from "./GroupedNotificationItem";
import { LoadingSpinner } from "../common/LoadingSpinner";

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

  // Flatten, filter, and group notifications
  const groups = useMemo(() => {
    if (!data?.pages) return [];
    const all = data.pages.flatMap((page) => page.notifications);
    const filtered = moderationOpts
      ? all.filter((notification) => {
          const decision = moderateProfile(notification.author, moderationOpts);
          return !decision.ui("profileList").filter;
        })
      : all;
    return groupNotifications(filtered);
  }, [data, moderationOpts]);

  // Batch-load subject posts for grouped notifications
  const subjectPosts = useBatchSubjectPosts(groups);

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

  if (groups.length === 0) {
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
      data={groups}
      endReached={loadMore}
      overscan={200}
      itemContent={(_index, group: NotificationGroup) => (
        <GroupedNotificationItem group={group} subjectPosts={subjectPosts} />
      )}
      components={{
        Footer: () => (isFetchingNextPage ? <LoadingSpinner /> : null),
      }}
    />
  );
}
