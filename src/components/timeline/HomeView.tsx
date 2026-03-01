import { useFeedStore } from "../../stores/feedStore";
import { FeedSelector } from "./FeedSelector";
import { TimelineView } from "./TimelineView";
import { FeedView } from "./FeedView";
import { Icon } from "../common/Icon";

export function HomeView() {
  const currentFeed = useFeedStore((s) => s.currentFeed);

  return (
    <>
      <div className="sticky top-0 z-20 bg-white dark:bg-bg-dark">
        <FeedSelector />
        {currentFeed.type !== "home" && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50">
            <Icon name={currentFeed.type === "list" ? "lists" : "dynamic_feed"} size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-text-light dark:text-text-dark truncate">{currentFeed.name}</span>
          </div>
        )}
      </div>
      {currentFeed.type === "home" ? (
        <TimelineView />
      ) : (
        <FeedView key={currentFeed.uri} feed={currentFeed} />
      )}
    </>
  );
}
