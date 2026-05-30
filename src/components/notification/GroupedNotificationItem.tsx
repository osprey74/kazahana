import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { AppBskyFeedDefs, AppBskyEmbedImages } from "@atproto/api";
type PostView = AppBskyFeedDefs.PostView;
type ViewImage = AppBskyEmbedImages.ViewImage;
import { formatDistanceToNowStrict } from "date-fns";
import { ja } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { getAgent } from "../../lib/agent";
import { useComposeStore } from "../../stores/composeStore";
import type { NotificationGroup } from "../../hooks/useNotifications";
import { Avatar } from "../common/Avatar";
import { BotBadge, isBotAccount } from "../common/BotBadge";
import { Icon } from "../common/Icon";
import { PostContent } from "../timeline/PostContent";
import { getExternalEmbed } from "../../lib/embed/external";

interface GroupedNotificationItemProps {
  group: NotificationGroup;
  subjectPosts: Record<string, PostView>;
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

interface VideoEmbed {
  playlist: string;
  thumbnail?: string;
  alt?: string;
  aspectRatio?: { width: number; height: number };
}

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

export function GroupedNotificationItem({ group, subjectPosts }: GroupedNotificationItemProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { reason, notifications, isRead, indexedAt } = group;
  const latestNotif = notifications[0];
  const isGrouped = notifications.length > 1;
  const icon = REASON_ICONS[reason] ?? "notifications";

  const locale = i18n.language.startsWith("ja") ? ja : enUS;
  const timeAgo = formatDistanceToNowStrict(new Date(indexedAt), { locale, addSuffix: false });

  // Build label
  let label: string;
  if (isGrouped) {
    const name = latestNotif.author.displayName || latestNotif.author.handle;
    const rest = notifications.length - 1;
    const reasonKey = REASON_KEYS[reason];
    label = reasonKey
      ? t("notification.grouped", { name, count: rest, action: t(reasonKey) })
      : "";
  } else {
    const labelKey = REASON_KEYS[reason];
    label = labelKey ? t(labelKey) : "";
  }

  // Get subject post from batch-loaded cache
  const subjectUri = (() => {
    if (reason === "reply" || reason === "mention" || reason === "quote") return latestNotif.uri;
    if (latestNotif.reasonSubject) return latestNotif.reasonSubject;
    return null;
  })();
  const displayPost = subjectUri ? subjectPosts[subjectUri] : undefined;
  const displayRecord = displayPost?.record as { text?: string; facets?: unknown[]; createdAt?: string } | undefined;
  const fallbackText = (reason === "reply" || reason === "mention" || reason === "quote")
    ? (latestNotif.record as { text?: string } | undefined)?.text
    : undefined;

  const images = getPostImages(displayPost);
  const videoEmbed = getVideoEmbed(displayPost);
  const externalEmbed = getExternalEmbed(displayPost);
  const quoteEmbed = getQuoteEmbed(displayPost);

  const handleClick = () => {
    if (reason === "follow") return;
    let targetUri = (reason === "reply" || reason === "mention" || reason === "quote")
      ? latestNotif.uri
      : latestNotif.reasonSubject || latestNotif.uri;
    if (targetUri?.includes("/app.bsky.feed.repost/") && displayPost?.uri) {
      targetUri = displayPost.uri;
    }
    if (targetUri) {
      navigate(`/post/${encodeURIComponent(targetUri)}`, { state: { from: "/notifications" } });
    }
  };

  const handleProfileClick = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    navigate(`/profile/${handle}`);
  };

  const iconColor = (reason === "like" || reason === "like-via-repost")
    ? "text-red-500"
    : (reason === "repost" || reason === "repost-via-repost")
      ? "text-green-500"
      : "text-gray-500";
  const iconFilled = reason === "like" || reason === "like-via-repost";

  return (
    <div
      onClick={handleClick}
      className={`px-4 py-3 border-b border-border-light dark:border-border-dark transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
        !isRead ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
      }`}
    >
      {/* Notification header */}
      <div className="flex items-center gap-2 mb-2">
        <Icon name={icon} size={16} className={`flex-shrink-0 ${iconColor}`} filled={iconFilled} />

        {/* Avatars */}
        {isGrouped ? (
          <div className="flex items-center -space-x-2 flex-shrink-0">
            {notifications.slice(0, 3).map((notif, i) => (
              <button
                key={notif.uri}
                onClick={(e) => handleProfileClick(e, notif.author.handle)}
                className="hover:opacity-80 rounded-full ring-2 ring-white dark:ring-bg-dark"
                style={{ zIndex: 3 - i }}
              >
                <Avatar src={notif.author.avatar} size="xs" />
              </button>
            ))}
          </div>
        ) : (
          <button onClick={(e) => handleProfileClick(e, latestNotif.author.handle)} className="self-start hover:opacity-80 flex-shrink-0">
            <Avatar src={latestNotif.author.avatar} size="sm" />
          </button>
        )}

        {/* Label */}
        <div className="flex items-center gap-1 min-w-0 text-sm">
          {isGrouped ? (
            <span className="text-gray-700 dark:text-gray-300 truncate">{label}</span>
          ) : (
            <>
              <button onClick={(e) => handleProfileClick(e, latestNotif.author.handle)} className="font-bold text-text-light dark:text-text-dark truncate hover:underline">
                {latestNotif.author.displayName || latestNotif.author.handle}
              </button>
              {isBotAccount(latestNotif.author) && <BotBadge size={13} />}
              <span className="text-gray-700 dark:text-gray-300 flex-shrink-0">{label}</span>
            </>
          )}
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0 ml-auto">{timeAgo}</span>
      </div>

      {/* Post content */}
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
          {/* Images: 64px square thumbnails */}
          {images.length > 0 && (
            <div className="flex gap-1 mt-2">
              {images.map((img, i) => (
                <div key={i} className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                  <img src={img.thumb} alt={img.alt || ""} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
          {/* Video: thumbnail only, no controls */}
          {videoEmbed && (
            <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700 mt-2">
              {videoEmbed.thumbnail ? (
                <img src={videoEmbed.thumbnail} alt={videoEmbed.alt || ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="play_circle" size={24} className="text-white/60" />
              </div>
            </div>
          )}
          {externalEmbed && externalEmbed.thumb && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                <img src={externalEmbed.thumb} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="truncate">{externalEmbed.title}</span>
            </div>
          )}
          {quoteEmbed && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">
              {(quoteEmbed as { value?: { text?: string } }).value?.text ?? ""}
            </div>
          )}

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
