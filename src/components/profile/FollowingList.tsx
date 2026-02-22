import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import { moderateProfile } from "@atproto/api";
import type { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { useFollowing } from "../../hooks/useProfile";
import { useModerationOpts } from "../../contexts/ModerationContext";
import { UserListItem } from "./UserListItem";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface FollowingListProps {
  handle: string;
  scrollParent: HTMLElement | null;
}

export function FollowingList({ handle, scrollParent }: FollowingListProps) {
  const { t } = useTranslation();
  const moderationOpts = useModerationOpts();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useFollowing(handle);

  const items = useMemo(() => {
    if (!data?.pages) return [];
    const all = data.pages.flatMap((page) => page.follows);
    if (!moderationOpts) return all;
    return all.filter((actor) => !moderateProfile(actor, moderationOpts).ui("profileList").filter);
  }, [data, moderationOpts]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <p className="text-center py-8 text-gray-500">{t("profile.loadFailed")}</p>;
  if (items.length === 0) return <p className="text-center py-8 text-gray-400">{t("profile.noFollowing")}</p>;
  if (!scrollParent) return null;

  return (
    <Virtuoso
      customScrollParent={scrollParent}
      data={items}
      endReached={loadMore}
      overscan={200}
      itemContent={(_index, actor: ProfileView) => (
        <UserListItem actor={actor} />
      )}
      components={{
        Footer: () => (isFetchingNextPage ? <LoadingSpinner /> : null),
      }}
    />
  );
}
