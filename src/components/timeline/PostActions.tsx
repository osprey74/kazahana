import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import type { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { getAgent } from "../../lib/agent";
import { useComposeStore } from "../../stores/composeStore";
import { usePostListStore } from "../../stores/postListStore";
import { useReportStore } from "../../stores/reportStore";
import { useDeletePost } from "../../hooks/usePost";
import { useMuteActor, useUnmuteActor } from "../../hooks/useProfile";
import { openUrl } from "@tauri-apps/plugin-opener";
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
  const [quoteMenuOpen, setQuoteMenuOpen] = useState(false);
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

  // Check if quoting is disabled on this post
  const quoteDisabled = !!(post.viewer as { embeddingDisabled?: boolean } | undefined)?.embeddingDisabled;

  const handleReply = () => {
    const record = post.record as { text?: string; reply?: { root: { uri: string; cid: string } } };
    // If the post is itself a reply, its record.reply.root is the thread root.
    // Otherwise, this post IS the root.
    const root = record.reply?.root ?? { uri: post.uri, cid: post.cid };
    openCompose({ replyTo: {
      uri: post.uri,
      cid: post.cid,
      root,
      author: {
        handle: post.author.handle,
        displayName: post.author.displayName,
        avatar: post.author.avatar,
      },
      text: record.text ?? "",
    }});
  };

  const handleQuotePost = () => {
    setQuoteMenuOpen(false);
    const record = post.record as { text?: string };
    openCompose({ quoteTo: {
      uri: post.uri,
      cid: post.cid,
      author: {
        handle: post.author.handle,
        displayName: post.author.displayName,
        avatar: post.author.avatar,
      },
      text: record.text ?? "",
    }});
  };

  const handleLike = async () => {
    const agent = getAgent();
    try {
      if (liked) {
        if (likeUri) {
          await agent.deleteLike(likeUri);
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
          await agent.deleteRepost(repostUri);
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
      <div className="relative">
        <ActionButton
          icon="format_quote"
          count={quoteCount}
          active={false}
          onClick={() => setQuoteMenuOpen((v) => !v)}
          onCountClick={() => openPostList("quotes", post.uri)}
        />
        {quoteMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setQuoteMenuOpen(false); }} />
            <div className="absolute left-0 bottom-6 z-50 bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg py-1 min-w-[160px] whitespace-nowrap">
              {!quoteDisabled && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleQuotePost(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Icon name="edit" size={16} />
                  <span>{t("post.quotePost")}</span>
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setQuoteMenuOpen(false); openPostList("quotes", post.uri); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon name="format_quote" size={16} />
                <span>{t("post.viewQuotes")}</span>
              </button>
            </div>
          </>
        )}
      </div>
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
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [threadMuted, setThreadMuted] = useState(!!post.viewer?.threadMuted);
  const deletePost = useDeletePost();
  const muteActor = useMuteActor();
  const unmuteActor = useUnmuteActor();
  const [userMuted, setUserMuted] = useState(!!post.author.viewer?.muted);

  useEffect(() => {
    setUserMuted(!!post.author.viewer?.muted);
  }, [post.author.viewer?.muted]);

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

  const handleCopyLink = () => {
    setOpen(false);
    const rkey = post.uri.split("/").pop();
    const url = `https://bsky.app/profile/${post.author.handle}/post/${rkey}`;
    navigator.clipboard.writeText(url);
  };

  const handleToggleMuteThread = async () => {
    setOpen(false);
    try {
      const agent = getAgent();
      if (threadMuted) {
        await agent.app.bsky.graph.unmuteThread({ root: post.uri });
        setThreadMuted(false);
      } else {
        await agent.app.bsky.graph.muteThread({ root: post.uri });
        setThreadMuted(true);
      }
    } catch {
      // silently fail
    }
  };

  const handleToggleMuteUser = async () => {
    setOpen(false);
    try {
      if (userMuted) {
        await unmuteActor.mutateAsync({ did: post.author.did });
        setUserMuted(false);
      } else {
        await muteActor.mutateAsync({ did: post.author.did });
        setUserMuted(true);
      }
    } catch {
      // silently fail
    }
  };

  return (
    <>
      <div className="relative ml-auto">
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 transition-colors"
        >
          <Icon name="more_vert" size={16} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
            <div className="absolute right-0 bottom-6 z-50 bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg py-1 min-w-[160px] whitespace-nowrap">
              {isOwnPost && (
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Icon name="delete" size={16} />
                  <span>{t("post.delete")}</span>
                </button>
              )}
              {!isOwnPost && (
                <>
                  <button
                    onClick={handleHidePost}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon name="visibility_off" size={16} />
                    <span>{t("post.hidePost")}</span>
                  </button>
                  <button
                    onClick={() => { setOpen(false); useReportStore.getState().open({ type: "post", uri: post.uri, cid: post.cid }); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon name="flag" size={16} />
                    <span>{t("report.reportPost")}</span>
                  </button>
                </>
              )}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon name="link" size={16} />
                <span>{t("post.copyLink")}</span>
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  const postText = (post.record as { text?: string })?.text ?? "";
                  const lang = i18n.language.startsWith("ja") ? "ja" : i18n.language.split("-")[0];
                  openUrl(`https://translate.google.com/?sl=auto&tl=${lang}&text=${encodeURIComponent(postText)}&op=translate`);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon name="translate" size={16} />
                <span>{t("post.translate")}</span>
              </button>
              <button
                onClick={handleToggleMuteThread}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon name={threadMuted ? "notifications_active" : "notifications_off"} size={16} />
                <span>{threadMuted ? t("post.unmuteThread") : t("post.muteThread")}</span>
              </button>
              {!isOwnPost && (
                <button
                  onClick={handleToggleMuteUser}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Icon name={userMuted ? "volume_up" : "volume_off"} size={16} />
                  <span>{userMuted ? t("post.unmuteUser") : t("post.muteUser")}</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { e.stopPropagation(); setConfirming(false); }}>
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
