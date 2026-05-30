import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { ja } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import type { AppBskyFeedDefs } from "@atproto/api";
type PostView = AppBskyFeedDefs.PostView;
import { getAgent } from "../../lib/agent";
import { Icon } from "../common/Icon";
import { Avatar } from "../common/Avatar";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { PostContent } from "../timeline/PostContent";
import { useViewHistoryStore, type ViewHistoryEntry } from "../../stores/viewHistoryStore";
import i18n from "../../i18n";

export function ViewHistoryView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const history = useViewHistoryStore((s) => s.history);
  const removeEntry = useViewHistoryStore((s) => s.removeEntry);
  const clearAll = useViewHistoryStore((s) => s.clearAll);
  const [confirmClear, setConfirmClear] = useState(false);

  const uris = history.map((e) => e.uri);
  const { data: postsByUri, isLoading } = useQuery({
    queryKey: ["viewHistoryPosts", uris],
    queryFn: async () => {
      if (uris.length === 0) return new Map<string, PostView>();
      const agent = getAgent();
      const map = new Map<string, PostView>();
      for (let i = 0; i < uris.length; i += 25) {
        const batch = uris.slice(i, i + 25);
        try {
          const res = await agent.getPosts({ uris: batch });
          for (const post of res.data.posts) map.set(post.uri, post);
        } catch {
          // Skip failed batches; missing entries render as unavailable placeholders.
        }
      }
      return map;
    },
    staleTime: 60_000,
  });

  return (
    <div>
      <div className="px-4 py-2 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-sm text-primary hover:underline"
            >
              <Icon name="arrow_back" size={16} className="inline-block align-text-bottom" /> {t("thread.back")}
            </button>
            <h2 className="text-sm font-bold text-text-light dark:text-text-dark">{t("settings.viewHistory")}</h2>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="text-xs text-red-500 hover:underline"
            >
              {t("settings.clearViewHistory")}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Icon name="history" size={32} className="mb-2 text-gray-300 dark:text-gray-600" />
          <p className="text-sm">{t("settings.noViewHistory")}</p>
        </div>
      ) : (
        <div>
          {history.map((entry) => (
            <ViewHistoryItem
              key={entry.uri}
              entry={entry}
              post={postsByUri?.get(entry.uri) ?? null}
              onRemove={removeEntry}
            />
          ))}
        </div>
      )}

      {confirmClear && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setConfirmClear(false)}
        >
          <div
            className="bg-white dark:bg-bg-dark rounded p-4 max-w-sm mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-text-light dark:text-text-dark mb-4">
              {t("settings.confirmClearViewHistory")}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-3 py-1.5 text-sm rounded-btn bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAll();
                  setConfirmClear(false);
                }}
                className="px-3 py-1.5 text-sm rounded-btn bg-red-500 hover:bg-red-600 text-white"
              >
                {t("settings.clearViewHistory")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ViewHistoryItem({
  entry,
  post,
  onRemove,
}: {
  entry: ViewHistoryEntry;
  post: PostView | null;
  onRemove: (uri: string) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language.startsWith("ja") ? ja : enUS;
  const viewedAgo = formatDistanceToNowStrict(new Date(entry.viewedAt), { locale, addSuffix: false });

  if (!post) {
    return (
      <article className="px-4 py-3 border-b border-border-light dark:border-border-dark opacity-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm italic text-gray-500 dark:text-gray-400">
              {t("settings.viewHistoryUnavailable")}
            </p>
            <p className="text-[11px] text-gray-400 mt-1 truncate font-mono">{entry.uri}</p>
            <p className="text-[11px] text-gray-400 mt-1">{viewedAgo}</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(entry.uri)}
            title={t("settings.viewHistoryRemove")}
            aria-label={t("settings.viewHistoryRemove")}
            className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      </article>
    );
  }

  const record = post.record as { text?: string; facets?: unknown[]; createdAt?: string };
  const timeAgo = record.createdAt
    ? formatDistanceToNowStrict(new Date(record.createdAt), { locale, addSuffix: false })
    : "";

  return (
    <article
      className="px-4 py-3 border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button, a")) return;
        navigate(`/post/${encodeURIComponent(post.uri)}`);
      }}
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate(`/profile/${post.author.handle}`)}
          className="self-start hover:opacity-80"
        >
          <Avatar src={post.author.avatar} alt={post.author.displayName} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${post.author.handle}`);
              }}
              className="flex items-baseline gap-1 min-w-0 hover:underline"
            >
              <span className="font-bold text-sm text-text-light dark:text-text-dark truncate">
                {post.author.displayName || post.author.handle}
              </span>
              <span className="text-xs text-gray-500 truncate">@{post.author.handle}</span>
            </button>
            {timeAgo && (
              <>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500 flex-shrink-0">{timeAgo}</span>
              </>
            )}
          </div>

          {record.text && (
            <div className="mt-1">
              <PostContent
                text={record.text}
                facets={record.facets as Parameters<typeof PostContent>[0]["facets"]}
              />
            </div>
          )}

          <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
            <span>{viewedAgo}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(entry.uri);
              }}
              title={t("settings.viewHistoryRemove")}
              aria-label={t("settings.viewHistoryRemove")}
              className="hover:text-red-500 transition-colors"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
