import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import type { ChatBskyConvoDefs } from "@atproto/api";
import { useConversations } from "../../hooks/useConversations";
import { useDMComposeStore } from "../../stores/dmComposeStore";
import { ConversationItem } from "./ConversationItem";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Icon } from "../common/Icon";

export function DMListView() {
  const { t } = useTranslation();
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);
  const openCompose = useDMComposeStore((s) => s.open);

  useLayoutEffect(() => {
    setScrollParent(document.querySelector("main"));
  }, []);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useConversations();

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener("kazahana:refresh", handler);
    return () => window.removeEventListener("kazahana:refresh", handler);
  }, [refetch]);

  const items = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.convos);
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
        <p>{t("messages.loadFailed")}</p>
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
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
        <p>{t("messages.empty")}</p>
        <button
          onClick={() => openCompose()}
          className="px-4 py-1.5 bg-primary text-white text-sm rounded-btn hover:bg-blue-600 flex items-center gap-1"
        >
          <Icon name="edit_square" size={16} />
          {t("messages.newMessage")}
        </button>
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
      itemContent={(_index, item: ChatBskyConvoDefs.ConvoView) => (
        <ConversationItem conversation={item} />
      )}
      components={{
        Footer: () => (isFetchingNextPage ? <LoadingSpinner /> : null),
      }}
    />
  );
}
