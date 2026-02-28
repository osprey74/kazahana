import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import type { ListView } from "@atproto/api/dist/client/types/app/bsky/graph/defs";
import { useActorLists } from "../../hooks/useProfile";
import { useFeedStore } from "../../stores/feedStore";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";

interface ActorListsListProps {
  handle: string;
  scrollParent: HTMLElement | null;
}

export function ActorListsList({ handle, scrollParent }: ActorListsListProps) {
  const { t } = useTranslation();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useActorLists(handle);

  const items = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.lists);
  }, [data]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <p className="text-center py-8 text-gray-500">{t("profile.loadFailed")}</p>;
  if (items.length === 0) return <p className="text-center py-8 text-gray-400">{t("profile.noLists")}</p>;
  if (!scrollParent) return null;

  return (
    <Virtuoso
      customScrollParent={scrollParent}
      data={items}
      endReached={loadMore}
      overscan={200}
      itemContent={(_index, list: ListView) => (
        <ListItem list={list} />
      )}
      components={{
        Footer: () => (isFetchingNextPage ? <LoadingSpinner /> : null),
      }}
    />
  );
}

function ListItem({ list }: { list: ListView }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setCurrentFeed } = useFeedStore();
  const isCurate = list.purpose === "app.bsky.graph.defs#curatelist";

  const handleClick = () => {
    if (isCurate) {
      setCurrentFeed({ type: "list", uri: list.uri, name: list.name });
      navigate("/");
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex gap-3 px-4 py-3 border-b border-border-light dark:border-border-dark transition-colors ${isCurate ? "hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" : ""}`}
    >
      {list.avatar ? (
        <Avatar src={list.avatar} alt={list.name} size="sm" />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon name={isCurate ? "lists" : "shield"} size={18} className="text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm text-text-light dark:text-text-dark truncate">
            {list.name}
          </p>
          {!isCurate && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              {t("profile.modList")}
            </span>
          )}
        </div>
        {list.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{list.description}</p>
        )}
      </div>
    </div>
  );
}
