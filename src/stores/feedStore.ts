import { create } from "zustand";

export type FeedSource =
  | { type: "home" }
  | { type: "custom"; uri: string; name: string }
  | { type: "list"; uri: string; name: string };

interface FeedState {
  currentFeed: FeedSource;
  setCurrentFeed: (feed: FeedSource) => void;
  hiddenFeeds: string[];
  toggleFeedVisibility: (uri: string) => void;
  feedOrder: string[];
  setFeedOrder: (order: string[]) => void;
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

function loadHiddenFeeds(): string[] {
  try {
    const raw = localStorage.getItem("kazahana-hidden-feeds");
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    // ignore
  }
  return [];
}

function loadFeedOrder(): string[] {
  try {
    const raw = localStorage.getItem("kazahana-feed-order");
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    // ignore
  }
  return [];
}

export const useFeedStore = create<FeedState>((set, get) => ({
  currentFeed: loadFeed(),

  setCurrentFeed: (feed) => {
    localStorage.setItem("kazahana-feed", JSON.stringify(feed));
    set({ currentFeed: feed });
  },

  hiddenFeeds: loadHiddenFeeds(),

  toggleFeedVisibility: (uri) => {
    const current = get().hiddenFeeds;
    const next = current.includes(uri)
      ? current.filter((u) => u !== uri)
      : [...current, uri];
    localStorage.setItem("kazahana-hidden-feeds", JSON.stringify(next));
    set({ hiddenFeeds: next });
  },

  feedOrder: loadFeedOrder(),

  setFeedOrder: (order) => {
    localStorage.setItem("kazahana-feed-order", JSON.stringify(order));
    set({ feedOrder: order });
  },
}));
