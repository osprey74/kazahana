import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useSettingsStore } from "../../stores/settingsStore";
import { useBsafStore } from "../../stores/bsafStore";
import { useAuthStore } from "../../stores/authStore";
import { getAgent } from "../../lib/agent";
import { LoginForm } from "../auth/LoginForm";
import { Icon } from "../common/Icon";
import { WatermarkSettings } from "./WatermarkSettings";

type LabelPref = "hide" | "warn" | "ignore";

const ADULT_LABELS = [
  { id: "porn" },
  { id: "sexual" },
  { id: "nudity" },
] as const;

const GRAPHIC_LABELS = [
  { id: "graphic-media" },
  { id: "gore" },
] as const;

const ALL_LABEL_IDS = [...ADULT_LABELS, ...GRAPHIC_LABELS].map((l) => l.id);

const isMac = /Macintosh|Mac OS X/i.test(navigator.userAgent);

export function SettingsView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme, pollInterval, setPollInterval, desktopNotification, setDesktopNotification, autoStart, setAutoStart, videoVolume, setVideoVolume, showVia, setShowVia, closeAction, setCloseAction, imageOpenMode, setImageOpenMode, claudeApiKey, setClaudeApiKey, confirmDraftImageQuality, setConfirmDraftImageQuality } = useSettingsStore();
  const { savedAccounts, activeAccountDID, switchAccount, removeAccount } = useAuthStore();
  const { bsafEnabled, setBsafEnabled } = useBsafStore();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [confirmRemoveDID, setConfirmRemoveDID] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

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
      for (const id of ALL_LABEL_IDS) {
        const visibility = modPrefs.labels[id];
        prefs[id] = (visibility as LabelPref) ?? "warn";
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

  const handleRemoveAccount = async (did: string) => {
    setConfirmRemoveDID(null);
    await removeAccount(did);
  };

  if (showAddAccount) {
    return <LoginForm onBack={() => setShowAddAccount(false)} isAddAccount />;
  }

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

      {/* Watermark */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("watermark.title")}</h3>
        <WatermarkSettings />
      </section>

      {/* Claude API */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("settings.claudeApi")}</h3>
        <div className="ml-4">
          {claudeApiKey ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-light dark:text-text-dark font-mono">
                {apiKeyVisible ? claudeApiKey : `sk-ant-...${claudeApiKey.slice(-8)}`}
              </span>
              <button
                onClick={() => setApiKeyVisible(!apiKeyVisible)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                title={apiKeyVisible ? "Hide" : "Show"}
              >
                <Icon name={apiKeyVisible ? "visibility_off" : "visibility"} size={16} />
              </button>
              <button
                onClick={() => { setClaudeApiKey(""); setApiKeyInput(""); setApiKeyVisible(false); }}
                className="px-3 py-1 text-xs rounded-btn text-red-500 border border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                {t("settings.claudeApiDelete")}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="flex-1 text-sm px-3 py-1.5 rounded border border-border-light dark:border-border-dark bg-transparent text-text-light dark:text-text-dark placeholder-gray-400 focus:outline-none focus:border-primary font-mono"
              />
              <button
                onClick={() => { if (apiKeyInput.trim()) { setClaudeApiKey(apiKeyInput.trim()); setApiKeyInput(""); } }}
                disabled={!apiKeyInput.trim()}
                className={`px-3 py-1.5 text-xs rounded-btn transition-colors ${
                  apiKeyInput.trim()
                    ? "bg-primary text-white hover:opacity-90"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                {t("settings.claudeApiRegister")}
              </button>
            </div>
          )}
          <p className="mt-1.5 text-[11px] text-gray-400">{t("settings.claudeApiHint")}</p>
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

      {/* Draft image quality warning */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("settings.draftImageWarning")}</h3>
        <label className="flex items-center gap-2 cursor-pointer ml-4">
          <input
            type="checkbox"
            checked={confirmDraftImageQuality}
            onChange={(e) => setConfirmDraftImageQuality(e.target.checked)}
            className="w-4 h-4 rounded accent-primary"
          />
          <span className="text-sm text-text-light dark:text-text-dark">{t("settings.enableDraftImageWarning")}</span>
        </label>
      </section>

      {/* BSAF */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("bsaf.title")}</h3>
        <label className="flex items-center gap-2 cursor-pointer ml-4">
          <input
            type="checkbox"
            checked={bsafEnabled}
            onChange={(e) => setBsafEnabled(e.target.checked)}
            className="w-4 h-4 rounded accent-primary"
          />
          <span className="text-sm text-text-light dark:text-text-dark">{t("bsaf.enableBsaf")}</span>
        </label>
        {bsafEnabled && (
          <button
            onClick={() => navigate("/settings/bsaf")}
            className="flex items-center gap-2 text-sm text-primary hover:underline ml-4 mt-2"
          >
            <Icon name="smart_toy" size={16} />
            {t("bsaf.manageBots")}
            <Icon name="chevron_right" size={16} />
          </button>
        )}
      </section>

      <hr className="border-border-light dark:border-border-dark mb-6" />

      {/* Content Moderation */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t("settings.moderation")}</h3>

        <div className="ml-4">
          {/* Adult content section */}
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t("settings.adultContentSection")}</h4>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={adultContent}
              onChange={handleAdultContentToggle}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-sm text-text-light dark:text-text-dark">{t("settings.adultContent")}</span>
          </label>

          {adultContent && (
            <div className="space-y-2 mb-4">
              {ADULT_LABELS.map((label) => {
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
          )}

          {/* Graphic content section */}
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t("settings.graphicContent")}</h4>
          <div className="space-y-2">
            {GRAPHIC_LABELS.map((label) => {
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

          {/* View history link */}
          <button
            onClick={() => navigate("/settings/view-history")}
            className="flex items-center gap-2 mt-3 text-sm text-primary hover:underline"
          >
            <Icon name="history" size={16} />
            {t("settings.viewHistory")}
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

      {/* Accounts */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("settings.accounts")}</h3>
        <div className="ml-4 space-y-2">
          {savedAccounts.map((account) => (
            <div key={account.did}>
              <div className="flex items-center justify-between py-2">
                <button
                  type="button"
                  onClick={() => { if (account.did !== activeAccountDID) switchAccount(account.did); }}
                  className="flex items-center gap-2 min-w-0 text-left"
                >
                  {account.did === activeAccountDID && (
                    <Icon name="check" size={16} className="text-primary shrink-0" />
                  )}
                  <span className={`text-sm truncate ${account.did === activeAccountDID ? "font-medium text-text-light dark:text-text-dark" : "text-gray-600 dark:text-gray-400 hover:text-text-light dark:hover:text-text-dark"}`}>
                    @{account.handle}
                  </span>
                  {account.did === activeAccountDID && (
                    <span className="text-[10px] text-primary shrink-0">{t("settings.activeAccount")}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemoveDID(account.did)}
                  className="text-gray-300 hover:text-red-500 transition-colors shrink-0 ml-2"
                  title={t("auth.accountPicker.removeAccount")}
                >
                  <Icon name="close" size={16} />
                </button>
              </div>

              {/* Remove confirmation */}
              {confirmRemoveDID === account.did && (
                <div className="p-3 rounded-btn bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-2">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                    {t("auth.accountPicker.removeConfirmTitle")}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                    {t("auth.accountPicker.removeConfirmMessage")}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveDID(null)}
                      className="px-3 py-1.5 text-xs rounded-btn border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {t("post.deleteCancel")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveAccount(account.did)}
                      className="px-3 py-1.5 text-xs rounded-btn bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      {t("auth.accountPicker.removeAccount")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add account */}
          <button
            type="button"
            onClick={() => setShowAddAccount(true)}
            className="flex items-center gap-2 text-sm text-primary hover:underline mt-2"
          >
            <Icon name="person_add" size={16} />
            {t("settings.addAccount")}
          </button>
        </div>
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
