import { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import { moderatePost } from "@atproto/api";
import type { FeedViewPost, PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { useProfile, useAuthorFeed, useAuthorReplies, useActorLikes, useAuthorMediaFeed, useActorFeeds, useActorLists, useBookmarks, useActorStarterPacks } from "../../hooks/useProfile";
import { useSearchPostsByAuthor } from "../../hooks/useSearch";
import { useAuthStore } from "../../stores/authStore";
import { useModerationOpts } from "../../contexts/ModerationContext";
import { ProfileHeader } from "./ProfileHeader";
import { PostCard } from "../timeline/PostCard";
import { StarterPacksList } from "./StarterPacksList";
import { ActorFeedsList } from "./ActorFeedsList";
import { ActorListsList } from "./ActorListsList";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Icon } from "../common/Icon";
import { getAgent } from "../../lib/agent";

export type ProfileTab = "posts" | "replies" | "likes" | "media" | "feeds" | "lists" | "bookmarks" | "starterPacks";

export function ProfileView() {
  const { t } = useTranslation();
  const { handle } = useParams<{ handle: string }>();
  const authProfile = useAuthStore((s) => s.profile);
  const [tab, setTab] = useState<ProfileTab>("posts");
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollLockRef = useRef<number | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Resolve the actual scroll container (<main> in AppLayout)
  useLayoutEffect(() => {
    setScrollParent(document.querySelector("main"));
  }, []);

  // Keep tabs pinned at top after tab switch (don't reveal ProfileHeader)
  useLayoutEffect(() => {
    const pos = scrollLockRef.current;
    if (pos !== null && scrollParent) {
      scrollParent.scrollTop = pos;
      // Also enforce after Virtuoso's initial render
      requestAnimationFrame(() => {
        scrollParent.scrollTop = pos;
      });
      scrollLockRef.current = null;
    }
  }, [tab, scrollParent]);

  // Reset tab and search when navigating to a different profile
  useEffect(() => {
    setTab("posts");
    setSearchInput("");
    setDebouncedSearch("");
  }, [handle]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

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
    data: repliesData,
    fetchNextPage: fetchNextReplies,
    hasNextPage: hasNextReplies,
    isFetchingNextPage: isFetchingNextReplies,
    refetch: refetchReplies,
  } = useAuthorReplies(resolvedHandle);

  const {
    data: likesData,
    fetchNextPage: fetchNextLikes,
    hasNextPage: hasNextLikes,
    isFetchingNextPage: isFetchingNextLikes,
    isLoading: isLoadingLikes,
    isError: isLikesError,
    refetch: refetchLikes,
  } = useActorLikes(resolvedHandle);

  const {
    data: mediaData,
    fetchNextPage: fetchNextMedia,
    hasNextPage: hasNextMedia,
    isFetchingNextPage: isFetchingNextMedia,
    refetch: refetchMedia,
  } = useAuthorMediaFeed(resolvedHandle);

  const {
    refetch: refetchActorFeeds,
  } = useActorFeeds(resolvedHandle);

  const {
    refetch: refetchActorLists,
  } = useActorLists(resolvedHandle);

  const {
    refetch: refetchStarterPacks,
  } = useActorStarterPacks(resolvedHandle);

  const isOwnProfile = !handle || handle === authProfile?.handle;

  const {
    data: bookmarksData,
    fetchNextPage: fetchNextBookmarks,
    hasNextPage: hasNextBookmarks,
    isFetchingNextPage: isFetchingNextBookmarks,
    refetch: refetchBookmarks,
  } = useBookmarks(isOwnProfile);

  const {
    data: searchData,
    fetchNextPage: fetchNextSearch,
    hasNextPage: hasNextSearch,
    isFetchingNextPage: isFetchingNextSearch,
    isLoading: isSearchLoading,
  } = useSearchPostsByAuthor(debouncedSearch, resolvedHandle);

  // Listen for refresh event (tab click / F5 / header button)
  useEffect(() => {
    const handler = () => {
      refetchProfile();
      refetchFeed();
      refetchReplies();
      refetchLikes();
      refetchMedia();
      refetchActorFeeds();
      refetchActorLists();
      refetchStarterPacks();
      if (isOwnProfile) refetchBookmarks();
    };
    window.addEventListener("kazahana:refresh", handler);
    return () => window.removeEventListener("kazahana:refresh", handler);
  }, [refetchProfile, refetchFeed, refetchReplies, refetchLikes, refetchMedia, refetchActorFeeds, refetchActorLists, refetchStarterPacks, refetchBookmarks, isOwnProfile]);
  const moderationOpts = useModerationOpts();

  const replyItems = useMemo(() => {
    if (!repliesData?.pages) return [];
    const all = repliesData.pages.flatMap((page) => page.feed);
    if (!moderationOpts) return all;
    return all.filter((item) => !moderatePost(item.post, moderationOpts).ui("contentList").filter);
  }, [repliesData, moderationOpts]);

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

  const loadMoreReplies = useCallback(() => {
    if (hasNextReplies && !isFetchingNextReplies) {
      fetchNextReplies();
    }
  }, [hasNextReplies, isFetchingNextReplies, fetchNextReplies]);

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

  const searchItems = useMemo(() => {
    if (!searchData?.pages) return [];
    const all = searchData.pages.flatMap((page) => page.posts);
    if (!moderationOpts) return all;
    return all.filter((post) => !moderatePost(post, moderationOpts).ui("contentList").filter);
  }, [searchData, moderationOpts]);

  const loadMoreSearch = useCallback(() => {
    if (hasNextSearch && !isFetchingNextSearch) {
      fetchNextSearch();
    }
  }, [hasNextSearch, isFetchingNextSearch, fetchNextSearch]);

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

      {/* Tabs */}
      <div ref={tabsRef} className="sticky top-0 z-20 bg-white dark:bg-bg-dark flex border-b border-border-light dark:border-border-dark">
        {(isOwnProfile
          ? (["posts", "replies", "likes", "media", "bookmarks", "starterPacks"] as const)
          : (["posts", "replies", "media", "starterPacks"] as const)
        ).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => {
              if (tab === tabKey) {
                document.querySelector("main")?.scrollTo({ top: 0, behavior: "instant" });
                window.dispatchEvent(new CustomEvent("kazahana:refresh"));
              } else {
                const tabsEl = tabsRef.current;
                if (scrollParent && tabsEl && scrollParent.scrollTop >= tabsEl.offsetTop) {
                  scrollLockRef.current = tabsEl.offsetTop;
                }
                setTab(tabKey);
                if (tabKey === "bookmarks") refetchBookmarks();
              }
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

      {/* Tab content — min-h-screen prevents scroll jump when Virtuoso remounts on tab switch */}
      <div className="min-h-screen">
      {tab === "posts" && (
        <>
          {/* Search bar */}
          <div className="px-3 py-2 border-b border-border-light dark:border-border-dark">
            <div className="relative">
              <Icon name="search" size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("profile.searchPlaceholder")}
                className="w-full pl-8 pr-8 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark rounded-full border border-transparent focus:border-primary focus:outline-none"
              />
              {searchInput && (
                <button
                  type="button"
                  title={t("common.clear")}
                  onClick={() => { setSearchInput(""); setDebouncedSearch(""); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Search results or normal feed */}
          {debouncedSearch ? (
            isSearchLoading ? (
              <LoadingSpinner />
            ) : searchItems.length > 0 && scrollParent ? (
              <Virtuoso
                customScrollParent={scrollParent}
                data={searchItems}
                endReached={loadMoreSearch}
                overscan={200}
                itemContent={(_index, post: PostView) => (
                  <PostCard feedItem={{ post } as FeedViewPost} showParentContext />
                )}
                components={{
                  Footer: () =>
                    isFetchingNextSearch ? (
                      <LoadingSpinner />
                    ) : null,
                }}
              />
            ) : (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <p>{t("profile.noSearchResults")}</p>
              </div>
            )
          ) : (
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
        </>
      )}
      {tab === "replies" && (
        replyItems.length > 0 && scrollParent ? (
          <Virtuoso
            customScrollParent={scrollParent}
            data={replyItems}
            endReached={loadMoreReplies}
            overscan={200}
            itemContent={(_index, item: FeedViewPost) => (
              <PostCard feedItem={item} showParentContext />
            )}
            components={{
              Footer: () =>
                isFetchingNextReplies ? (
                  <LoadingSpinner />
                ) : null,
            }}
          />
        ) : !replyItems.length ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <p>{t("profile.noReplies")}</p>
          </div>
        ) : null
      )}
      {tab === "likes" && (
        isLoadingLikes ? (
          <LoadingSpinner />
        ) : isLikesError ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <p>{t("profile.likesUnavailable")}</p>
          </div>
        ) : likeItems.length > 0 && scrollParent ? (
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
      {tab === "feeds" && <ActorFeedsList handle={resolvedHandle} scrollParent={scrollParent} />}
      {tab === "lists" && <ActorListsList handle={resolvedHandle} scrollParent={scrollParent} />}
      {tab === "starterPacks" && <StarterPacksList handle={resolvedHandle} scrollParent={scrollParent} />}
      </div>
    </div>
  );
}
