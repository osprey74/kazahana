import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { AppBskyEmbedExternal } from "@atproto/api";
import { Icon } from "./Icon";
import i18n from "../../i18n";

type ViewExternal = AppBskyEmbedExternal.ViewExternal;

interface LinkCardProps {
  external: ViewExternal;
  hideSubscribe?: boolean;
}

export function LinkCard({ external }: LinkCardProps) {
  const { t } = useTranslation();
  const { source, createdAt, readingTime, thumb, title, description } = external;
  const domain = getDomain(external.uri);
  const isPublicationOnly = !!source && external.uri === source.uri;
  const hasMeta = (readingTime != null && readingTime > 0) || !!createdAt;

  const accent = source?.theme?.accentRGB;
  const accentFg = source?.theme?.accentForegroundRGB;
  const accentBg = accent ? `rgb(${accent.r}, ${accent.g}, ${accent.b})` : undefined;
  const accentFgColor = accentFg ? `rgb(${accentFg.r}, ${accentFg.g}, ${accentFg.b})` : undefined;

  const openExternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    openUrl(external.uri);
  };

  const openSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (source) openUrl(source.uri);
  };

  if (isPublicationOnly && source) {
    return (
      <button
        type="button"
        onClick={openSource}
        className="mt-2 w-full border border-border-light dark:border-border-dark rounded-card overflow-hidden text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="px-3 py-3 flex items-start gap-3">
          {source.icon && (
            <img
              src={source.icon}
              alt=""
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-light dark:text-text-dark truncate">
              {source.title}
            </p>
            {source.description && (
              <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-snug">
                {source.description}
              </p>
            )}
            <p className="text-xs text-gray-500 truncate mt-1">{domain}</p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="mt-2 w-full border border-border-light dark:border-border-dark rounded-card overflow-hidden">
      <button
        type="button"
        onClick={openExternal}
        className="block w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        {thumb && (
          <img
            src={thumb}
            alt=""
            className="w-full h-32 object-cover"
            loading="lazy"
          />
        )}
        <div className="px-3 py-2">
          <p className="text-xs text-gray-500 truncate">{domain}</p>
          {title && (
            <p className="text-sm font-medium text-text-light dark:text-text-dark line-clamp-2 leading-snug">
              {title}
            </p>
          )}
          {description && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-snug">
              {description}
            </p>
          )}
          {hasMeta && (
            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
              {readingTime != null && readingTime > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <Icon name="schedule" size={12} />
                  {t("linkCard.readingTime", { minutes: readingTime })}
                </span>
              )}
              {createdAt && (
                <span className="ml-auto">{formatDate(createdAt, i18n.language)}</span>
              )}
            </div>
          )}
        </div>
      </button>

      {source && (
        <div className="border-t border-border-light dark:border-border-dark px-3 py-2 flex items-center gap-2">
          {source.icon && (
            <img
              src={source.icon}
              alt=""
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-light dark:text-text-dark truncate">
              {source.title}
            </p>
          </div>
          <button
            type="button"
            onClick={openSource}
            className="text-xs font-medium px-2 py-1 rounded-md flex-shrink-0 transition-opacity hover:opacity-90 border border-border-light dark:border-border-dark"
            style={{
              background: accentBg,
              color: accentFgColor,
            }}
          >
            {t("linkCard.viewPublication")}
          </button>
        </div>
      )}
    </div>
  );
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function formatDate(iso: string, lang: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(lang.startsWith("ja") ? "ja-JP" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}
