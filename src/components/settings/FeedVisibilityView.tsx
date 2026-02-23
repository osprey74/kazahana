import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSavedFeeds, useMyLists } from "../../hooks/useMyFeeds";
import { useFeedStore } from "../../stores/feedStore";
import { Icon } from "../common/Icon";
import { LoadingSpinner } from "../common/LoadingSpinner";

export function FeedVisibilityView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hiddenFeeds, toggleFeedVisibility } = useFeedStore();
  const { data: savedFeeds, isLoading: feedsLoading } = useSavedFeeds();
  const { data: myLists, isLoading: listsLoading } = useMyLists();

  const isLoading = feedsLoading || listsLoading;

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
          <h2 className="text-sm font-bold text-text-light dark:text-text-dark">{t("settings.feedVisibility")}</h2>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="px-4 py-3">
          {/* Custom feeds */}
          {savedFeeds && savedFeeds.length > 0 && (
            <section className="mb-4">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t("feed.feeds")}</h3>
              <div className="space-y-1">
                {savedFeeds.map((feed) => (
                  <label key={feed.uri} className="flex items-center gap-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!hiddenFeeds.includes(feed.uri)}
                      onChange={() => toggleFeedVisibility(feed.uri)}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-sm text-text-light dark:text-text-dark">{feed.name}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Lists */}
          {myLists && myLists.length > 0 && (
            <section className="mb-4">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t("feed.lists")}</h3>
              <div className="space-y-1">
                {myLists.map((list) => (
                  <label key={list.uri} className="flex items-center gap-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!hiddenFeeds.includes(list.uri)}
                      onChange={() => toggleFeedVisibility(list.uri)}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-sm text-text-light dark:text-text-dark">{list.name}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {(!savedFeeds || savedFeeds.length === 0) && (!myLists || myLists.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p className="text-sm">{t("settings.noFeeds")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
