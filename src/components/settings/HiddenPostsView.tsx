import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { ja } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import type { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { getAgent } from "../../lib/agent";
import { Icon } from "../common/Icon";
import { Avatar } from "../common/Avatar";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { PostContent } from "../timeline/PostContent";
import i18n from "../../i18n";

export function HiddenPostsView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: hiddenPosts, isLoading } = useQuery({
    queryKey: ["hiddenPosts"],
    queryFn: async () => {
      const agent = getAgent();
      const prefs = await agent.getPreferences();
      const uris = prefs.moderationPrefs.hiddenPosts;
      if (uris.length === 0) return [];

      // Fetch posts in batches of 25
      const posts: PostView[] = [];
      for (let i = 0; i < uris.length; i += 25) {
        const batch = uris.slice(i, i + 25);
        const res = await agent.getPosts({ uris: batch });
        posts.push(...res.data.posts);
      }
      return posts;
    },
  });

  const handleUnhide = async (uri: string) => {
    try {
      await getAgent().unhidePost(uri);
      queryClient.invalidateQueries({ queryKey: ["hiddenPosts"] });
      queryClient.invalidateQueries({ queryKey: ["moderationOpts"] });
    } catch {
      // silently fail
    }
  };

  return (
    <div>
      <div className="px-4 py-2 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-primary hover:underline"
          >
            <Icon name="arrow_back" size={16} className="inline-block align-text-bottom" /> {t("thread.back")}
          </button>
          <h2 className="text-sm font-bold text-text-light dark:text-text-dark">{t("settings.hiddenPosts")}</h2>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !hiddenPosts || hiddenPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Icon name="visibility_off" size={32} className="mb-2 text-gray-300 dark:text-gray-600" />
          <p className="text-sm">{t("settings.noHiddenPosts")}</p>
        </div>
      ) : (
        <div>
          {hiddenPosts.map((post) => (
            <HiddenPostItem key={post.uri} post={post} onUnhide={handleUnhide} />
          ))}
        </div>
      )}
    </div>
  );
}

function HiddenPostItem({ post, onUnhide }: { post: PostView; onUnhide: (uri: string) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const record = post.record as { text?: string; facets?: unknown[]; createdAt?: string };
  const locale = i18n.language.startsWith("ja") ? ja : enUS;
  const timeAgo = record.createdAt
    ? formatDistanceToNowStrict(new Date(record.createdAt), { locale, addSuffix: false })
    : "";

  return (
    <article className="px-4 py-3 border-b border-border-light dark:border-border-dark">
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

          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => navigate(`/post/${encodeURIComponent(post.uri)}`)}
              className="text-xs text-primary hover:underline"
            >
              {t("settings.viewPost")}
            </button>
            <button
              onClick={() => onUnhide(post.uri)}
              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-text-light dark:text-text-dark bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-btn transition-colors"
            >
              <Icon name="visibility" size={14} />
              {t("post.unhidePost")}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
