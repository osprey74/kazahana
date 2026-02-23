import { useState, useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import { moderatePost } from "@atproto/api";
import type { FeedViewPost, PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { useProfile, useAuthorFeed, useActorLikes, useAuthorMediaFeed, useBookmarks } from "../../hooks/useProfile";
import { useAuthStore } from "../../stores/authStore";
import { useModerationOpts } from "../../contexts/ModerationContext";
import { ProfileHeader } from "./ProfileHeader";
import { PostCard } from "../timeline/PostCard";
import { FollowersList } from "./FollowersList";
import { FollowingList } from "./FollowingList";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { getAgent } from "../../lib/agent";

export type ProfileTab = "posts" | "likes" | "media" | "bookmarks" | "followers" | "following";

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

  // Reset tab when navigating to a different profile
  useEffect(() => {
    setTab("posts");
  }, [handle]);

  // If no handle param, show own profile
  const resolvedHandle = handle || authProfile?.handle || getAgent().session?.handle || "";

  const { data: profile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useProfile(resolvedHandle);
  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchFeed,
  } = useAuthorFeed(resolvedHandle);

  const {
    data: likesData,
    fetchNextPage: fetchNextLikes,
    hasNextPage: hasNextLikes,
    isFetchingNextPage: isFetchingNextLikes,
    refetch: refetchLikes,
  } = useActorLikes(resolvedHandle);

  const {
    data: mediaData,
    fetchNextPage: fetchNextMedia,
    hasNextPage: hasNextMedia,
    isFetchingNextPage: isFetchingNextMedia,
    refetch: refetchMedia,
  } = useAuthorMediaFeed(resolvedHandle);

  const isOwnProfile = !handle || handle === authProfile?.handle;

  const {
    data: bookmarksData,
    fetchNextPage: fetchNextBookmarks,
    hasNextPage: hasNextBookmarks,
    isFetchingNextPage: isFetchingNextBookmarks,
    refetch: refetchBookmarks,
  } = useBookmarks(isOwnProfile);

  // Listen for refresh event (tab click / F5 / header button)
  useEffect(() => {
    const handler = () => {
      refetchProfile();
      refetchFeed();
      refetchLikes();
      refetchMedia();
      if (isOwnProfile) refetchBookmarks();
    };
    window.addEventListener("kazahana:refresh", handler);
    return () => window.removeEventListener("kazahana:refresh", handler);
  }, [refetchProfile, refetchFeed, refetchLikes, refetchMedia, refetchBookmarks, isOwnProfile]);
  const moderationOpts = useModerationOpts();

  const items = useMemo(() => {
    if (!feedData?.pages) return [];
    const all = feedData.pages.flatMap((page) => page.feed);
    if (!moderationOpts) return all;
    return all.filter((item) => !moderatePost(item.post, moderationOpts).ui("contentList").filter);
  }, [feedData, moderationOpts]);

  const likeItems = useMemo(() => {
    if (!likesData?.pages) return [];
    const all = likesData.pages.flatMap((page) => page.feed);
    if (!moderationOpts) return all;
    return all.filter((item) => !moderatePost(item.post, moderationOpts).ui("contentList").filter);
  }, [likesData, moderationOpts]);

  const mediaItems = useMemo(() => {
    if (!mediaData?.pages) return [];
    const all = mediaData.pages.flatMap((page) => page.feed);
    if (!moderationOpts) return all;
    return all.filter((item) => !moderatePost(item.post, moderationOpts).ui("contentList").filter);
  }, [mediaData, moderationOpts]);

  const bookmarkItems = useMemo(() => {
    if (!bookmarksData?.pages) return [];
    return bookmarksData.pages.flatMap((page) =>
      page.bookmarks
        .filter((b) => b.item.$type === "app.bsky.feed.defs#postView")
        .map((b) => ({ post: b.item as PostView } as FeedViewPost))
    );
  }, [bookmarksData]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const loadMoreLikes = useCallback(() => {
    if (hasNextLikes && !isFetchingNextLikes) {
      fetchNextLikes();
    }
  }, [hasNextLikes, isFetchingNextLikes, fetchNextLikes]);

  const loadMoreMedia = useCallback(() => {
    if (hasNextMedia && !isFetchingNextMedia) {
      fetchNextMedia();
    }
  }, [hasNextMedia, isFetchingNextMedia, fetchNextMedia]);

  const loadMoreBookmarks = useCallback(() => {
    if (hasNextBookmarks && !isFetchingNextBookmarks) {
      fetchNextBookmarks();
    }
  }, [hasNextBookmarks, isFetchingNextBookmarks, fetchNextBookmarks]);

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
        {(isOwnProfile
          ? (["posts", "likes", "media", "bookmarks", "following", "followers"] as const)
          : (["posts", "likes", "media", "following", "followers"] as const)
        ).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => {
              setTab(tabKey);
              if (tabKey === "bookmarks") refetchBookmarks();
            }}
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
      {tab === "likes" && (
        likeItems.length > 0 && scrollParent ? (
          <Virtuoso
            customScrollParent={scrollParent}
            data={likeItems}
            endReached={loadMoreLikes}
            overscan={200}
            itemContent={(_index, item: FeedViewPost) => (
              <PostCard feedItem={item} showParentContext />
            )}
            components={{
              Footer: () =>
                isFetchingNextLikes ? (
                  <LoadingSpinner />
                ) : null,
            }}
          />
        ) : !likeItems.length ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <p>{t("profile.noLikes")}</p>
          </div>
        ) : null
      )}
      {tab === "media" && (
        mediaItems.length > 0 && scrollParent ? (
          <Virtuoso
            customScrollParent={scrollParent}
            data={mediaItems}
            endReached={loadMoreMedia}
            overscan={200}
            itemContent={(_index, item: FeedViewPost) => (
              <PostCard feedItem={item} showParentContext />
            )}
            components={{
              Footer: () =>
                isFetchingNextMedia ? (
                  <LoadingSpinner />
                ) : null,
            }}
          />
        ) : !mediaItems.length ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <p>{t("profile.noMedia")}</p>
          </div>
        ) : null
      )}
      {tab === "bookmarks" && isOwnProfile && (
        bookmarkItems.length > 0 && scrollParent ? (
          <Virtuoso
            customScrollParent={scrollParent}
            data={bookmarkItems}
            endReached={loadMoreBookmarks}
            overscan={200}
            itemContent={(_index, item: FeedViewPost) => (
              <PostCard feedItem={item} showParentContext />
            )}
            components={{
              Footer: () =>
                isFetchingNextBookmarks ? (
                  <LoadingSpinner />
                ) : null,
            }}
          />
        ) : !bookmarkItems.length ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <p>{t("profile.noBookmarks")}</p>
          </div>
        ) : null
      )}
      {tab === "followers" && <FollowersList handle={resolvedHandle} scrollParent={scrollParent} />}
      {tab === "following" && <FollowingList handle={resolvedHandle} scrollParent={scrollParent} />}
    </div>
  );
}
