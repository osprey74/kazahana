import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { onOpenUrl, getCurrent as getCurrentDeepLink } from "@tauri-apps/plugin-deep-link";
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
import { FeedVisibilityView } from "./components/settings/FeedVisibilityView";
import { StarterPackDetailView } from "./components/profile/StarterPackDetailView";
import { DMListView } from "./components/messages/DMListView";
import { DMThreadView } from "./components/messages/DMThreadView";
import { FollowersPage } from "./components/profile/FollowersPage";
import { FollowingPage } from "./components/profile/FollowingPage";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import { useAuthStore } from "./stores/authStore";
import { useComposeStore } from "./stores/composeStore";
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

function parseDeepLink(url: string): { title?: string; url?: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "kazahana:") return null;
    if (parsed.hostname !== "compose") return null;
    return {
      title: parsed.searchParams.get("title") || undefined,
      url: parsed.searchParams.get("url") || undefined,
    };
  } catch { return null; }
}

function handleDeepLinkUrls(urls: string[]) {
  for (const url of urls) {
    const params = parseDeepLink(url);
    if (!params) continue;
    const parts: string[] = [];
    if (params.title) parts.push(params.title);
    if (params.url) parts.push(params.url);
    const text = parts.join("\n");
    if (!text) continue;

    const store = useComposeStore.getState();
    if (store.isOpen) {
      store.close();
      setTimeout(() => useComposeStore.getState().open({ initialText: text }), 50);
    } else {
      store.open({ initialText: text });
    }
    break;
  }
}

function AuthGate() {
  const { isLoggedIn, isLoading, restoreSession } = useAuthStore();
  const theme = useSettingsStore((s) => s.theme);

  const initAutoStart = useSettingsStore((s) => s.initAutoStart);
  const initCloseAction = useSettingsStore((s) => s.initCloseAction);

  useEffect(() => {
    restoreSession();
    initAutoStart();
    initCloseAction();
  }, [restoreSession, initAutoStart, initCloseAction]);

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

  // Deep-link listener (only when logged in)
  useEffect(() => {
    if (!isLoggedIn) return;

    // Handle cold-start URL (app launched via deep-link)
    getCurrentDeepLink()
      .then((urls) => { if (urls) handleDeepLinkUrls(urls); })
      .catch(() => {});

    // Listen for deep-link events while running
    let unlisten: (() => void) | undefined;
    onOpenUrl((urls) => handleDeepLinkUrls(urls))
      .then((fn) => { unlisten = fn; })
      .catch(() => {});

    return () => { unlisten?.(); };
  }, [isLoggedIn]);

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
            <Route path="/messages" element={<DMListView />} />
            <Route path="/messages/:convoId" element={<DMThreadView />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/profile/:handle" element={<ProfileView />} />
            <Route path="/profile/:handle/followers" element={<FollowersPage />} />
            <Route path="/profile/:handle/following" element={<FollowingPage />} />
            <Route path="/post/:uri" element={<ThreadView />} />
            <Route path="/starter-pack/:uri" element={<StarterPackDetailView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/settings/license" element={<LicenseView />} />
            <Route path="/settings/readme" element={<ReadmeView />} />
            <Route path="/settings/hidden-posts" element={<HiddenPostsView />} />
            <Route path="/settings/feed-visibility" element={<FeedVisibilityView />} />
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
