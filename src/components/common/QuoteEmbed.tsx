import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RichText } from "@atproto/api";
import type { ViewImage } from "@atproto/api/dist/client/types/app/bsky/embed/images";
import { Avatar } from "./Avatar";
import { ImageGrid } from "./ImageGrid";
import { PostContent } from "../timeline/PostContent";
import { Icon } from "./Icon";

interface QuoteRecord {
  $type?: string;
  uri?: string;
  author?: { handle?: string; displayName?: string; avatar?: string };
  value?: { text?: string; facets?: RichText["facets"]; createdAt?: string };
  embeds?: unknown[];
  notFound?: boolean;
  blocked?: boolean;
  detached?: boolean;
}

interface QuoteEmbedProps {
  record: QuoteRecord;
}

export function QuoteEmbed({ record }: QuoteEmbedProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Not found
  if (record.notFound || record.$type === "app.bsky.embed.record#viewNotFound") {
    return (
      <div className="mt-2 border border-border-light dark:border-border-dark rounded-lg p-3 text-sm text-gray-400 flex items-center gap-1.5">
        <Icon name="delete" size={16} />
        {t("quote.deleted")}
      </div>
    );
  }

  // Blocked
  if (record.blocked || record.$type === "app.bsky.embed.record#viewBlocked") {
    return (
      <div className="mt-2 border border-border-light dark:border-border-dark rounded-lg p-3 text-sm text-gray-400 flex items-center gap-1.5">
        <Icon name="block" size={16} />
        {t("quote.blocked")}
      </div>
    );
  }

  // Detached
  if (record.detached || record.$type === "app.bsky.embed.record#viewDetached") {
    return (
      <div className="mt-2 border border-border-light dark:border-border-dark rounded-lg p-3 text-sm text-gray-400 flex items-center gap-1.5">
        <Icon name="link_off" size={16} />
        {t("quote.unavailable")}
      </div>
    );
  }

  // Normal ViewRecord
  const author = record.author;
  const value = record.value;
  if (!author) return null;

  const images = getQuoteImages(record.embeds);

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    if (record.uri) {
      e.stopPropagation();
      navigate(`/post/${encodeURIComponent(record.uri)}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="mt-2 border border-border-light dark:border-border-dark rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
    >
      {/* Author */}
      <div className="flex items-center gap-1.5">
        <Avatar src={author.avatar} alt={author.displayName} size="sm" />
        <span className="font-bold text-xs text-text-light dark:text-text-dark truncate">
          {author.displayName || author.handle}
        </span>
        <span className="text-xs text-gray-500 truncate">
          @{author.handle}
        </span>
      </div>

      {/* Text */}
      {value?.text && (
        <div className="mt-1">
          <PostContent text={value.text} facets={value.facets} />
        </div>
      )}

      {/* Images from quote */}
      {images.length > 0 && <ImageGrid images={images} />}
    </div>
  );
}

function getQuoteImages(embeds?: unknown[]): ViewImage[] {
  if (!embeds || embeds.length === 0) return [];
  for (const embed of embeds) {
    const e = embed as { $type?: string; images?: ViewImage[] };
    if (e.$type === "app.bsky.embed.images#view" && e.images) {
      return e.images;
    }
  }
  return [];
}
