import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Notification } from "@atproto/api/dist/client/types/app/bsky/notification/listNotifications";
import type { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { formatDistanceToNowStrict } from "date-fns";
import { ja } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { getAgent } from "../../lib/agent";
import { useComposeStore } from "../../stores/composeStore";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";

interface NotificationItemProps {
  notification: Notification;
  subjectPost?: PostView;
}

const REASON_ICONS: Record<string, string> = {
  like: "favorite",
  repost: "repeat",
  follow: "person_add",
  mention: "chat_bubble",
  reply: "chat_bubble",
  quote: "repeat",
};

const REASON_KEYS: Record<string, string> = {
  like: "notification.liked",
  repost: "notification.reposted",
  follow: "notification.followed",
  mention: "notification.mentioned",
  reply: "notification.replied",
  quote: "notification.quoted",
};

export function NotificationItem({ notification, subjectPost }: NotificationItemProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { author, reason, indexedAt, isRead } = notification;
  const icon = REASON_ICONS[reason] ?? "notifications";
  const labelKey = REASON_KEYS[reason];
  const label = labelKey ? t(labelKey) : "";

  const locale = i18n.language.startsWith("ja") ? ja : enUS;
  const timeAgo = formatDistanceToNowStrict(new Date(indexedAt), {
    locale,
    addSuffix: false,
  });

  const record = notification.record as { text?: string } | undefined;
  const subjectUri = notification.reasonSubject;

  const handleClick = () => {
    if (reason === "follow") return;
    // For reply/mention/quote, navigate to the notification's own post (the reply itself).
    // For like/repost, navigate to the subject post (the post that was liked/reposted).
    let targetUri = (reason === "reply" || reason === "mention" || reason === "quote")
      ? notification.uri
      : subjectUri || notification.uri;
    // If the subject is a repost record URI, use the resolved original post URI
    if (targetUri?.includes("/app.bsky.feed.repost/") && subjectPost?.uri) {
      targetUri = subjectPost.uri;
    }
    if (targetUri) {
      navigate(`/post/${encodeURIComponent(targetUri)}`, { state: { from: "/notifications" } });
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${author.handle}`);
  };

  // For reply/mention/quote: show the notification's own record text
  // For like/repost: show the subject post's text
  const displayText =
    (reason === "reply" || reason === "mention" || reason === "quote")
      ? record?.text
      : (reason === "like" || reason === "repost")
        ? (subjectPost?.record as { text?: string } | undefined)?.text
        : undefined;

  // The post to show action buttons for
  const actionPost = subjectPost;

  return (
    <div
      onClick={handleClick}
      className={`flex gap-3 px-4 py-3 border-b border-border-light dark:border-border-dark transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
        !isRead ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
      }`}
    >
      <button onClick={handleProfileClick} className="self-start hover:opacity-80">
        <Avatar src={author.avatar} size="sm" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-sm">
          <Icon name={icon} size={16} className={`flex-shrink-0 ${reason === "like" ? "text-red-500" : reason === "repost" ? "text-green-500" : "text-gray-500"}`} filled={reason === "like"} />
          <button onClick={handleProfileClick} className="font-bold text-text-light dark:text-text-dark truncate hover:underline">
            {author.displayName || author.handle}
          </button>
          <span className="text-gray-700 dark:text-gray-300 flex-shrink-0">{label}</span>
        </div>
        {displayText && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">
            {displayText}
          </p>
        )}
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs text-gray-400">{timeAgo}</span>
          {actionPost && reason !== "follow" && (
            <NotificationActions post={actionPost} />
          )}
        </div>
      </div>
    </div>
  );
}

/** Compact action buttons (reply, repost, like) for a notification's post */
function NotificationActions({ post }: { post: PostView }) {
  const openCompose = useComposeStore((s) => s.open);
  const [liked, setLiked] = useState(!!post.viewer?.like);
  const [likeUri, setLikeUri] = useState(post.viewer?.like ?? "");
  const [reposted, setReposted] = useState(!!post.viewer?.repost);
  const [repostUri, setRepostUri] = useState(post.viewer?.repost ?? "");

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    const record = post.record as { text?: string; reply?: { root: { uri: string; cid: string } } };
    const root = record.reply?.root ?? { uri: post.uri, cid: post.cid };
    openCompose({ replyTo: {
      uri: post.uri, cid: post.cid, root,
      author: { handle: post.author.handle, displayName: post.author.displayName, avatar: post.author.avatar },
      text: record.text ?? "",
    }});
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const agent = getAgent();
      if (liked) {
        if (likeUri) await agent.deleteLike(likeUri);
        setLiked(false);
        setLikeUri("");
      } else {
        const res = await agent.like(post.uri, post.cid);
        setLiked(true);
        setLikeUri(res.uri);
      }
    } catch { /* ignore */ }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const agent = getAgent();
      if (reposted) {
        if (repostUri) await agent.deleteRepost(repostUri);
        setReposted(false);
        setRepostUri("");
      } else {
        const res = await agent.repost(post.uri, post.cid);
        setReposted(true);
        setRepostUri(res.uri);
      }
    } catch { /* ignore */ }
  };

  return (
    <div className="flex items-center gap-3 ml-auto" onClick={(e) => e.stopPropagation()}>
      <button onClick={handleReply} title="Reply" className="text-gray-400 hover:text-primary transition-colors">
        <Icon name="chat_bubble_outline" size={14} />
      </button>
      <button onClick={handleRepost} title="Repost" className={`transition-colors ${reposted ? "text-green-600" : "text-gray-400 hover:text-green-600"}`}>
        <Icon name="repeat" size={14} filled={reposted} />
      </button>
      <button onClick={handleLike} title="Like" className={`transition-colors ${liked ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}>
        <Icon name={liked ? "favorite" : "favorite_border"} size={14} filled={liked} />
      </button>
    </div>
  );
}
