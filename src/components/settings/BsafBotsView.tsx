import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { useBsafStore } from "../../stores/bsafStore";
import { getAgent } from "../../lib/agent";
import { validateBotDefinition, fetchBotDefinitionFromUrl } from "../../lib/bsaf";
import { Icon } from "../common/Icon";
import { LoadingSpinner } from "../common/LoadingSpinner";
import type { BsafRegisteredBot } from "../../types/bsaf";

export function BsafBotsView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { registeredBots, registerBot, unregisterBot, setFilterOptions } = useBsafStore();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedDid, setExpandedDid] = useState<string | null>(null);
  const [confirmUnregister, setConfirmUnregister] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleRegister = async (json: unknown) => {
    clearMessages();
    const definition = validateBotDefinition(json);
    if (!definition) {
      setError(t("bsaf.invalidJson"));
      return;
    }

    // Check duplicate
    if (registeredBots.some((b) => b.definition.bot.did === definition.bot.did)) {
      setError(t("bsaf.duplicateBot"));
      return;
    }

    registerBot(definition);

    // Auto-follow
    try {
      const agent = getAgent();
      await agent.follow(definition.bot.did);
    } catch {
      setSuccess(t("bsaf.followFailed"));
      return;
    }

    setSuccess(t("bsaf.registered"));
  };

  const handleFetchUrl = async () => {
    if (!url.trim()) return;
    clearMessages();
    setLoading(true);
    try {
      const definition = await fetchBotDefinitionFromUrl(url.trim());
      await handleRegister(definition);
      setUrl("");
    } catch {
      setError(t("bsaf.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFile = async () => {
    clearMessages();
    try {
      const path = await open({
        filters: [{ name: "JSON", extensions: ["json"] }],
        multiple: false,
      });
      if (!path) return;

      setLoading(true);
      const content = await readTextFile(path);
      const json = JSON.parse(content);
      await handleRegister(json);
    } catch {
      setError(t("bsaf.invalidJson"));
    } finally {
      setLoading(false);
    }
  };

  const handleUnregister = async (did: string) => {
    clearMessages();
    // Unfollow
    try {
      const agent = getAgent();
      const profile = await agent.getProfile({ actor: did });
      const followUri = profile.data.viewer?.following;
      if (followUri) {
        await agent.deleteFollow(followUri);
      }
    } catch {
      // Continue with unregister even if unfollow fails
    }

    unregisterBot(did);
    setConfirmUnregister(null);
    setExpandedDid(null);
    setSuccess(t("bsaf.unregistered"));
  };

  return (
    <div>
      {/* Header */}
      <div className="px-4 py-2 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-primary hover:underline"
          >
            <Icon name="arrow_back" size={16} className="inline-block align-text-bottom" /> {t("thread.back")}
          </button>
          <h2 className="text-sm font-bold text-text-light dark:text-text-dark">{t("bsaf.manageTitle")}</h2>
        </div>
      </div>

      {/* Registration area */}
      <div className="px-4 py-4 border-b border-border-light dark:border-border-dark">
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleFetchUrl(); }}
            placeholder={t("bsaf.urlPlaceholder")}
            className="flex-1 px-3 py-2 text-sm rounded-btn border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-text-light dark:text-text-dark placeholder-gray-400"
          />
          <button
            onClick={handleFetchUrl}
            disabled={loading || !url.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-btn hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {t("bsaf.fetch")}
          </button>
        </div>
        <button
          onClick={handleLoadFile}
          disabled={loading}
          className="mt-2 text-sm text-primary hover:underline disabled:opacity-50"
        >
          {t("bsaf.orLoadFile")}
        </button>

        {loading && <div className="mt-2"><LoadingSpinner /></div>}
        {error && (
          <p className="mt-2 text-sm text-red-500 flex items-start gap-1">
            <Icon name="error" size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
        {success && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-start gap-1">
            <Icon name="check_circle" size={16} className="mt-0.5 shrink-0" />
            {success}
          </p>
        )}
      </div>

      {/* Bot list */}
      {registeredBots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Icon name="smart_toy" size={32} className="mb-2 text-gray-300 dark:text-gray-600" />
          <p className="text-sm">{t("bsaf.noBots")}</p>
        </div>
      ) : (
        <div>
          {registeredBots.map((bot) => (
            <BotItem
              key={bot.definition.bot.did}
              bot={bot}
              expanded={expandedDid === bot.definition.bot.did}
              onToggle={() => setExpandedDid(expandedDid === bot.definition.bot.did ? null : bot.definition.bot.did)}
              onFilterChange={setFilterOptions}
              confirmUnregister={confirmUnregister === bot.definition.bot.did}
              onConfirmUnregister={() => setConfirmUnregister(bot.definition.bot.did)}
              onCancelUnregister={() => setConfirmUnregister(null)}
              onUnregister={() => handleUnregister(bot.definition.bot.did)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface BotItemProps {
  bot: BsafRegisteredBot;
  expanded: boolean;
  onToggle: () => void;
  onFilterChange: (did: string, tag: string, values: string[]) => void;
  confirmUnregister: boolean;
  onConfirmUnregister: () => void;
  onCancelUnregister: () => void;
  onUnregister: () => void;
}

function BotItem({ bot, expanded, onToggle, onFilterChange, confirmUnregister, onConfirmUnregister, onCancelUnregister, onUnregister }: BotItemProps) {
  const { t } = useTranslation();
  const { definition, filterSettings } = bot;

  const handleToggleOption = (tag: string, value: string) => {
    const current = filterSettings[tag] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange(definition.bot.did, tag, next);
  };

  const handleSelectAll = (tag: string) => {
    const filter = definition.filters.find((f) => f.tag === tag);
    if (!filter) return;
    onFilterChange(definition.bot.did, tag, filter.options.map((o) => o.value));
  };

  const handleDeselectAll = (tag: string) => {
    onFilterChange(definition.bot.did, tag, []);
  };

  return (
    <div className="border-b border-border-light dark:border-border-dark">
      {/* Bot header — clickable */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <Icon name={expanded ? "expand_more" : "chevron_right"} size={18} className="text-gray-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-text-light dark:text-text-dark truncate block">
            {definition.bot.name}
          </span>
          <span className="text-xs text-gray-500 truncate block">
            @{definition.bot.handle}
          </span>
        </div>
      </button>

      {/* Expanded filter settings */}
      {expanded && (
        <div className="px-4 pb-4 ml-7">
          <p className="text-xs text-gray-500 mb-3">{definition.bot.description}</p>

          {/* Filters */}
          {definition.filters.map((filter) => {
            const enabled = filterSettings[filter.tag] ?? [];
            return (
              <div key={filter.tag} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{filter.label}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelectAll(filter.tag)}
                      className="text-[11px] text-primary hover:underline"
                    >
                      {t("bsaf.selectAll")}
                    </button>
                    <button
                      onClick={() => handleDeselectAll(filter.tag)}
                      className="text-[11px] text-primary hover:underline"
                    >
                      {t("bsaf.deselectAll")}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {filter.options.map((option) => {
                    const isEnabled = enabled.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleToggleOption(filter.tag, option.value)}
                        className={`px-2.5 py-1 text-xs rounded-btn transition-colors ${
                          isEnabled
                            ? "bg-primary text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Bot info */}
          <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark text-xs text-gray-500 space-y-1">
            <p>{t("bsaf.source")}: {definition.bot.source}</p>
            <p>{t("bsaf.lastUpdated")}: {new Date(definition.updated_at).toLocaleDateString()}</p>
            <p>{t("bsaf.lastChecked")}: {new Date(bot.lastCheckedAt).toLocaleDateString()}</p>
          </div>

          {/* Unregister */}
          <div className="mt-3">
            {confirmUnregister ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {t("bsaf.unregisterConfirm")}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={onUnregister}
                    className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-btn hover:bg-red-600 transition-colors"
                  >
                    {t("bsaf.unregister")}
                  </button>
                  <button
                    onClick={onCancelUnregister}
                    className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-btn hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t("post.deleteCancel")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onConfirmUnregister}
                className="px-3 py-1 text-xs font-medium text-red-500 border border-red-300 rounded-btn hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                {t("bsaf.unregister")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
