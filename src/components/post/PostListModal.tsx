import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { moderateProfile, moderatePost } from "@atproto/api";
import type { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import type { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { usePostListStore } from "../../stores/postListStore";
import { useLikes, useRepostedBy, useQuotes } from "../../hooks/usePostLists";
import { useModerationOpts } from "../../contexts/ModerationContext";
import { UserListItem } from "../profile/UserListItem";
import { PostCard } from "../timeline/PostCard";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Icon } from "../common/Icon";

export function PostListModal() {
  const { isOpen, type, uri, close } = usePostListStore();

  if (!isOpen || !type) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="bg-white dark:bg-bg-dark rounded-card w-full max-w-md mx-4 shadow-xl max-h-[70vh] flex flex-col">
        <ModalContent type={type} uri={uri} onClose={close} />
      </div>
    </div>
  );
}

function ModalContent({
  type,
  uri,
  onClose,
}: {
  type: "likes" | "reposts" | "quotes";
  uri: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  const titleKey = {
    likes: "postList.likedBy",
    reposts: "postList.repostedBy",
    quotes: "postList.quotedBy",
  }[type];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark flex-shrink-0">
        <h2 className="text-sm font-bold text-text-light dark:text-text-dark">
          {t(titleKey)}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {type === "likes" && <LikesList uri={uri} />}
        {type === "reposts" && <RepostsList uri={uri} />}
        {type === "quotes" && <QuotesList uri={uri} />}
      </div>
    </>
  );
}

function LikesList({ uri }: { uri: string }) {
  const { t } = useTranslation();
  const moderationOpts = useModerationOpts();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useLikes(uri);

  const items = useMemo(() => {
    if (!data?.pages) return [];
    const all = data.pages.flatMap((page) => page.likes.map((like) => like.actor));
    if (!moderationOpts) return all;
    return all.filter((actor) => !moderateProfile(actor, moderationOpts).ui("profileList").filter);
  }, [data, moderationOpts]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <p className="text-center py-8 text-gray-500">{t("postList.loadFailed")}</p>;
  if (items.length === 0) return <p className="text-center py-8 text-gray-400">{t("postList.empty")}</p>;

  return (
    <div>
      {items.map((actor: ProfileView) => (
        <UserListItem key={actor.did} actor={actor} />
      ))}
      {hasNextPage && (
        <button onClick={loadMore} className="w-full py-3 text-sm text-primary hover:underline">
          {isFetchingNextPage ? <LoadingSpinner /> : t("postList.loadMore")}
        </button>
      )}
    </div>
  );
}

function RepostsList({ uri }: { uri: string }) {
  const { t } = useTranslation();
  const moderationOpts = useModerationOpts();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useRepostedBy(uri);

  const items = useMemo(() => {
    if (!data?.pages) return [];
    const all = data.pages.flatMap((page) => page.repostedBy);
    if (!moderationOpts) return all;
    return all.filter((actor) => !moderateProfile(actor, moderationOpts).ui("profileList").filter);
  }, [data, moderationOpts]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <p className="text-center py-8 text-gray-500">{t("postList.loadFailed")}</p>;
  if (items.length === 0) return <p className="text-center py-8 text-gray-400">{t("postList.empty")}</p>;

  return (
    <div>
      {items.map((actor: ProfileView) => (
        <UserListItem key={actor.did} actor={actor} />
      ))}
      {hasNextPage && (
        <button onClick={loadMore} className="w-full py-3 text-sm text-primary hover:underline">
          {isFetchingNextPage ? <LoadingSpinner /> : t("postList.loadMore")}
        </button>
      )}
    </div>
  );
}

function QuotesList({ uri }: { uri: string }) {
  const { t } = useTranslation();
  const moderationOpts = useModerationOpts();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useQuotes(uri);

  const items = useMemo(() => {
    if (!data?.pages) return [];
    const all = data.pages.flatMap((page) => page.posts);
    if (!moderationOpts) return all;
    return all.filter((post) => !moderatePost(post, moderationOpts).ui("contentList").filter);
  }, [data, moderationOpts]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <p className="text-center py-8 text-gray-500">{t("postList.loadFailed")}</p>;
  if (items.length === 0) return <p className="text-center py-8 text-gray-400">{t("postList.empty")}</p>;

  return (
    <div>
      {items.map((post: PostView) => (
        <PostCard key={post.uri} feedItem={{ post, $type: "app.bsky.feed.defs#feedViewPost" }} />
      ))}
      {hasNextPage && (
        <button onClick={loadMore} className="w-full py-3 text-sm text-primary hover:underline">
          {isFetchingNextPage ? <LoadingSpinner /> : t("postList.loadMore")}
        </button>
      )}
    </div>
  );
}
