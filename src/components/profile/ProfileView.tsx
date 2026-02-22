import { useState, useLayoutEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import { moderatePost } from "@atproto/api";
import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { useProfile, useAuthorFeed } from "../../hooks/useProfile";
import { useAuthStore } from "../../stores/authStore";
import { useModerationOpts } from "../../contexts/ModerationContext";
import { ProfileHeader } from "./ProfileHeader";
import { PostCard } from "../timeline/PostCard";
import { FollowersList } from "./FollowersList";
import { FollowingList } from "./FollowingList";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { getAgent } from "../../lib/agent";

export type ProfileTab = "posts" | "followers" | "following";

export function ProfileView() {
  const { t } = useTranslation();
  const { handle } = useParams<{ handle: string }>();
  const authProfile = useAuthStore((s) => s.profile);
  const [tab, setTab] = useState<ProfileTab>("posts");
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  // Resolve the actual scroll container (<main> in AppLayout)
  useLayoutEffect(() => {
    setScrollParent(document.querySelector("main"));
  }, []);

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
  const moderationOpts = useModerationOpts();

  const items = useMemo(() => {
    if (!feedData?.pages) return [];
    const all = feedData.pages.flatMap((page) => page.feed);
    if (!moderationOpts) return all;
    return all.filter((item) => !moderatePost(item.post, moderationOpts).ui("contentList").filter);
  }, [feedData, moderationOpts]);

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
      <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} onTabChange={setTab} />

      {/* Tabs */}
      <div className="flex border-b border-border-light dark:border-border-dark">
        {(["posts", "following", "followers"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === tabKey
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {t(`profile.${tabKey}`)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "posts" && (
        items.length > 0 && scrollParent ? (
          <Virtuoso
            customScrollParent={scrollParent}
            data={items}
            endReached={loadMore}
            overscan={200}
            itemContent={(_index, item: FeedViewPost) => (
              <PostCard feedItem={item} showParentContext />
            )}
            components={{
              Footer: () =>
                isFetchingNextPage ? (
                  <LoadingSpinner />
                ) : null,
            }}
          />
        ) : !items.length ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <p>{t("profile.noPosts")}</p>
          </div>
        ) : null
      )}
      {tab === "followers" && <FollowersList handle={resolvedHandle} scrollParent={scrollParent} />}
      {tab === "following" && <FollowingList handle={resolvedHandle} scrollParent={scrollParent} />}
    </div>
  );
}
