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

const isMac = /Macintosh|Mac OS X/i.test(navigator.userAgent);

export function SettingsView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme, pollInterval, setPollInterval, desktopNotification, setDesktopNotification, autoStart, setAutoStart, videoVolume, setVideoVolume, showVia, setShowVia, closeAction, setCloseAction, imageOpenMode, setImageOpenMode } = useSettingsStore();
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
      <h2 className="text-lg font-bold text-text-light dark:text-text-dark mb-6">{t("settings.title")}</h2>

      {/* Theme */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("settings.theme")}</h3>
        <div className="flex gap-2 ml-4">
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
        <div className="flex flex-wrap gap-2 ml-4">
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
        <label className="flex items-center gap-2 cursor-pointer ml-4">
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
        <label className="flex items-center gap-2 cursor-pointer ml-4">
          <input
            type="checkbox"
            checked={autoStart}
            onChange={(e) => setAutoStart(e.target.checked)}
            className="w-4 h-4 rounded accent-primary"
          />
          <span className="text-sm text-text-light dark:text-text-dark">{t("settings.enableAutoStart")}</span>
        </label>
      </section>

      {/* Close Button Action */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("settings.closeAction")}</h3>
        <div className="flex flex-col gap-2 ml-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="closeAction"
              checked={closeAction === "exit"}
              onChange={() => setCloseAction("exit")}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-text-light dark:text-text-dark">{t("settings.closeActionExit")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="closeAction"
              checked={closeAction === "minimize"}
              onChange={() => setCloseAction("minimize")}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-text-light dark:text-text-dark">{t(isMac ? "settings.closeActionMinimize_macos" : "settings.closeActionMinimize")}</span>
          </label>
          {closeAction === "minimize" && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-start gap-1">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              <span>{t(isMac ? "settings.closeActionMinimizeHint_macos" : "settings.closeActionMinimizeHint")}</span>
            </p>
          )}
        </div>
      </section>

      {/* Video Volume */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("settings.videoVolume")}</h3>
        <div className="flex items-center gap-3 ml-4">
          <Icon name="volume_down" size={18} className="text-gray-500" />
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={videoVolume}
            onChange={(e) => setVideoVolume(Number(e.target.value))}
            className="flex-1 h-1.5 accent-primary cursor-pointer"
          />
          <Icon name="volume_up" size={18} className="text-gray-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400 w-10 text-right">{videoVolume}%</span>
        </div>
      </section>

      {/* Image Display Mode */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("settings.imageOpenMode")}</h3>
        <div className="flex flex-col gap-2 ml-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="imageOpenMode"
              checked={imageOpenMode === "app"}
              onChange={() => setImageOpenMode("app")}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-text-light dark:text-text-dark">{t("settings.imageOpenModeApp")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="imageOpenMode"
              checked={imageOpenMode === "external"}
              onChange={() => setImageOpenMode("external")}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-text-light dark:text-text-dark">{t("settings.imageOpenModeExternal")}</span>
          </label>
        </div>
      </section>

      <hr className="border-border-light dark:border-border-dark mb-6" />

      {/* Home: Feed visibility */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("feed.home")}</h3>
        <button
          onClick={() => navigate("/settings/feed-visibility")}
          className="flex items-center gap-2 text-sm text-primary hover:underline ml-4"
        >
          <Icon name="tune" size={16} />
          {t("settings.feedVisibility")}
          <Icon name="chevron_right" size={16} />
        </button>
      </section>

      {/* Show Via (client name) */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("settings.showVia")}</h3>
        <label className="flex items-center gap-2 cursor-pointer ml-4">
          <input
            type="checkbox"
            checked={showVia}
            onChange={(e) => setShowVia(e.target.checked)}
            className="w-4 h-4 rounded accent-primary"
          />
          <span className="text-sm text-text-light dark:text-text-dark">{t("settings.enableShowVia")}</span>
        </label>
      </section>

      <hr className="border-border-light dark:border-border-dark mb-6" />

      {/* Content Moderation */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t("settings.moderation")}</h3>

        <div className="ml-4">
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

          {/* Hidden posts link */}
          <button
            onClick={() => navigate("/settings/hidden-posts")}
            className="flex items-center gap-2 mt-3 text-sm text-primary hover:underline"
          >
            <Icon name="visibility_off" size={16} />
            {t("settings.hiddenPosts")}
            <Icon name="chevron_right" size={16} />
          </button>
        </div>
      </section>

      <hr className="border-border-light dark:border-border-dark mb-6" />

      {/* Language */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("settings.language")}</h3>
        <select
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="px-3 py-2 text-sm rounded-btn border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer ml-4"
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

      <hr className="border-border-light dark:border-border-dark mb-6" />

      {/* Logout */}
      <section className="mb-6 ml-4">
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-red-500 border border-red-300 rounded-btn hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          {t("settings.logout")}
        </button>
      </section>

      <hr className="border-border-light dark:border-border-dark mb-6" />

      {/* About */}
      <section className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        <p className="font-medium text-text-light dark:text-text-dark">kazahana {t("settings.version", { version: __APP_VERSION__ })}</p>
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
      <section className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
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
