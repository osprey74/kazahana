import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import type { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { getAgent } from "../../lib/agent";
import { useComposeStore } from "../../stores/composeStore";
import { usePostListStore } from "../../stores/postListStore";
import { useDeletePost } from "../../hooks/usePost";
import { Icon } from "../common/Icon";

interface PostActionsProps {
  post: PostView;
}

export function PostActions({ post }: PostActionsProps) {
  const { t } = useTranslation();
  const [liked, setLiked] = useState(!!post.viewer?.like);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [likeUri, setLikeUri] = useState(post.viewer?.like ?? "");

  const [reposted, setReposted] = useState(!!post.viewer?.repost);
  const [repostCount, setRepostCount] = useState(post.repostCount ?? 0);
  const [repostUri, setRepostUri] = useState(post.viewer?.repost ?? "");

  const [bookmarked, setBookmarked] = useState(!!post.viewer?.bookmarked);
  const queryClient = useQueryClient();

  // Sync state when Virtuoso recycles this component for a different post
  useEffect(() => {
    setLiked(!!post.viewer?.like);
    setLikeCount(post.likeCount ?? 0);
    setLikeUri(post.viewer?.like ?? "");
    setReposted(!!post.viewer?.repost);
    setRepostCount(post.repostCount ?? 0);
    setRepostUri(post.viewer?.repost ?? "");
    setBookmarked(!!post.viewer?.bookmarked);
  }, [post.uri]); // eslint-disable-line react-hooks/exhaustive-deps

  const replyCount = post.replyCount ?? 0;
  const quoteCount = post.quoteCount ?? 0;
  const replyDisabled = !!post.viewer?.replyDisabled;
  const openCompose = useComposeStore((s) => s.open);
  const openPostList = usePostListStore((s) => s.open);

  const isOwnPost = post.author.did === getAgent().session?.did;

  const handleReply = () => {
    const record = post.record as { text?: string };
    openCompose({
      uri: post.uri,
      cid: post.cid,
      author: {
        handle: post.author.handle,
        displayName: post.author.displayName,
        avatar: post.author.avatar,
      },
      text: record.text ?? "",
    });
  };

  const handleLike = async () => {
    const agent = getAgent();
    try {
      if (liked) {
        if (likeUri) {
          const { rkey } = parseUri(likeUri);
          await agent.deleteLike(rkey);
        }
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
        setLikeUri("");
      } else {
        const res = await agent.like(post.uri, post.cid);
        setLiked(true);
        setLikeCount((c) => c + 1);
        setLikeUri(res.uri);
      }
    } catch {
      // revert on error
    }
  };

  const handleBookmark = async () => {
    const agent = getAgent();
    try {
      if (bookmarked) {
        await agent.app.bsky.bookmark.deleteBookmark({ uri: post.uri });
        setBookmarked(false);
      } else {
        await agent.app.bsky.bookmark.createBookmark({ uri: post.uri, cid: post.cid });
        setBookmarked(true);
      }
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    } catch {
      // revert on error
    }
  };

  const handleRepost = async () => {
    const agent = getAgent();
    try {
      if (reposted) {
        if (repostUri) {
          const { rkey } = parseUri(repostUri);
          await agent.deleteRepost(rkey);
        }
        setReposted(false);
        setRepostCount((c) => Math.max(0, c - 1));
        setRepostUri("");
      } else {
        const res = await agent.repost(post.uri, post.cid);
        setReposted(true);
        setRepostCount((c) => c + 1);
        setRepostUri(res.uri);
      }
    } catch {
      // revert on error
    }
  };

  return (
    <div className="flex items-center gap-6 -ml-1">
      <ActionButton
        icon="chat_bubble_outline"
        count={replyCount}
        active={false}
        disabled={replyDisabled}
        onClick={handleReply}
      />
      <ActionButton
        icon="repeat"
        count={repostCount}
        active={reposted}
        activeColor="text-green-600"
        onClick={handleRepost}
        onCountClick={() => openPostList("reposts", post.uri)}
      />
      <ActionButton
        icon={liked ? "favorite" : "favorite_border"}
        count={likeCount}
        active={liked}
        activeColor="text-red-500"
        onClick={handleLike}
        onCountClick={() => openPostList("likes", post.uri)}
      />
      <ActionButton
        icon="format_quote"
        count={quoteCount}
        active={false}
        onClick={() => openPostList("quotes", post.uri)}
      />
      <ActionButton
        icon="bookmark"
        count={0}
        active={bookmarked}
        activeColor="text-amber-500"
        onClick={handleBookmark}
      />
      <PostMenu post={post} isOwnPost={isOwnPost} />
    </div>
  );
}

function PostMenu({ post, isOwnPost }: { post: PostView; isOwnPost: boolean }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const deletePost = useDeletePost();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleDelete = () => {
    setOpen(false);
    setConfirming(true);
  };

  const confirmDelete = () => {
    setConfirming(false);
    deletePost.mutate(post.uri);
  };

  const handleHidePost = async () => {
    setOpen(false);
    try {
      await getAgent().hidePost(post.uri);
      queryClient.invalidateQueries({ queryKey: ["moderationOpts"] });
    } catch {
      // silently fail
    }
  };

  return (
    <>
      <div className="relative ml-auto" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 transition-colors"
        >
          <Icon name="more_vert" size={16} />
        </button>
        {open && (
          <div className="absolute right-0 bottom-6 z-50 bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg py-1 min-w-[120px]">
            {isOwnPost ? (
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon name="delete" size={16} />
                <span>{t("post.delete")}</span>
              </button>
            ) : (
              <button
                onClick={handleHidePost}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon name="visibility_off" size={16} />
                <span>{t("post.hidePost")}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirming(false)}>
          <div className="bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl shadow-xl p-5 mx-4 max-w-[280px] w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-text-light dark:text-text-dark text-center mb-4">{t("post.deleteConfirm")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-2 text-sm font-medium rounded-lg border border-border-light dark:border-border-dark text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t("post.deleteCancel")}
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                {t("post.deleteAction")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ActionButton({
  icon,
  count,
  active,
  activeColor = "",
  disabled = false,
  onClick,
  onCountClick,
}: {
  icon: string;
  count: number;
  active: boolean;
  activeColor?: string;
  disabled?: boolean;
  onClick: () => void;
  onCountClick?: () => void;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`flex items-center gap-1 text-xs transition-colors ${
        disabled
          ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
          : active
            ? activeColor
            : "text-gray-500 hover:text-primary"
      }`}
    >
      <Icon name={icon} size={16} filled={active} />
      {count > 0 && (
        <span
          onClick={onCountClick ? (e) => { e.stopPropagation(); onCountClick(); } : undefined}
          className={onCountClick ? "hover:underline" : ""}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function parseUri(uri: string) {
  const parts = uri.split("/");
  return {
    rkey: parts[parts.length - 1],
  };
}
