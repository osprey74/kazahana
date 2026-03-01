import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import { moderatePost } from "@atproto/api";
import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { useTimeline } from "../../hooks/useTimeline";
import { useBsafDuplicates } from "../../hooks/useBsafDuplicates";
import { useBsafStore } from "../../stores/bsafStore";
import { parseBsafTags, shouldShowBsafPost } from "../../lib/bsaf";
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

  const { duplicateInfo, hiddenDuplicates } = useBsafDuplicates(items);
  const bsafEnabled = useBsafStore((s) => s.bsafEnabled);
  const registeredBots = useBsafStore((s) => s.registeredBots);

  // Pre-filter items that should be completely hidden by moderation, BSAF duplicates, or BSAF filters
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Hide BSAF duplicate posts
      if (hiddenDuplicates.has(item.post.uri)) return false;
      // Hide moderation-filtered posts
      if (moderationOpts) {
        const decision = moderatePost(item.post, moderationOpts);
        if (decision.ui("contentList").filter) return false;
      }
      // BSAF filter by user settings
      if (bsafEnabled) {
        const record = item.post.record as { tags?: string[] };
        if (record.tags) {
          const parsed = parseBsafTags(record.tags);
          if (parsed) {
            const matchedBot = registeredBots.find((b) => b.definition.bot.did === item.post.author.did);
            if (matchedBot && !shouldShowBsafPost(parsed, matchedBot)) return false;
          }
        }
      }
      return true;
    });
  }, [items, moderationOpts, hiddenDuplicates, bsafEnabled, registeredBots]);

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
              <PostCard feedItem={item} bsafDuplicateInfo={duplicateInfo.get(item.post.uri)} />
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
