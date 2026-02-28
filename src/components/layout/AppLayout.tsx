import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TabBar } from "./TabBar";
import { ComposeModal } from "../post/ComposeModal";
import { PostListModal } from "../post/PostListModal";
import { ImageLightbox } from "../common/ImageLightbox";
import { ContextMenu } from "../common/ContextMenu";
import { ReportModal } from "../moderation/ReportModal";
import { ListMembershipModal } from "../profile/ListMembershipModal";
import { DMComposeModal } from "../messages/DMComposeModal";
import { useComposeStore } from "../../stores/composeStore";
import { useDMComposeStore } from "../../stores/dmComposeStore";
import { useAuthStore } from "../../stores/authStore";
import { useFeedStore, type FeedSource } from "../../stores/feedStore";
import { useSavedFeeds, useMyLists } from "../../hooks/useMyFeeds";
import { Icon } from "../common/Icon";

const REFRESHABLE_PATHS = ["/", "/notifications", "/messages", "/profile"];

export function AppLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const openCompose = useComposeStore((s) => s.open);
  const openDMCompose = useDMComposeStore((s) => s.open);
  const profile = useAuthStore((s) => s.profile);
  const isSettings = location.pathname.startsWith("/settings");
  const isMessages = location.pathname.startsWith("/messages");
  const mainRef = useRef<HTMLElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [feedMenuOpen, setFeedMenuOpen] = useState(false);
  const { setCurrentFeed, hiddenFeeds, feedOrder } = useFeedStore();
  const { data: savedFeeds } = useSavedFeeds();
  const { data: myLists } = useMyLists();

  const canRefresh = REFRESHABLE_PATHS.some((p) =>
    p === "/" ? location.pathname === "/" : location.pathname.startsWith(p),
  );

  const triggerRefresh = useCallback(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
    window.dispatchEvent(new CustomEvent("kazahana:refresh"));
  }, []);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollTop(el.scrollTop > 300);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Keyboard shortcuts: F5 refresh, "n" new post
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F5" && canRefresh) {
        e.preventDefault();
        triggerRefresh();
      }
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !e.altKey && !isSettings) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement).isContentEditable) return;
        if (useComposeStore.getState().isOpen) return;
        e.preventDefault();
        // On profile pages, auto-insert @mention for the displayed user
        const profileMatch = location.pathname.match(/^\/profile\/([^/]+)/);
        if (profileMatch) {
          const handle = decodeURIComponent(profileMatch[1]);
          if (handle && handle !== profile?.handle) {
            openCompose({ initialText: `@${handle} ` });
            return;
          }
        }
        openCompose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canRefresh, triggerRefresh, openCompose, isSettings, location.pathname, profile?.handle]);

  const scrollToTop = useCallback(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-bg-dark">
      {/* Header */}
      <header className="flex items-center justify-between py-2 px-4 border-b border-border-light dark:border-border-dark">
        {canRefresh ? (
          <button onClick={triggerRefresh} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Refresh (F5)">
            <Icon name="refresh" size={20} />
          </button>
        ) : (
          <span className="w-5" />
        )}
        <h1 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex-1 text-center">@{profile?.handle ?? "..."}</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setFeedMenuOpen((v) => !v)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title={t("feed.feeds")}>
              <Icon name="list" size={20} />
            </button>
            {feedMenuOpen && <FeedQuickJumpMenu
              savedFeeds={savedFeeds}
              myLists={myLists}
              hiddenFeeds={hiddenFeeds}
              feedOrder={feedOrder}
              onSelect={(feed: FeedSource) => { setFeedMenuOpen(false); setCurrentFeed(feed); }}
              onClose={() => setFeedMenuOpen(false)}
              t={t}
            />}
          </div>
          <Link to="/settings" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title={t("settings.title")}><Icon name="settings" size={20} /></Link>
        </div>
      </header>

      {/* Tab Navigation */}
      <TabBar />

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-content min-w-content">
          <Outlet />
        </div>
      </main>

      {/* FAB - New Post / New DM */}
      {!isSettings && (
        isMessages ? (
          <button
            onClick={() => openDMCompose()}
            className="fixed bottom-5 right-5 w-11 h-11 bg-primary/60 text-white rounded-full shadow-lg hover:bg-primary/80 transition-colors flex items-center justify-center text-xl leading-none z-40"
            title={t("messages.newMessage")}
          >
            <Icon name="mail" size={22} />
          </button>
        ) : (
          <button
            onClick={() => {
              const profileMatch = location.pathname.match(/^\/profile\/([^/]+)/);
              if (profileMatch) {
                const handle = decodeURIComponent(profileMatch[1]);
                if (handle && handle !== profile?.handle) {
                  openCompose({ initialText: `@${handle} ` });
                  return;
                }
              }
              openCompose();
            }}
            className="fixed bottom-5 right-5 w-11 h-11 bg-primary/60 text-white rounded-full shadow-lg hover:bg-primary/80 transition-colors flex items-center justify-center text-xl leading-none z-40"
            title={t("compose.newPost")}
          >
            <Icon name="edit_square" size={22} />
          </button>
        )
      )}

      {/* Scroll to top */}
      {showScrollTop && !isSettings && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-5 left-5 w-11 h-11 bg-gray-500/60 text-white rounded-full shadow-lg hover:bg-gray-500/80 transition-colors flex items-center justify-center z-40"
          title="Scroll to top"
        >
          <Icon name="arrow_upward" size={22} />
        </button>
      )}

      {/* Compose Modal */}
      <ComposeModal />

      {/* Post List Modal (likes, reposts, quotes) */}
      <PostListModal />

      {/* Image Lightbox */}
      <ImageLightbox />

      {/* Report Modal */}
      <ReportModal />

      {/* List Membership Modal */}
      <ListMembershipModal />

      {/* DM Compose Modal */}
      <DMComposeModal />

      {/* Context Menu */}
      <ContextMenu />
    </div>
  );
}

