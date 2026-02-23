import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "./components/layout";
import { LoginForm } from "./components/auth/LoginForm";
import { HomeView } from "./components/timeline/HomeView";
import { ThreadView } from "./components/thread/ThreadView";
import { NotificationList } from "./components/notification/NotificationList";
import { ProfileView } from "./components/profile/ProfileView";
import { SearchView } from "./components/search/SearchView";
import { SettingsView } from "./components/settings/SettingsView";
import { LicenseView } from "./components/settings/LicenseView";
import { ReadmeView } from "./components/settings/ReadmeView";
import { HiddenPostsView } from "./components/settings/HiddenPostsView";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import { useAuthStore } from "./stores/authStore";
import { applyTheme, useSettingsStore } from "./stores/settingsStore";
import { ModerationProvider } from "./contexts/ModerationContext";
import { isRateLimitError, getRateLimitDelay } from "./lib/rateLimit";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status;
        // Don't retry on auth errors — session refresh is handled by AtpAgent
        if (status === 401 || status === 403) return false;
        // Rate limit: retry up to 3 times with backoff
        if (isRateLimitError(error)) return failureCount < 3;
        return failureCount < 1;
      },
      retryDelay: (attemptIndex, error) => {
        // Use server-provided delay from ratelimit-reset / retry-after headers
        const headerDelay = getRateLimitDelay(error);
        if (headerDelay) return headerDelay;
        // Exponential backoff: 1s → 2s → 4s (capped at 30s)
        return Math.min(1000 * 2 ** attemptIndex, 30_000);
      },
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGate() {
  const { isLoggedIn, isLoading, restoreSession } = useAuthStore();
  const theme = useSettingsStore((s) => s.theme);

  const initAutoStart = useSettingsStore((s) => s.initAutoStart);

  useEffect(() => {
    restoreSession();
    initAutoStart();
  }, [restoreSession, initAutoStart]);

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(theme);

    // Listen for system theme changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginForm />;
  }

  return (
    <BrowserRouter>
      <ModerationProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomeView />} />
            <Route path="/search" element={<SearchView />} />
            <Route path="/notifications" element={<NotificationList />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/profile/:handle" element={<ProfileView />} />
            <Route path="/post/:uri" element={<ThreadView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/settings/license" element={<LicenseView />} />
            <Route path="/settings/readme" element={<ReadmeView />} />
            <Route path="/settings/hidden-posts" element={<HiddenPostsView />} />
          </Route>
        </Routes>
      </ModerationProvider>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
    </QueryClientProvider>
  );
}

export default App;
