import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Notification } from "@atproto/api/dist/client/types/app/bsky/notification/listNotifications";
import type { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import type { ViewImage } from "@atproto/api/dist/client/types/app/bsky/embed/images";
import { formatDistanceToNowStrict } from "date-fns";
import { ja } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { getAgent } from "../../lib/agent";
import { useComposeStore } from "../../stores/composeStore";
import { useSubjectPost } from "../../hooks/useNotifications";
import { Avatar } from "../common/Avatar";
import { BotBadge, isBotAccount } from "../common/BotBadge";
import { Icon } from "../common/Icon";
import { ImageGrid } from "../common/ImageGrid";
import { VideoPlayer } from "../common/VideoPlayer";
import { LinkCard } from "../common/LinkCard";
import { QuoteEmbed } from "../common/QuoteEmbed";
import { PostContent } from "../timeline/PostContent";

interface NotificationItemProps {
  notification: Notification;
}

const REASON_ICONS: Record<string, string> = {
  like: "favorite",
  repost: "repeat",
  follow: "person_add",
  mention: "chat_bubble",
  reply: "chat_bubble",
  quote: "repeat",
  "like-via-repost": "favorite",
  "repost-via-repost": "repeat",
};

const REASON_KEYS: Record<string, string> = {
  like: "notification.liked",
  repost: "notification.reposted",
  follow: "notification.followed",
  mention: "notification.mentioned",
  reply: "notification.replied",
  quote: "notification.quoted",
  "like-via-repost": "notification.likedViaRepost",
  "repost-via-repost": "notification.repostedViaRepost",
};

function getPostImages(post?: PostView): ViewImage[] {
  const embed = post?.embed;
  if (!embed) return [];
  if (embed.$type === "app.bsky.embed.images#view") {
    return (embed as { images?: ViewImage[] }).images ?? [];
  }
  if (embed.$type === "app.bsky.embed.recordWithMedia#view") {
    const media = (embed as { media?: { $type?: string; images?: ViewImage[] } }).media;
    if (media?.$type === "app.bsky.embed.images#view") {
      return media.images ?? [];
    }
  }
  return [];
}

interface ExternalEmbed {
  uri: string;
  title: string;
  description: string;
  thumb?: string;
}

function getExternalEmbed(post?: PostView): ExternalEmbed | null {
  const embed = post?.embed;
  if (!embed) return null;
  if (embed.$type === "app.bsky.embed.external#view") {
    return (embed as { external?: ExternalEmbed }).external ?? null;
  }
  if (embed.$type === "app.bsky.embed.recordWithMedia#view") {
    const media = (embed as { media?: { $type?: string; external?: ExternalEmbed } }).media;
    if (media?.$type === "app.bsky.embed.external#view") {
      return media.external ?? null;
    }
  }
  return null;
}

interface VideoEmbed {
  playlist: string;
  thumbnail?: string;
  alt?: string;
  aspectRatio?: { width: number; height: number };
  presentation?: string;
}

function getVideoEmbed(post?: PostView): VideoEmbed | null {
  const embed = post?.embed;
  if (!embed) return null;
  if (embed.$type === "app.bsky.embed.video#view") {
    return embed as unknown as VideoEmbed;
  }
  if (embed.$type === "app.bsky.embed.recordWithMedia#view") {
    const media = (embed as { media?: { $type?: string } }).media;
    if (media?.$type === "app.bsky.embed.video#view") {
      return media as unknown as VideoEmbed;
    }
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getQuoteEmbed(post?: PostView): Record<string, any> | null {
  const embed = post?.embed;
  if (!embed) return null;
  if (embed.$type === "app.bsky.embed.record#view") {
    return (embed as { record?: Record<string, unknown> }).record ?? null;
  }
  if (embed.$type === "app.bsky.embed.recordWithMedia#view") {
    const rec = (embed as { record?: { record?: Record<string, unknown> } }).record;
    return rec?.record ?? null;
  }
  return null;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const subjectPost = useSubjectPost(notification);
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

  const subjectUri = notification.reasonSubject;

  const handleClick = () => {
    if (reason === "follow") return;
    let targetUri = (reason === "reply" || reason === "mention" || reason === "quote")
      ? notification.uri
      : subjectUri || notification.uri;
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

  // Determine which post to display content from
  const displayPost = subjectPost;
  const displayRecord = displayPost?.record as { text?: string; facets?: unknown[]; createdAt?: string } | undefined;
  // For reply/mention/quote without subjectPost, fall back to notification record text
  const fallbackText = (reason === "reply" || reason === "mention" || reason === "quote")
    ? (notification.record as { text?: string } | undefined)?.text
    : undefined;

  const images = getPostImages(displayPost);
  const videoEmbed = getVideoEmbed(displayPost);
  const externalEmbed = getExternalEmbed(displayPost);
  const quoteEmbed = getQuoteEmbed(displayPost);

  return (
    <div
      onClick={handleClick}
      className={`px-4 py-3 border-b border-border-light dark:border-border-dark transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
        !isRead ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
      }`}
    >
      {/* Notification reason header */}
      <div className="flex items-center gap-2 mb-2">
        <Icon name={icon} size={16} className={`flex-shrink-0 ${reason === "like" || reason === "like-via-repost" ? "text-red-500" : reason === "repost" || reason === "repost-via-repost" ? "text-green-500" : "text-gray-500"}`} filled={reason === "like" || reason === "like-via-repost"} />
        <button onClick={handleProfileClick} className="self-start hover:opacity-80 flex-shrink-0">
          <Avatar src={author.avatar} size="sm" />
        </button>
        <div className="flex items-center gap-1 min-w-0 text-sm">
          <button onClick={handleProfileClick} className="font-bold text-text-light dark:text-text-dark truncate hover:underline">
            {author.displayName || author.handle}
          </button>
          {isBotAccount(author) && <BotBadge size={13} />}
          <span className="text-gray-700 dark:text-gray-300 flex-shrink-0">{label}</span>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0 ml-auto">{timeAgo}</span>
      </div>

      {/* Post content - full size like timeline */}
      {displayPost ? (
        <div className="ml-6">
          {displayRecord?.text && (
            <div className="mt-1">
              <PostContent
                text={displayRecord.text}
                facets={displayRecord.facets as Parameters<typeof PostContent>[0]["facets"]}
              />
            </div>
          )}
          {images.length > 0 && <ImageGrid images={images} />}
          {videoEmbed && (
            <>
              <VideoPlayer {...videoEmbed} />
              {videoEmbed.alt && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-1">{videoEmbed.alt}</p>
              )}
            </>
          )}
          {externalEmbed && <LinkCard external={externalEmbed} />}
          {quoteEmbed && <QuoteEmbed record={quoteEmbed} />}

          {/* Action buttons */}
          <div className="mt-2">
            <NotificationActions post={displayPost} />
          </div>
        </div>
      ) : fallbackText ? (
        <div className="ml-6">
          <p className="text-sm text-text-light dark:text-text-dark whitespace-pre-wrap break-words leading-relaxed">
            {fallbackText}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Action buttons (reply, repost, like) for a notification's post */
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
    <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
      <button onClick={handleReply} title="Reply" className="text-gray-400 hover:text-primary transition-colors">
        <Icon name="chat_bubble_outline" size={18} />
      </button>
      <button onClick={handleRepost} title="Repost" className={`transition-colors ${reposted ? "text-green-600" : "text-gray-400 hover:text-green-600"}`}>
        <Icon name="repeat" size={18} filled={reposted} />
      </button>
      <button onClick={handleLike} title="Like" className={`transition-colors ${liked ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}>
        <Icon name={liked ? "favorite" : "favorite_border"} size={18} filled={liked} />
      </button>
    </div>
  );
}
