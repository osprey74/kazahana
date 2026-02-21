import { useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { useProfile, useAuthorFeed } from "../../hooks/useProfile";
import { useAuthStore } from "../../stores/authStore";
import { ProfileHeader } from "./ProfileHeader";
import { PostCard } from "../timeline/PostCard";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { getAgent } from "../../lib/agent";

export function ProfileView() {
  const { t } = useTranslation();
  const { handle } = useParams<{ handle: string }>();
  const authProfile = useAuthStore((s) => s.profile);

  // If no handle param, show own profile
  const resolvedHandle = handle || authProfile?.handle || getAgent().session?.handle || "";

  const { data: profile, isLoading: profileLoading, isError: profileError } = useProfile(resolvedHandle);
  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAuthorFeed(resolvedHandle);

  const isOwnProfile = !handle || handle === authProfile?.handle;

  const items = useMemo(() => {
    if (!feedData?.pages) return [];
    return feedData.pages.flatMap((page) => page.feed);
  }, [feedData]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (profileLoading) return <LoadingSpinner />;

  if (profileError || !profile) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <p>{t("profile.loadFailed")}</p>
      </div>
    );
  }

  return (
    <div>
      <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />

      {items.length > 0 ? (
        <Virtuoso
          useWindowScroll
          data={items}
          endReached={loadMore}
          itemContent={(_index, item: FeedViewPost) => (
            <PostCard feedItem={item} />
          )}
          components={{
            Footer: () => (isFetchingNextPage ? <LoadingSpinner /> : null),
          }}
        />
      ) : (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <p>{t("profile.noPosts")}</p>
        </div>
      )}
    </div>
  );
}
