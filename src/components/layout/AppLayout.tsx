import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TabBar } from "./TabBar";
import { ComposeModal } from "../post/ComposeModal";
import { ImageLightbox } from "../common/ImageLightbox";
import { useComposeStore } from "../../stores/composeStore";
import { useAuthStore } from "../../stores/authStore";

export function AppLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const openCompose = useComposeStore((s) => s.open);
  const profile = useAuthStore((s) => s.profile);
  const isSettings = location.pathname.startsWith("/settings");

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-bg-dark">
      {/* Header */}
      <header className="flex items-center justify-between py-2 px-4 border-b border-border-light dark:border-border-dark">
        <h1 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex-1 text-center">@{profile?.handle ?? "..."}</h1>
        <a href="/settings" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg" title={t("settings.title")}>⚙</a>
      </header>

      {/* Tab Navigation */}
      <TabBar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-content min-w-content">
          <Outlet />
        </div>
      </main>

      {/* FAB - New Post */}
      {!isSettings && (
        <button
          onClick={() => openCompose()}
          className="fixed bottom-5 right-5 w-11 h-11 bg-primary/60 text-white rounded-full shadow-lg hover:bg-primary/80 transition-colors flex items-center justify-center text-xl leading-none z-40"
          title={t("compose.newPost")}
        >
          <span className="-mt-px">+</span>
        </button>
      )}

      {/* Compose Modal */}
      <ComposeModal />

      {/* Image Lightbox */}
      <ImageLightbox />
    </div>
  );
}
