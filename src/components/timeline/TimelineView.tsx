import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import { moderatePost } from "@atproto/api";
import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { useTimeline } from "../../hooks/useTimeline";
import { useModerationOpts } from "../../contexts/ModerationContext";
import { PostCard } from "./PostCard";
import { LoadingSpinner } from "../common/LoadingSpinner";

export function TimelineView() {
  const { t } = useTranslation();
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);
  const moderationOpts = useModerationOpts();

  const {
    items,
    firstItemIndex,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    dividerPostUri,
    reportViewportTop,
  } = useTimeline();

  // Listen for refresh event (tab click / F5 / header button)
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener("kazahana:refresh", handler);
    return () => window.removeEventListener("kazahana:refresh", handler);
  }, [refetch]);

  // Pre-filter items that should be completely hidden by moderation
  const filteredItems = useMemo(() => {
    if (!moderationOpts) return items;
    return items.filter((item) => {
      const decision = moderatePost(item.post, moderationOpts);
      return !decision.ui("contentList").filter;
    });
  }, [items, moderationOpts]);

  // Resolve the actual scroll container (<main> in AppLayout)
  useLayoutEffect(() => {
    setScrollParent(document.querySelector("main"));
  }, []);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <p>{t("timeline.loadFailed")}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-1.5 bg-primary text-white text-sm rounded-btn hover:bg-blue-600"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  return (
    <>
      {scrollParent && (
        <Virtuoso
          customScrollParent={scrollParent}
          data={filteredItems}
          firstItemIndex={firstItemIndex}
          computeItemKey={(_index, item: FeedViewPost) => {
            const reason = item.reason as {
              by?: { did?: string };
            } | undefined;
            return reason?.by?.did
              ? `${item.post.uri}:repost:${reason.by.did}`
              : item.post.uri;
          }}
          rangeChanged={(range) => {
            reportViewportTop(range.startIndex - firstItemIndex);
          }}
          endReached={loadMore}
          itemContent={(_index, item: FeedViewPost) => (
            <>
              {item.post.uri === dividerPostUri && (
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs text-center py-1 font-medium">
                  {t("timeline.readUpToHere")}
                </div>
              )}
              <PostCard feedItem={item} />
            </>
          )}
          components={{
            Footer: () =>
              isFetchingNextPage ? <LoadingSpinner /> : null,
          }}
        />
      )}
    </>
  );
}
