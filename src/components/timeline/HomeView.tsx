import { useFeedStore } from "../../stores/feedStore";
import { FeedSelector } from "./FeedSelector";
import { TimelineView } from "./TimelineView";
import { FeedView } from "./FeedView";

export function HomeView() {
  const currentFeed = useFeedStore((s) => s.currentFeed);

  return (
    <>
      <div className="sticky top-0 z-20 bg-white dark:bg-bg-dark">
        <FeedSelector />
      </div>
      {currentFeed.type === "home" ? (
        <TimelineView />
      ) : (
        <FeedView key={currentFeed.uri} feed={currentFeed} />
      )}
    </>
  );
}
