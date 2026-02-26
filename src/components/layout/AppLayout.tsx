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
        openCompose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canRefresh, triggerRefresh, openCompose, isSettings]);

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
        <Link to="/settings" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title={t("settings.title")}><Icon name="settings" size={20} /></Link>
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
            onClick={() => openCompose()}
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
