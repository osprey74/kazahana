import { create } from "zustand";

export type FeedSource =
  | { type: "home" }
  | { type: "custom"; uri: string; name: string }
  | { type: "list"; uri: string; name: string };

interface FeedState {
  currentFeed: FeedSource;
  setCurrentFeed: (feed: FeedSource) => void;
}

function loadFeed(): FeedSource {
  try {
    const raw = localStorage.getItem("kazahana-feed");
    if (raw) return JSON.parse(raw) as FeedSource;
  } catch {
    // ignore
  }
  return { type: "home" };
}

export const useFeedStore = create<FeedState>((set) => ({
  currentFeed: loadFeed(),

  setCurrentFeed: (feed) => {
    localStorage.setItem("kazahana-feed", JSON.stringify(feed));
    set({ currentFeed: feed });
  },
}));
