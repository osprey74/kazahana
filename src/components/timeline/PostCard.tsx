import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { moderatePost } from "@atproto/api";
import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import type { ViewImage } from "@atproto/api/dist/client/types/app/bsky/embed/images";
import { formatDistanceToNowStrict } from "date-fns";
import { ja } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";
import { ImageGrid } from "../common/ImageGrid";
import { LinkCard } from "../common/LinkCard";
import { QuoteEmbed } from "../common/QuoteEmbed";
import { VideoPlayer } from "../common/VideoPlayer";
import { ContentWarning } from "../common/ContentWarning";
import { PostContent } from "./PostContent";
import { PostActions } from "./PostActions";
import { useModerationOpts } from "../../contexts/ModerationContext";
import { useSettingsStore } from "../../stores/settingsStore";
import { useBsafStore } from "../../stores/bsafStore";
import { parseBsafTags, getSeverityBorderColor } from "../../lib/bsaf";
import type { BsafDuplicateInfo } from "../../hooks/useBsafDuplicates";

interface PostCardProps {
  feedItem: FeedViewPost;
  showParentContext?: boolean;
  bsafDuplicateInfo?: BsafDuplicateInfo;
}

export function PostCard({ feedItem, showParentContext, bsafDuplicateInfo }: PostCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const moderationOpts = useModerationOpts();
  const showVia = useSettingsStore((s) => s.showVia);
  const bsafEnabled = useBsafStore((s) => s.bsafEnabled);
  const { post, reason } = feedItem;
  const author = post.author;
  const record = post.record as { text?: string; facets?: unknown[]; createdAt?: string; reply?: { parent?: { uri: string }; root?: { uri: string } }; $via?: string; langs?: string[]; tags?: string[] };

  // BSAF visual styling
  const bsafParsed = bsafEnabled && record.tags ? parseBsafTags(record.tags) : null;
  const bsafBorderColor = bsafParsed ? getSeverityBorderColor(bsafParsed.value) : undefined;

  // Moderation
  const modDecision = moderationOpts ? moderatePost(post, moderationOpts) : null;
  const contentUI = modDecision?.ui("contentList");
  const mediaUI = modDecision?.ui("contentMedia");

  // Filter: completely hide from list
  if (contentUI?.filter) return null;

  const isRepost =
    reason?.$type === "app.bsky.feed.defs#reasonRepost";
  const repostBy = isRepost
    ? (reason as { by?: { displayName?: string; handle?: string } }).by
    : null;
  const isPinned = reason?.$type === "app.bsky.feed.defs#reasonPin";

  const images = getImages(post);
  const videoEmbed = getVideoEmbed(post);
  const externalEmbed = getExternalEmbed(post);
  const quoteEmbed = getQuoteEmbed(post);
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
      style={bsafBorderColor ? { borderLeft: `5px solid ${bsafBorderColor}`, marginTop: 10, marginBottom: 10 } : undefined}
      onClick={(e) => {
        // Don't navigate if clicking on interactive elements
        if ((e.target as HTMLElement).closest("button, a, video")) return;
        navigate(`/post/${encodeURIComponent(post.uri)}`);
      }}
    >
      {isPinned && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1 ml-12">
          <Icon name="push_pin" size={14} />
          <span>{t("post.pinned")}</span>
        </div>
      )}
      {isRepost && repostBy && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1 ml-12">
          <Icon name="repeat" size={14} />
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
              <div className="flex items-center gap-0.5 text-xs text-gray-500 mt-0.5">
                <Icon name="reply" size={14} />
                <span>
                  {(feedItem.reply.parent as { author?: { handle?: string } }).author?.handle ?? "..."} {t("post.replyTo")}
                </span>
              </div>
            ) : record.reply?.parent ? (
              <div className="flex items-center gap-0.5 text-xs text-gray-500 mt-0.5">
                <Icon name="reply" size={14} />
                <span>{t("post.replyTo")}</span>
              </div>
            ) : null
          )}

          {/* Post content (may be blurred by moderation) */}
          {contentUI?.blur ? (
            <ContentWarning ui={contentUI}>
              {record.text && (
                <div className="mt-1">
                  <PostContent
                    text={record.text}
                    facets={record.facets as Parameters<typeof PostContent>[0]["facets"]}
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
            </ContentWarning>
          ) : (
            <>
              {record.text && (
                <div className="mt-1">
                  <PostContent
                    text={record.text}
                    facets={record.facets as Parameters<typeof PostContent>[0]["facets"]}
                  />
                </div>
              )}
              {/* Images (may be blurred by media moderation) */}
              {images.length > 0 && (
                mediaUI?.blur ? (
                  <ContentWarning ui={mediaUI} isMedia>
                    <ImageGrid images={images} />
                  </ContentWarning>
                ) : (
                  <ImageGrid images={images} />
                )
              )}
              {/* Video */}
              {videoEmbed && (
                mediaUI?.blur ? (
                  <ContentWarning ui={mediaUI} isMedia>
                    <VideoPlayer {...videoEmbed} />
                    {videoEmbed.alt && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-1">{videoEmbed.alt}</p>
                    )}
                  </ContentWarning>
                ) : (
                  <>
                    <VideoPlayer {...videoEmbed} />
                    {videoEmbed.alt && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-1">{videoEmbed.alt}</p>
                    )}
                  </>
                )
              )}
              {externalEmbed && <LinkCard external={externalEmbed} />}
              {quoteEmbed && <QuoteEmbed record={quoteEmbed} />}
            </>
          )}

          {/* Threadgate indicator */}
          {post.threadgate && (
            <div className="flex items-center gap-1 mt-1.5 text-gray-400">
              <Icon name="lock" size={12} />
              <span className="text-[11px]">{t("gate.replyRestricted")}</span>
            </div>
          )}

          {/* BSAF duplicate indicator */}
          {bsafDuplicateInfo && bsafDuplicateInfo.duplicateHandles.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-gray-400">
              <Icon name="content_copy" size={12} />
              <span className="text-[11px]">
                {t("bsaf.duplicateReport", { count: bsafDuplicateInfo.duplicateHandles.length })}
              </span>
            </div>
          )}

          {/* BSAF tags */}
          {bsafParsed && record.tags && record.tags.length > 0 && (
            <>
              <div className="border-t border-[#666] mt-2" />
              <div className="flex flex-wrap gap-1 mt-2">
                {record.tags.map((tag, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Actions + Moderation label */}
          <div className="flex items-center justify-between mt-2">
            <PostActions post={post} />
            <div className="flex items-center gap-2">
              {record.langs && record.langs.length > 0 && (
                <span className="text-[10px] text-gray-400">langs: {record.langs.join(", ")}</span>
              )}
              {showVia && record.$via && (
                <span className="text-[10px] text-gray-400">via {record.$via}</span>
              )}
              {post.labels && post.labels.length > 0 && (
                <div className="flex items-center gap-1">
                  <Icon name="shield" size={12} className="text-gray-400" />
                  <span className="text-[11px] text-gray-400">
                    {(post.labels as { val: string }[]).map((l) => l.val).join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

interface ExternalEmbed {
  uri: string;
  title: string;
  description: string;
  thumb?: string;
}

function getExternalEmbed(post: FeedViewPost["post"]): ExternalEmbed | null {
  const embed = post.embed;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getQuoteEmbed(post: FeedViewPost["post"]): Record<string, any> | null {
  const embed = post.embed;
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

interface VideoEmbed {
  playlist: string;
  thumbnail?: string;
  alt?: string;
  aspectRatio?: { width: number; height: number };
  presentation?: string;
}

function getVideoEmbed(post: FeedViewPost["post"]): VideoEmbed | null {
  const embed = post.embed;
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
