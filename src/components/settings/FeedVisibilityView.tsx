import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSavedFeeds, useMyLists } from "../../hooks/useMyFeeds";
import { useFeedStore } from "../../stores/feedStore";
import { Icon } from "../common/Icon";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface FeedItem {
  uri: string;
  name: string;
  type: "custom" | "list";
}

export function FeedVisibilityView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hiddenFeeds, toggleFeedVisibility, feedOrder, setFeedOrder } = useFeedStore();
  const { data: savedFeeds, isLoading: feedsLoading } = useSavedFeeds();
  const { data: myLists, isLoading: listsLoading } = useMyLists();

  const isLoading = feedsLoading || listsLoading;

  // Build a single ordered list: visible feeds (ordered) first, then hidden feeds
  const allFeeds = useMemo(() => {
    const items: FeedItem[] = [];
    if (savedFeeds) {
      for (const f of savedFeeds) {
        items.push({ uri: f.uri, name: f.name, type: "custom" });
      }
    }
    if (myLists) {
      for (const l of myLists) {
        items.push({ uri: l.uri, name: l.name, type: "list" });
      }
    }
    // Sort by feedOrder within each group
    if (feedOrder.length > 0) {
      items.sort((a, b) => {
        const ai = feedOrder.indexOf(a.uri);
        const bi = feedOrder.indexOf(b.uri);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    }
    // Partition: visible first, hidden last
    const visible = items.filter((f) => !hiddenFeeds.includes(f.uri));
    const hidden = items.filter((f) => hiddenFeeds.includes(f.uri));
    return [...visible, ...hidden];
  }, [savedFeeds, myLists, feedOrder, hiddenFeeds]);

  const visibleCount = allFeeds.filter((f) => !hiddenFeeds.includes(f.uri)).length;

  const moveFeed = (index: number, direction: -1 | 1) => {
    const isHidden = hiddenFeeds.includes(allFeeds[index].uri);
    const groupStart = isHidden ? visibleCount : 0;
    const groupEnd = isHidden ? allFeeds.length : visibleCount;
    const target = index + direction;
    if (target < groupStart || target >= groupEnd) return;
    const newList = allFeeds.map((f) => f.uri);
    [newList[index], newList[target]] = [newList[target], newList[index]];
    setFeedOrder(newList);
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
          <h2 className="text-sm font-bold text-text-light dark:text-text-dark">{t("settings.feedVisibility")}</h2>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="px-4 py-3">
          {allFeeds.length > 0 ? (
            <>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">{t("settings.feedOrderHint")}</p>
              <div className="space-y-1">
                {allFeeds.map((feed, index) => {
                  const isHidden = hiddenFeeds.includes(feed.uri);
                  const groupStart = isHidden ? visibleCount : 0;
                  const groupEnd = isHidden ? allFeeds.length : visibleCount;
                  const isFirst = index === groupStart;
                  const isLast = index === groupEnd - 1;
                  return (
                    <div key={feed.uri}>
                      {index === visibleCount && visibleCount > 0 && (
                        <div className="border-t border-border-light dark:border-border-dark my-2 pt-1">
                          <span className="text-[11px] text-gray-400">{t("settings.hiddenFeedsLabel")}</span>
                        </div>
                      )}
                      <div className={`flex items-center gap-2 py-1.5 ${isHidden ? "opacity-60" : ""}`}>
                        <div className="flex flex-col">
                          <button
                            onClick={() => moveFeed(index, -1)}
                            disabled={isFirst}
                            className={`p-0.5 rounded transition-colors ${
                              isFirst
                                ? "text-gray-300 dark:text-gray-600 cursor-default"
                                : "text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            <Icon name="keyboard_arrow_up" size={16} />
                          </button>
                          <button
                            onClick={() => moveFeed(index, 1)}
                            disabled={isLast}
                            className={`p-0.5 rounded transition-colors ${
                              isLast
                                ? "text-gray-300 dark:text-gray-600 cursor-default"
                                : "text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            <Icon name="keyboard_arrow_down" size={16} />
                          </button>
                        </div>
                        <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!isHidden}
                            onChange={() => toggleFeedVisibility(feed.uri)}
                            className="w-4 h-4 rounded accent-primary flex-shrink-0"
                          />
                          <span className="text-sm text-text-light dark:text-text-dark truncate">{feed.name}</span>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            {feed.type === "custom" ? t("feed.feeds") : t("feed.lists")}
                          </span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p className="text-sm">{t("settings.noFeeds")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
