import { useState, type FormEvent } from "react";
import { useAuthStore } from "../../stores/authStore";

export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;
    login(identifier.trim(), password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-sm mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-light">かざはな</h1>
          <p className="text-gray-500 mt-2 text-sm">Bluesky Desktop Client</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              ハンドル
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="user.bsky.social"
              className="w-full px-3 py-2 border border-border-light rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              アプリパスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="xxxx-xxxx-xxxx-xxxx"
              className="w-full px-3 py-2 border border-border-light rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !identifier.trim() || !password.trim()}
            className="w-full py-2.5 bg-primary text-white font-medium rounded-btn text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          アプリパスワードは Bluesky の設定画面から生成できます
        </p>
      </div>
    </div>
  );
}
