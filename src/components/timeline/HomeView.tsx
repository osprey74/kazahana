import { useFeedStore } from "../../stores/feedStore";
import { FeedSelector } from "./FeedSelector";
import { TimelineView } from "./TimelineView";
import { FeedView } from "./FeedView";

export function HomeView() {
  const currentFeed = useFeedStore((s) => s.currentFeed);

  return (
    <>
      <FeedSelector />
      {currentFeed.type === "home" ? (
        <TimelineView />
      ) : (
        <FeedView key={currentFeed.uri} feed={currentFeed} />
      )}
    </>
  );
}
