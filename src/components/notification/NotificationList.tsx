import { useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import { useNotifications, useMarkAsRead } from "../../hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";
import { LoadingSpinner } from "../common/LoadingSpinner";
import type { Notification } from "@atproto/api/dist/client/types/app/bsky/notification/listNotifications";

export function NotificationList() {
  const { t } = useTranslation();
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

  const items = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.notifications);
  }, [data]);

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

  return (
    <Virtuoso
      useWindowScroll
      data={items}
      endReached={loadMore}
      itemContent={(_index, item: Notification) => (
        <NotificationItem notification={item} />
      )}
      components={{
        Footer: () => (isFetchingNextPage ? <LoadingSpinner /> : null),
      }}
    />
  );
}
