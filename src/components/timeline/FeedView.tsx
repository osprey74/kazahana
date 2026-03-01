import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import { moderatePost } from "@atproto/api";
import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { useFeed } from "../../hooks/useFeed";
import { useModerationOpts } from "../../contexts/ModerationContext";
import { useBsafStore } from "../../stores/bsafStore";
import { parseBsafTags, shouldShowBsafPost } from "../../lib/bsaf";
import type { FeedSource } from "../../stores/feedStore";
import { PostCard } from "./PostCard";
import { LoadingSpinner } from "../common/LoadingSpinner";

export function FeedView({ feed }: { feed: FeedSource }) {
  const { t } = useTranslation();
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);
  const moderationOpts = useModerationOpts();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useFeed(feed);

  // Listen for refresh event (tab click / F5 / header button)
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener("kazahana:refresh", handler);
    return () => window.removeEventListener("kazahana:refresh", handler);
  }, [refetch]);

  const items = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.feed);
  }, [data]);

  const bsafEnabled = useBsafStore((s) => s.bsafEnabled);
  const registeredBots = useBsafStore((s) => s.registeredBots);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
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
  }, [items, moderationOpts, bsafEnabled, registeredBots]);

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
        <p>{t("feed.loadFailed")}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-1.5 bg-primary text-white text-sm rounded-btn hover:bg-blue-600"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <p className="text-center py-12 text-gray-400">{t("feed.empty")}</p>
    );
  }

  return (
    <>
      {scrollParent && (
        <Virtuoso
          customScrollParent={scrollParent}
          data={filteredItems}
          computeItemKey={(_index, item: FeedViewPost) => {
            const reason = item.reason as {
              by?: { did?: string };
            } | undefined;
            return reason?.by?.did
              ? `${item.post.uri}:repost:${reason.by.did}`
              : item.post.uri;
          }}
          endReached={loadMore}
          itemContent={(_index, item: FeedViewPost) => (
            <PostCard feedItem={item} />
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
