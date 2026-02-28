import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import type { GeneratorView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { useActorFeeds } from "../../hooks/useProfile";
import { useFeedStore } from "../../stores/feedStore";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";

interface ActorFeedsListProps {
  handle: string;
  scrollParent: HTMLElement | null;
}

export function ActorFeedsList({ handle, scrollParent }: ActorFeedsListProps) {
  const { t } = useTranslation();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useActorFeeds(handle);

  const items = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.feeds);
  }, [data]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <p className="text-center py-8 text-gray-500">{t("profile.loadFailed")}</p>;
  if (items.length === 0) return <p className="text-center py-8 text-gray-400">{t("profile.noFeeds")}</p>;
  if (!scrollParent) return null;

  return (
    <Virtuoso
      customScrollParent={scrollParent}
      data={items}
      endReached={loadMore}
      overscan={200}
      itemContent={(_index, feed: GeneratorView) => (
        <FeedItem feed={feed} />
      )}
      components={{
        Footer: () => (isFetchingNextPage ? <LoadingSpinner /> : null),
      }}
    />
  );
}

function FeedItem({ feed }: { feed: GeneratorView }) {
  const navigate = useNavigate();
  const { setCurrentFeed } = useFeedStore();

  const handleClick = () => {
    setCurrentFeed({ type: "custom", uri: feed.uri, name: feed.displayName });
    navigate("/");
  };

  return (
    <div
      onClick={handleClick}
      className="flex gap-3 px-4 py-3 border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
    >
      {feed.avatar ? (
        <Avatar src={feed.avatar} alt={feed.displayName} size="sm" />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon name="dynamic_feed" size={18} className="text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-text-light dark:text-text-dark truncate">
          {feed.displayName}
        </p>
        <p className="text-xs text-gray-500 truncate">
          by {feed.creator.displayName || feed.creator.handle}
        </p>
        {feed.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{feed.description}</p>
        )}
        {feed.likeCount != null && feed.likeCount > 0 && (
          <span className="text-xs text-gray-400">♥ {feed.likeCount}</span>
        )}
      </div>
    </div>
  );
}