/** Quick-jump dropdown for feeds and lists */
function FeedQuickJumpMenu({
  savedFeeds,
  myLists,
  hiddenFeeds,
  feedOrder,
  onSelect,
  onClose,
  t,
}: {
  savedFeeds?: { uri: string; name: string }[];
  myLists?: { uri: string; name: string }[];
  hiddenFeeds: string[];
  feedOrder: string[];
  onSelect: (feed: FeedSource) => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const feeds = (savedFeeds ?? []).filter((f) => !hiddenFeeds.includes(f.uri));
  const lists = (myLists ?? []).filter((l) => !hiddenFeeds.includes(l.uri));

  // Sort feeds by feedOrder
  if (feedOrder.length > 0) {
    feeds.sort((a, b) => {
      const ai = feedOrder.indexOf(a.uri);
      const bi = feedOrder.indexOf(b.uri);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    lists.sort((a, b) => {
      const ai = feedOrder.indexOf(a.uri);
      const bi = feedOrder.indexOf(b.uri);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); onClose(); }} />
      <div className="absolute right-0 top-8 z-50 bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg py-1 min-w-[180px] max-h-[60vh] overflow-y-auto whitespace-nowrap">
        {/* Home */}
        <button
          onClick={() => onSelect({ type: "home" })}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Icon name="home" size={16} />
          <span>{t("feed.home")}</span>
        </button>

        {/* Feeds */}
        {feeds.length > 0 && (
          <>
            <div className="px-3 py-1 text-[10px] font-medium text-gray-400 uppercase tracking-wider">{t("feed.feeds")}</div>
            {feeds.map((f) => (
              <button
                key={f.uri}
                onClick={() => onSelect({ type: "custom", uri: f.uri, name: f.name })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon name="dynamic_feed" size={16} />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </>
        )}

        {/* Lists */}
        {lists.length > 0 && (
          <>
            <div className="px-3 py-1 text-[10px] font-medium text-gray-400 uppercase tracking-wider">{t("feed.lists")}</div>
            {lists.map((l) => (
              <button
                key={l.uri}
                onClick={() => onSelect({ type: "list", uri: l.uri, name: l.name })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon name="lists" size={16} />
                <span className="truncate">{l.name}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </>
  );
}
