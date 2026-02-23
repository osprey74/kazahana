import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import type { StarterPackViewBasic } from "@atproto/api/dist/client/types/app/bsky/graph/defs";
import { useActorStarterPacks } from "../../hooks/useProfile";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";

interface StarterPacksListProps {
  handle: string;
  scrollParent: HTMLElement | null;
}

export function StarterPacksList({ handle, scrollParent }: StarterPacksListProps) {
  const { t } = useTranslation();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useActorStarterPacks(handle);

  const items = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.starterPacks);
  }, [data]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <p className="text-center py-8 text-gray-500">{t("profile.loadFailed")}</p>;
  if (items.length === 0) return <p className="text-center py-8 text-gray-400">{t("starterPack.noStarterPacks")}</p>;
  if (!scrollParent) return null;

  return (
    <Virtuoso
      customScrollParent={scrollParent}
      data={items}
      endReached={loadMore}
      overscan={200}
      itemContent={(_index, pack: StarterPackViewBasic) => (
        <StarterPackItem pack={pack} />
      )}
      components={{
        Footer: () => (isFetchingNextPage ? <LoadingSpinner /> : null),
      }}
    />
  );
}

function StarterPackItem({ pack }: { pack: StarterPackViewBasic }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const record = pack.record as { name?: string; description?: string };

  const handleClick = () => {
    const encoded = encodeURIComponent(pack.uri);
    navigate(`/starter-pack/${encoded}`);
  };

  return (
    <div
      onClick={handleClick}
      className="flex gap-3 px-4 py-3 border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon name="backpack" size={22} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-text-light dark:text-text-dark truncate">
          {record.name || pack.uri}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <Avatar src={pack.creator.avatar} alt={pack.creator.displayName} size="xs" />
          <span className="text-xs text-gray-500 truncate">
            {pack.creator.displayName || pack.creator.handle}
          </span>
        </div>
        {record.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{record.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          {pack.listItemCount != null && (
            <span>{t("starterPack.members", { count: pack.listItemCount })}</span>
          )}
          {pack.joinedAllTimeCount != null && pack.joinedAllTimeCount > 0 && (
            <span>{t("starterPack.joined", { count: pack.joinedAllTimeCount })}</span>
          )}
        </div>
      </div>
    </div>
  );
}
