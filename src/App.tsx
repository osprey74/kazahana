import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "./components/layout";
import { LoginForm } from "./components/auth/LoginForm";
import { TimelineView } from "./components/timeline/TimelineView";
import { ThreadView } from "./components/thread/ThreadView";
import { NotificationList } from "./components/notification/NotificationList";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import { useAuthStore } from "./stores/authStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function SearchPage() {
  return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <p>検索（未実装）</p>
    </div>
  );
}


function ProfilePage() {
  return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <p>プロフィール（未実装）</p>
    </div>
  );
}

function AuthGate() {
  const { isLoggedIn, isLoading, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

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
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<TimelineView />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/notifications" element={<NotificationList />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/post/:uri" element={<ThreadView />} />
        </Route>
      </Routes>
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
