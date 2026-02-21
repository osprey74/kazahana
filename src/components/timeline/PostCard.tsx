import { useNavigate } from "react-router-dom";
import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import type { ViewImage } from "@atproto/api/dist/client/types/app/bsky/embed/images";
import { formatDistanceToNowStrict } from "date-fns";
import { ja } from "date-fns/locale";
import { Avatar } from "../common/Avatar";
import { ImageGrid } from "../common/ImageGrid";
import { PostContent } from "./PostContent";
import { PostActions } from "./PostActions";

interface PostCardProps {
  feedItem: FeedViewPost;
}

export function PostCard({ feedItem }: PostCardProps) {
  const navigate = useNavigate();
  const { post, reason } = feedItem;
  const author = post.author;
  const record = post.record as { text?: string; facets?: unknown[]; createdAt?: string };

  const isRepost =
    reason?.$type === "app.bsky.feed.defs#reasonRepost";
  const repostBy = isRepost
    ? (reason as { by?: { displayName?: string; handle?: string } }).by
    : null;

  const images = getImages(post);
  const timeAgo = record.createdAt
    ? formatDistanceToNowStrict(new Date(record.createdAt), { locale: ja, addSuffix: false })
    : "";

  return (
    <article
      className="px-4 py-3 border-b border-border-light hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={(e) => {
        // Don't navigate if clicking on a button or link
        if ((e.target as HTMLElement).closest("button, a")) return;
        navigate(`/post/${encodeURIComponent(post.uri)}`);
      }}
    >
      {isRepost && repostBy && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1 ml-12">
          <span>🔁</span>
          <span>{repostBy.displayName || repostBy.handle} がリポスト</span>
        </div>
      )}

      <div className="flex gap-3">
        <Avatar src={author.avatar} alt={author.displayName} />

        <div className="flex-1 min-w-0">
          {/* Author info */}
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-sm text-text-light truncate">
              {author.displayName || author.handle}
            </span>
            <span className="text-xs text-gray-500 truncate">
              @{author.handle}
            </span>
            {timeAgo && (
              <>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {timeAgo}
                </span>
              </>
            )}
          </div>

          {/* Reply indicator */}
          {feedItem.reply?.parent && (
            <div className="text-xs text-gray-500 mt-0.5">
              <span>
                ↩ {(feedItem.reply.parent as { author?: { handle?: string } }).author?.handle ?? "..."} に返信
              </span>
            </div>
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
