import { useState, useEffect, useMemo, useCallback, useLayoutEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import { moderatePost, moderateProfile } from "@atproto/api";
import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import type { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { useSearchActors, useSearchPosts } from "../../hooks/useSearch";
import { useSearchHistoryStore } from "../../stores/searchHistoryStore";
import { useModerationOpts } from "../../contexts/ModerationContext";
import { PostCard } from "../timeline/PostCard";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";
import { LoadingSpinner } from "../common/LoadingSpinner";

type SearchTab = "posts" | "users";

export function SearchView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [activeQuery, setActiveQuery] = useState(() => searchParams.get("q") ?? "");
  const [tab, setTab] = useState<SearchTab>("posts");
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setScrollParent(document.querySelector("main"));
  }, []);

  // Sync from URL search params (e.g. hashtag click from PostContent)
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    if (q && q !== activeQuery) {
      setQuery(q);
      setActiveQuery(q);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const addHistory = useSearchHistoryStore((s) => s.addQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setActiveQuery(q);
    if (q) {
      addHistory(q);
      setSearchParams({ q }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handleHistoryClick = (q: string) => {
    setQuery(q);
    setActiveQuery(q);
    setSearchParams({ q }, { replace: true });
  };

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="px-4 py-3 border-b border-border-light dark:border-border-dark">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-btn text-sm bg-transparent text-text-light dark:text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </form>

      {/* Tabs */}
      {activeQuery && (
        <div className="flex border-b border-border-light dark:border-border-dark">
          <button
            onClick={() => setTab("posts")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "posts"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {t("search.posts")}
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "users"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {t("search.users")}
          </button>
        </div>
      )}

      {/* Results */}
      {activeQuery && tab === "posts" && (
        <PostResults query={activeQuery} scrollParent={scrollParent} />
      )}
      {activeQuery && tab === "users" && (
        <UserResults query={activeQuery} scrollParent={scrollParent} onUserClick={(handle) => navigate(`/profile/${handle}`)} />
      )}

      {!activeQuery && (
        <SearchHistory onSelect={handleHistoryClick} />
      )}
    </div>
  );
}

function PostResults({ query, scrollParent }: { query: string; scrollParent: HTMLElement | null }) {
  const { t } = useTranslation();
  const moderationOpts = useModerationOpts();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useSearchPosts(query);

  const items = useMemo(() => {
    if (!data?.pages) return [];
    const all = data.pages.flatMap((page) =>
      page.posts.map((post) => ({ post } as FeedViewPost))
    );
    if (!moderationOpts) return all;
    return all.filter((item) => !moderatePost(item.post, moderationOpts).ui("contentList").filter);
  }, [data, moderationOpts]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <p className="text-center py-8 text-gray-500">{t("search.loadFailed")}</p>;
  if (items.length === 0) return <p className="text-center py-8 text-gray-400">{t("search.noResults")}</p>;
  if (!scrollParent) return null;

  return (
    <Virtuoso
      customScrollParent={scrollParent}
      data={items}
      endReached={loadMore}
      overscan={200}
      itemContent={(_index, item: FeedViewPost) => (
        <PostCard feedItem={item} />
      )}
      components={{
        Footer: () => (isFetchingNextPage ? <LoadingSpinner /> : null),
      }}
    />
  );
}

function UserResults({ query, scrollParent, onUserClick }: { query: string; scrollParent: HTMLElement | null; onUserClick: (handle: string) => void }) {
  const { t } = useTranslation();
  const moderationOpts = useModerationOpts();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useSearchActors(query);

  const items = useMemo(() => {
    if (!data?.pages) return [];
    const all = data.pages.flatMap((page) => page.actors);
    if (!moderationOpts) return all;
    return all.filter((actor) => !moderateProfile(actor, moderationOpts).ui("profileList").filter);
  }, [data, moderationOpts]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <p className="text-center py-8 text-gray-500">{t("search.loadFailed")}</p>;
  if (items.length === 0) return <p className="text-center py-8 text-gray-400">{t("search.noResults")}</p>;
  if (!scrollParent) return null;

  return (
    <Virtuoso
      customScrollParent={scrollParent}
      data={items}
      endReached={loadMore}
      overscan={200}
      itemContent={(_index, actor: ProfileView) => (
        <div
          onClick={() => onUserClick(actor.handle)}
          className="flex gap-3 px-4 py-3 border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
        >
          <Avatar src={actor.avatar} alt={actor.displayName} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-text-light dark:text-text-dark truncate">
              {actor.displayName || actor.handle}
            </p>
            <p className="text-xs text-gray-500 truncate">@{actor.handle}</p>
            {actor.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{actor.description}</p>
            )}
          </div>
        </div>
      )}
      components={{
        Footer: () => (isFetchingNextPage ? <LoadingSpinner /> : null),
      }}
    />
  );
}

function SearchHistory({ onSelect }: { onSelect: (query: string) => void }) {
  const { t } = useTranslation();
  const history = useSearchHistoryStore((s) => s.history);
  const removeQuery = useSearchHistoryStore((s) => s.removeQuery);
  const clearAll = useSearchHistoryStore((s) => s.clearAll);

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <p>{t("search.hint")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-light dark:border-border-dark">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("search.history")}</span>
        <button
          onClick={clearAll}
          className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
        >
          {t("search.clearHistory")}
        </button>
      </div>
      {history.map((q) => (
        <div
          key={q}
          className="flex items-center gap-2 px-4 py-2.5 border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Icon name="history" size={16} className="text-gray-400 flex-shrink-0" />
          <button
            onClick={() => onSelect(q)}
            className="flex-1 text-left text-sm text-text-light dark:text-text-dark truncate"
          >
            {q}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); removeQuery(q); }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
