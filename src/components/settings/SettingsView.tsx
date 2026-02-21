import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "../../stores/settingsStore";
import { useAuthStore } from "../../stores/authStore";

export function SettingsView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useSettingsStore();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("kazahana-lang", lang);
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-primary hover:underline"
        >
          ← {t("thread.back")}
        </button>
        <h2 className="text-lg font-bold text-text-light dark:text-text-dark">{t("settings.title")}</h2>
      </div>

      {/* Theme */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("settings.theme")}</h3>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setTheme(opt)}
              className={`px-4 py-2 text-sm rounded-btn transition-colors ${
                theme === opt
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {t(`settings.${opt}`)}
            </button>
          ))}
        </div>
      </section>

      {/* Language */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("settings.language")}</h3>
        <div className="flex gap-2">
          {[
            { code: "ja", label: "日本語" },
            { code: "en", label: "English" },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`px-4 py-2 text-sm rounded-btn transition-colors ${
                i18n.language.startsWith(lang.code)
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </section>

      {/* Logout */}
      <section className="mt-8 pt-6 border-t border-border-light dark:border-border-dark">
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-red-500 border border-red-300 rounded-btn hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          {t("settings.logout")}
        </button>
      </section>

      {/* About */}
      <section className="mt-6 pt-6 border-t border-border-light dark:border-border-dark text-sm text-gray-500 dark:text-gray-400">
        <p className="font-medium text-text-light dark:text-text-dark">kazahana {t("settings.version", { version: "0.1.0" })}</p>
        <div className="mt-2 flex gap-3">
          <button
            onClick={() => navigate("/settings/license")}
            className="hover:underline hover:text-primary"
          >
            {t("settings.license")}
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={() => navigate("/settings/readme")}
            className="hover:underline hover:text-primary"
          >
            {t("settings.readme")}
          </button>
        </div>
      </section>
    </div>
  );
}
