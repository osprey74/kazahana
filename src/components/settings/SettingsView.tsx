import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useSettingsStore } from "../../stores/settingsStore";
import { useAuthStore } from "../../stores/authStore";
import { getAgent } from "../../lib/agent";
import { Icon } from "../common/Icon";

type LabelPref = "hide" | "warn" | "ignore";

const CONTENT_LABELS = [
  { id: "nudity", adultOnly: false },
  { id: "sexual", adultOnly: true },
  { id: "porn", adultOnly: true },
  { id: "graphic-media", adultOnly: false },
] as const;

export function SettingsView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme, pollInterval, setPollInterval, desktopNotification, setDesktopNotification, autoStart, setAutoStart } = useSettingsStore();
  const logout = useAuthStore((s) => s.logout);

  // Fetch current moderation preferences
  const { data: modPrefs } = useQuery({
    queryKey: ["moderationPrefs"],
    queryFn: async () => {
      const agent = getAgent();
      const prefs = await agent.getPreferences();
      return prefs.moderationPrefs;
    },
  });

  const [adultContent, setAdultContent] = useState(false);
  const [labelPrefs, setLabelPrefs] = useState<Record<string, LabelPref>>({});

  useEffect(() => {
    if (modPrefs) {
      setAdultContent(modPrefs.adultContentEnabled);
      const prefs: Record<string, LabelPref> = {};
      for (const label of CONTENT_LABELS) {
        const visibility = modPrefs.labels[label.id];
        prefs[label.id] = (visibility as LabelPref) ?? "warn";
      }
      setLabelPrefs(prefs);
    }
  }, [modPrefs]);

  const handleAdultContentToggle = async () => {
    const agent = getAgent();
    const newValue = !adultContent;
    setAdultContent(newValue);
    await agent.setAdultContentEnabled(newValue);
    queryClient.invalidateQueries({ queryKey: ["moderationOpts"] });
    queryClient.invalidateQueries({ queryKey: ["moderationPrefs"] });
  };

  const handleLabelPref = async (label: string, pref: LabelPref) => {
    const agent = getAgent();
    setLabelPrefs((prev) => ({ ...prev, [label]: pref }));
    await agent.setContentLabelPref(label, pref);
    queryClient.invalidateQueries({ queryKey: ["moderationOpts"] });
    queryClient.invalidateQueries({ queryKey: ["moderationPrefs"] });
  };

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
          <Icon name="arrow_back" size={16} className="inline-block align-text-bottom" /> {t("thread.back")}
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

      {/* Poll interval */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("settings.pollInterval")}</h3>
        <div className="flex flex-wrap gap-2">
          {[30, 60, 90, 120].map((sec) => (
            <button
              key={sec}
              onClick={() => setPollInterval(sec)}
              className={`px-4 py-2 text-sm rounded-btn transition-colors ${
                pollInterval === sec
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {t("settings.pollIntervalUnit", { seconds: sec })}
            </button>
          ))}
        </div>
      </section>

      {/* Desktop Notification */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("settings.notification")}</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={desktopNotification}
            onChange={(e) => setDesktopNotification(e.target.checked)}
            className="w-4 h-4 rounded accent-primary"
          />
          <span className="text-sm text-text-light dark:text-text-dark">{t("settings.enableNotification")}</span>
        </label>
      </section>

      {/* Auto Start */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("settings.autoStart")}</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoStart}
            onChange={(e) => setAutoStart(e.target.checked)}
            className="w-4 h-4 rounded accent-primary"
          />
          <span className="text-sm text-text-light dark:text-text-dark">{t("settings.enableAutoStart")}</span>
        </label>
      </section>

      {/* Content Moderation */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t("settings.moderation")}</h3>

        {/* Adult content toggle */}
        <label className="flex items-center gap-2 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={adultContent}
            onChange={handleAdultContentToggle}
            className="w-4 h-4 rounded accent-primary"
          />
          <span className="text-sm text-text-light dark:text-text-dark">{t("settings.adultContent")}</span>
        </label>

        {/* Label preferences */}
        <div className="space-y-2">
          {CONTENT_LABELS.map((label) => {
            if (label.adultOnly && !adultContent) return null;
            const currentPref = labelPrefs[label.id] ?? "warn";
            return (
              <div key={label.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t(`settings.label.${label.id}`)}
                </span>
                <div className="flex gap-1">
                  {(["hide", "warn", "ignore"] as const).map((pref) => (
                    <button
                      key={pref}
                      onClick={() => handleLabelPref(label.id, pref)}
                      className={`px-3 py-1 text-xs rounded-btn transition-colors ${
                        currentPref === pref
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {t(`settings.pref.${pref}`)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Language */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("settings.language")}</h3>
        <select
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="px-3 py-2 text-sm rounded-btn border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer"
        >
          <option value="ja">日本語</option>
          <option value="en">English</option>
          <option value="pt">Português</option>
          <option value="de">Deutsch</option>
          <option value="zh-TW">繁體中文</option>
          <option value="zh-CN">简体中文</option>
          <option value="fr">Français</option>
          <option value="ko">한국어</option>
          <option value="es">Español</option>
          <option value="ru">Русский</option>
          <option value="id">Bahasa Indonesia</option>
        </select>
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

      {/* Support */}
      <section className="mt-6 pt-6 border-t border-border-light dark:border-border-dark text-center text-sm text-gray-500 dark:text-gray-400">
        <p className="mb-3">{t("settings.supportMessage")}</p>
        <button
          onClick={() => openUrl("https://ko-fi.com/A0A71UNW9H")}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-md transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#0085FF", fontFamily: "'Quicksand', sans-serif" }}
        >
          <img
            src="https://storage.ko-fi.com/cdn/cup-border.png"
            alt=""
            className="h-4 w-4"
          />
          Buy the developer a coffee on Ko-fi
        </button>
      </section>
    </div>
  );
}
