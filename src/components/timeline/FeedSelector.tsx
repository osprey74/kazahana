import { useRef, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useFeedStore, type FeedSource } from "../../stores/feedStore";
import { useSavedFeeds, useMyLists } from "../../hooks/useMyFeeds";
import { Icon } from "../common/Icon";

const SCROLL_AMOUNT = 120;

export function FeedSelector() {
  const { t } = useTranslation();
  const { currentFeed, setCurrentFeed } = useFeedStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const hiddenFeeds = useFeedStore((s) => s.hiddenFeeds);
  const feedOrder = useFeedStore((s) => s.feedOrder);
  const { data: savedFeeds } = useSavedFeeds();
  const { data: myLists } = useMyLists();

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  // Check overflow on mount, resize, and data changes
  useEffect(() => {
    // Defer to next frame so the browser has laid out new tabs
    const raf = requestAnimationFrame(updateScrollState);
    const el = scrollRef.current;
    if (!el) return () => cancelAnimationFrame(raf);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [updateScrollState, savedFeeds, myLists]);

  // Update on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [updateScrollState]);

  // Scroll active tab into view when feed changes
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [currentFeed]);

  const scroll = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
      behavior: "smooth",
    });
  };

  const isActive = (feed: FeedSource) => {
    if (feed.type === "home") return currentFeed.type === "home";
    if (feed.type === "custom" && currentFeed.type === "custom") return currentFeed.uri === feed.uri;
    if (feed.type === "list" && currentFeed.type === "list") return currentFeed.uri === feed.uri;
    return false;
  };

  const tabs: { feed: FeedSource; label: string }[] = [
    { feed: { type: "home" }, label: t("feed.home") },
  ];

  const nonHomeTabs: { feed: FeedSource; label: string; uri: string }[] = [];
  if (savedFeeds) {
    for (const f of savedFeeds) {
      if (!hiddenFeeds.includes(f.uri)) {
        nonHomeTabs.push({ feed: { type: "custom", uri: f.uri, name: f.name }, label: f.name, uri: f.uri });
      }
    }
  }
  if (myLists) {
    for (const l of myLists) {
      if (!hiddenFeeds.includes(l.uri)) {
        nonHomeTabs.push({ feed: { type: "list", uri: l.uri, name: l.name }, label: l.name, uri: l.uri });
      }
    }
  }

  // Sort by feedOrder if set
  if (feedOrder.length > 0) {
    nonHomeTabs.sort((a, b) => {
      const ai = feedOrder.indexOf(a.uri);
      const bi = feedOrder.indexOf(b.uri);
      // Items not in feedOrder go to the end, preserving original order
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }

  tabs.push(...nonHomeTabs);

  // Only show if there's more than just "Home"
  if (tabs.length <= 1) return null;

  const showArrows = canScrollLeft || canScrollRight;

  return (
    <div className="relative flex items-center border-b border-border-light dark:border-border-dark">
      {/* Left arrow */}
      {showArrows && (
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className={`flex-shrink-0 w-7 h-full flex items-center justify-center border-r transition-opacity ${
            canScrollLeft ? "text-gray-500 dark:text-gray-400 hover:text-text-light dark:hover:text-text-dark" : "opacity-0 pointer-events-none"
          }`}
          style={{ borderColor: "#eee" }}
        >
          <Icon name="chevron_left" size={18} />
        </button>
      )}

      {/* Tabs */}
      <div
        ref={scrollRef}
        className="flex-1 flex overflow-x-auto scrollbar-none"
      >
        {tabs.map((tab) => {
          const active = isActive(tab.feed);
          return (
            <button
              key={tab.feed.type === "home" ? "home" : tab.feed.uri}
              ref={active ? activeRef : undefined}
              onClick={() => setCurrentFeed(tab.feed)}
              className={`flex-shrink-0 px-4 py-2 text-xs font-medium transition-colors relative whitespace-nowrap ${
                active
                  ? "text-primary"
                  : "text-gray-500 dark:text-gray-400 hover:text-text-light dark:hover:text-text-dark"
              }`}
            >
              {tab.label}
              {active && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right arrow */}
      {showArrows && (
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={`flex-shrink-0 w-7 h-full flex items-center justify-center border-l transition-opacity ${
            canScrollRight ? "text-gray-500 dark:text-gray-400 hover:text-text-light dark:hover:text-text-dark" : "opacity-0 pointer-events-none"
          }`}
          style={{ borderColor: "#eee" }}
        >
          <Icon name="chevron_right" size={18} />
        </button>
      )}
    </div>
  );
}
