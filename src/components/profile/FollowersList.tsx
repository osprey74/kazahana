import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import { moderateProfile } from "@atproto/api";
import type { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { useFollowers, useFollow, useUnfollow } from "../../hooks/useProfile";
import { useModerationOpts } from "../../contexts/ModerationContext";
import { UserListItem } from "./UserListItem";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface FollowersListProps {
  handle: string;
  scrollParent: HTMLElement | null;
}

export function FollowersList({ handle, scrollParent }: FollowersListProps) {
  const { t } = useTranslation();
  const moderationOpts = useModerationOpts();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useFollowers(handle);

  const items = useMemo(() => {
    if (!data?.pages) return [];
    const all = data.pages.flatMap((page) => page.followers);
    if (!moderationOpts) return all;
    return all.filter((actor) => !moderateProfile(actor, moderationOpts).ui("profileList").filter);
  }, [data, moderationOpts]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <p className="text-center py-8 text-gray-500">{t("profile.loadFailed")}</p>;
  if (items.length === 0) return <p className="text-center py-8 text-gray-400">{t("profile.noFollowers")}</p>;
  if (!scrollParent) return null;

  return (
    <Virtuoso
      customScrollParent={scrollParent}
      data={items}
      endReached={loadMore}
      overscan={200}
      itemContent={(_index, actor: ProfileView) => (
        <UserListItem actor={actor} action={<FollowButton actor={actor} />} />
      )}
      components={{
        Footer: () => (isFetchingNextPage ? <LoadingSpinner /> : null),
      }}
    />
  );
}

function FollowButton({ actor }: { actor: ProfileView }) {
  const { t } = useTranslation();
  const follow = useFollow();
  const unfollow = useUnfollow();
  const [isFollowing, setIsFollowing] = useState(!!actor.viewer?.following);
  const [followUri, setFollowUri] = useState(actor.viewer?.following ?? "");

  useEffect(() => {
    setIsFollowing(!!actor.viewer?.following);
    setFollowUri(actor.viewer?.following ?? "");
  }, [actor.did, actor.viewer?.following]);

  const isPending = follow.isPending || unfollow.isPending;

  const handleToggle = async () => {
    if (isFollowing) {
      if (followUri) {
        await unfollow.mutateAsync({ followUri });
      }
      setIsFollowing(false);
      setFollowUri("");
    } else {
      const res = await follow.mutateAsync({ did: actor.did });
      setIsFollowing(true);
      setFollowUri(res.uri);
    }
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); handleToggle(); }}
      disabled={isPending}
      className={`px-3 py-1 text-xs font-medium rounded-btn transition-colors disabled:opacity-50 ${
        isFollowing
          ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 hover:text-red-600"
          : "bg-primary text-white hover:bg-blue-600"
      }`}
    >
      {isFollowing ? t("profile.following") : t("profile.follow")}
    </button>
  );
}
