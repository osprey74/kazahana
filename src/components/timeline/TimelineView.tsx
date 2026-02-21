import { useCallback, useMemo } from "react";
import { Virtuoso } from "react-virtuoso";
import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { useTimeline } from "../../hooks/useTimeline";
import { PostCard } from "./PostCard";
import { LoadingSpinner } from "../common/LoadingSpinner";

export function TimelineView() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useTimeline();

  const items = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.feed);
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
        <p>タイムラインの読み込みに失敗しました</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-1.5 bg-primary text-white text-sm rounded-btn hover:bg-blue-600"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <Virtuoso
      useWindowScroll
      data={items}
      endReached={loadMore}
      itemContent={(_index, item: FeedViewPost) => (
        <PostCard feedItem={item} />
      )}
      components={{
        Footer: () =>
          isFetchingNextPage ? <LoadingSpinner /> : null,
      }}
    />
  );
}
