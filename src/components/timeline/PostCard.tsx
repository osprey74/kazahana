import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import type { ViewImage } from "@atproto/api/dist/client/types/app/bsky/embed/images";
import { formatDistanceToNowStrict } from "date-fns";
import { ja } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { Avatar } from "../common/Avatar";
import { ImageGrid } from "../common/ImageGrid";
import { PostContent } from "./PostContent";
import { PostActions } from "./PostActions";

interface PostCardProps {
  feedItem: FeedViewPost;
  showParentContext?: boolean;
}

export function PostCard({ feedItem, showParentContext }: PostCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { post, reason } = feedItem;
  const author = post.author;
  const record = post.record as { text?: string; facets?: unknown[]; createdAt?: string; reply?: { parent?: { uri: string }; root?: { uri: string } } };

  const isRepost =
    reason?.$type === "app.bsky.feed.defs#reasonRepost";
  const repostBy = isRepost
    ? (reason as { by?: { displayName?: string; handle?: string } }).by
    : null;

  const images = getImages(post);
  const locale = i18n.language.startsWith("ja") ? ja : enUS;
  const timeAgo = record.createdAt
    ? formatDistanceToNowStrict(new Date(record.createdAt), { locale, addSuffix: false })
    : "";

  // Parent post context for reply posts
  const parentPost = showParentContext
    ? (feedItem.reply?.parent as { author?: { displayName?: string; handle?: string; avatar?: string }; record?: { text?: string }; uri?: string } | undefined)
    : undefined;
  const hasParentContext = !!(parentPost?.author);

  return (
    <article
      className="px-4 py-3 border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      onClick={(e) => {
        // Don't navigate if clicking on a button or link
        if ((e.target as HTMLElement).closest("button, a")) return;
        navigate(`/post/${encodeURIComponent(post.uri)}`);
      }}
    >
      {isRepost && repostBy && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1 ml-12">
          <span>🔁</span>
          <span>{repostBy.displayName || repostBy.handle} {t("post.reposted")}</span>
        </div>
      )}

      {/* Parent post context */}
      {hasParentContext && (
        <div className="flex gap-3 mb-1">
          <div className="flex flex-col items-center">
            <button onClick={() => navigate(`/profile/${parentPost!.author!.handle}`)} className="hover:opacity-80">
              <Avatar src={parentPost!.author!.avatar} alt={parentPost!.author!.displayName} size="sm" />
            </button>
            <div className="w-0.5 flex-1 bg-gray-300 dark:bg-gray-600 mt-1" />
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-baseline gap-1">
              <button onClick={() => navigate(`/profile/${parentPost!.author!.handle}`)} className="flex items-baseline gap-1 min-w-0 hover:underline">
                <span className="font-bold text-xs text-text-light dark:text-text-dark truncate">
                  {parentPost!.author!.displayName || parentPost!.author!.handle}
                </span>
                <span className="text-xs text-gray-500 truncate">
                  @{parentPost!.author!.handle}
                </span>
              </button>
            </div>
            {parentPost!.record?.text && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-3 whitespace-pre-wrap break-words leading-relaxed">
                {parentPost!.record.text}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => navigate(`/profile/${author.handle}`)} className="self-start hover:opacity-80">
          <Avatar src={author.avatar} alt={author.displayName} badge={!hasParentContext && (feedItem.reply?.parent || record.reply?.parent) ? "reply" : undefined} />
        </button>

        <div className="flex-1 min-w-0">
          {/* Author info */}
          <div className="flex items-baseline gap-1">
            <button onClick={() => navigate(`/profile/${author.handle}`)} className="flex items-baseline gap-1 min-w-0 hover:underline">
              <span className="font-bold text-sm text-text-light dark:text-text-dark truncate">
                {author.displayName || author.handle}
              </span>
              <span className="text-xs text-gray-500 truncate">
                @{author.handle}
              </span>
            </button>
            {timeAgo && (
              <>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {timeAgo}
                </span>
              </>
            )}
          </div>

          {/* Reply indicator (only when no parent context shown) */}
          {!hasParentContext && (
            feedItem.reply?.parent ? (
              <div className="text-xs text-gray-500 mt-0.5">
                <span>
                  ↩ {(feedItem.reply.parent as { author?: { handle?: string } }).author?.handle ?? "..."} {t("post.replyTo")}
                </span>
              </div>
            ) : record.reply?.parent ? (
              <div className="text-xs text-gray-500 mt-0.5">
                <span>↩ {t("post.replyTo")}</span>
              </div>
            ) : null
          )}

          {/* Post text */}
          {record.text && (
            <div className="mt-1">
              <PostContent
                text={record.text}
                facets={record.facets as Parameters<typeof PostContent>[0]["facets"]}
              />
            </div>
          )}

          {/* Images */}
          {images.length > 0 && <ImageGrid images={images} />}

          {/* Actions */}
          <PostActions post={post} />
        </div>
      </div>
    </article>
  );
}

function getImages(post: FeedViewPost["post"]): ViewImage[] {
  const embed = post.embed;
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
