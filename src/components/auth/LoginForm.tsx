import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/authStore";

export function LoginForm() {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;
    login(identifier.trim(), password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-bg-dark">
      <div className="w-full max-w-sm mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">{t("app.title")}</h1>
          <p className="text-gray-500 mt-2 text-sm">{t("auth.tagline")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t("auth.handle")}
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={t("auth.handlePlaceholder")}
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-btn text-sm bg-transparent text-text-light dark:text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t("auth.appPassword")}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.appPasswordPlaceholder")}
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-btn text-sm bg-transparent text-text-light dark:text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className={`text-sm ${error === "session_expired" ? "text-amber-600 dark:text-amber-400" : "text-red-500"}`}>
              {error === "session_expired" ? t("session.expired") : error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || !identifier.trim() || !password.trim()}
            className="w-full py-2.5 bg-primary text-white font-medium rounded-btn text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t("auth.loggingIn") : t("auth.login")}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          {t("auth.helpText")}
        </p>
      </div>
    </div>
  );
}
