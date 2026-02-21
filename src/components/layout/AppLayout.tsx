import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TabBar } from "./TabBar";
import { ComposeModal } from "../post/ComposeModal";
import { useComposeStore } from "../../stores/composeStore";
import { useAuthStore } from "../../stores/authStore";

export function AppLayout() {
  const { t } = useTranslation();
  const openCompose = useComposeStore((s) => s.open);
  const profile = useAuthStore((s) => s.profile);

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
      <button
        onClick={() => openCompose()}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center text-2xl z-40"
        title={t("compose.newPost")}
      >
        +
      </button>

      {/* Compose Modal */}
      <ComposeModal />
    </div>
  );
}
