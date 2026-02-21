import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout";

function HomePage() {
  return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <p>ホームタイムライン（未実装）</p>
    </div>
  );
}

function SearchPage() {
  return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <p>検索（未実装）</p>
    </div>
  );
}

function NotificationsPage() {
  return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <p>通知（未実装）</p>
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
