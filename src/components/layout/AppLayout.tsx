import { Outlet } from "react-router-dom";
import { TabBar } from "./TabBar";
import { ComposeModal } from "../post/ComposeModal";
import { useComposeStore } from "../../stores/composeStore";

export function AppLayout() {
  const openCompose = useComposeStore((s) => s.open);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-center py-2 border-b border-border-light">
        <h1 className="text-lg font-bold text-text-light">かざはな</h1>
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
        title="新しい投稿を作成"
      >
        +
      </button>

      {/* Compose Modal */}
      <ComposeModal />
    </div>
  );
}
