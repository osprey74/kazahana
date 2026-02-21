import { Outlet } from "react-router-dom";
import { TabBar } from "./TabBar";

export function AppLayout() {
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
    </div>
  );
}
