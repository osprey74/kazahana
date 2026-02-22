import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { moderatePost } from "@atproto/api";
import type { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { useThread } from "../../hooks/useThread";
import { useModerationOpts } from "../../contexts/ModerationContext";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";
import { ContentWarning } from "../common/ContentWarning";
import { PostContent } from "../timeline/PostContent";
import { PostActions } from "../timeline/PostActions";
import { ImageGrid } from "../common/ImageGrid";
import { LinkCard } from "../common/LinkCard";
import type { ViewImage } from "@atproto/api/dist/client/types/app/bsky/embed/images";
import { formatDistanceToNowStrict } from "date-fns";
import { ja } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import i18n from "../../i18n";

interface ThreadViewPost {
  $type: string;
  post: PostView;
  parent?: ThreadViewPost;
  replies?: ThreadViewPost[];
}

export function ThreadView() {
  const { t } = useTranslation();
  const { uri } = useParams<{ uri: string }>();
  const navigate = useNavigate();
  const decodedUri = uri ? decodeURIComponent(uri) : "";
  const { data: thread, isLoading, isError } = useThread(decodedUri);

  if (isLoading) return <LoadingSpinner />;

  if (isError || !thread || thread.$type === "app.bsky.feed.defs#blockedPost" || thread.$type === "app.bsky.feed.defs#notFoundPost") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <p>{t("thread.notFound")}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 text-primary text-sm hover:underline"
        >
          {t("thread.back")}
        </button>
      </div>
    );
  }

  const threadPost = thread as ThreadViewPost;

  // Collect parent chain
  const parents: ThreadViewPost[] = [];
  let current = threadPost.parent;
  while (current && current.$type === "app.bsky.feed.defs#threadViewPost") {
    parents.unshift(current);
    current = current.parent;
  }

  return (
    <div>
      {/* Back button */}
      <div className="px-4 py-2 border-b border-border-light dark:border-border-dark">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-primary hover:underline"
        >
          <Icon name="arrow_back" size={16} className="inline-block align-text-bottom" /> {t("thread.back")}
        </button>
      </div>

      {/* Parent posts */}
      {parents.map((p) => (
        <ThreadPostItem key={p.post.uri} post={p.post} isHighlighted={false} />
      ))}

      {/* Main post */}
      <ThreadPostItem post={threadPost.post} isHighlighted={true} />

      {/* Replies */}
      {threadPost.replies?.map((reply) => {
        if (reply.$type !== "app.bsky.feed.defs#threadViewPost") return null;
        return (
          <ThreadPostItem
            key={reply.post.uri}
            post={reply.post}
            isHighlighted={false}
          />
        );
      })}
    </div>
  );
}

function ThreadPostItem({
  post,
  isHighlighted,
}: {
  post: PostView;
  isHighlighted: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const moderationOpts = useModerationOpts();
  const record = post.record as { text?: string; facets?: unknown[]; createdAt?: string };
  const images = getImages(post);
  const externalEmbed = getExternalEmbed(post);
  const locale = i18n.language.startsWith("ja") ? ja : enUS;
  const timeAgo = record.createdAt
    ? formatDistanceToNowStrict(new Date(record.createdAt), { locale, addSuffix: false })
    : "";

  // Moderation
  const modDecision = moderationOpts ? moderatePost(post, moderationOpts) : null;
  const contentUI = modDecision?.ui("contentView");
  const mediaUI = modDecision?.ui("contentMedia");

  // In thread, show a collapsed placeholder instead of hiding entirely
  if (contentUI?.filter) {
    return (
      <article className="px-4 py-3 border-b border-border-light dark:border-border-dark">
        <p className="text-xs text-gray-400 text-center">{t("moderation.postHidden")}</p>
      </article>
    );
  }

  return (
    <article
      className={`px-4 py-3 border-b border-border-light dark:border-border-dark ${
        isHighlighted ? "bg-blue-50 dark:bg-blue-900/20" : ""
      }`}
    >
      <div className="flex gap-3">
        <button onClick={() => navigate(`/profile/${post.author.handle}`)} className="self-start hover:opacity-80">
          <Avatar src={post.author.avatar} alt={post.author.displayName} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <button onClick={() => navigate(`/profile/${post.author.handle}`)} className="flex items-baseline gap-1 min-w-0 hover:underline">
              <span className="font-bold text-sm text-text-light dark:text-text-dark truncate">
                {post.author.displayName || post.author.handle}
              </span>
              <span className="text-xs text-gray-500 truncate">
                @{post.author.handle}
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
              {externalEmbed && <LinkCard external={externalEmbed} />}
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
              {images.length > 0 && (
                mediaUI?.blur ? (
                  <ContentWarning ui={mediaUI} isMedia>
                    <ImageGrid images={images} />
                  </ContentWarning>
                ) : (
                  <ImageGrid images={images} />
                )
              )}
              {externalEmbed && <LinkCard external={externalEmbed} />}
            </>
          )}

          {/* Actions + Moderation label */}
          <div className="flex items-center justify-between mt-2">
            <PostActions post={post} />
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
    </article>
  );
}

interface ExternalEmbed {
  uri: string;
  title: string;
  description: string;
  thumb?: string;
}

function getExternalEmbed(post: PostView): ExternalEmbed | null {
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

function getImages(post: PostView): ViewImage[] {
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
