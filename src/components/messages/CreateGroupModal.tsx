import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { AppBskyActorDefs } from "@atproto/api";
import { useCreateGroupStore } from "../../stores/createGroupStore";
import { useCreateGroup } from "../../hooks/useGroup";
import { getAgent } from "../../lib/agent";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";

type ProfileViewBasic = AppBskyActorDefs.ProfileViewBasic;

const MAX_MEMBERS = 49;
const MAX_NAME_GRAPHEMES = 50;

function mapCreateError(err: unknown, name?: string): { key: string; vars?: Record<string, string> } {
  const e = (err as { error?: string })?.error;
  switch (e) {
    case "NewAccountCannotCreateGroup":
      return { key: "messages.group.error.newAccountCannotCreate" };
    case "UserForbidsGroups":
      return { key: "messages.group.error.userForbidsGroups", vars: { name: name ?? "" } };
    case "NotFollowedBySender":
      return { key: "messages.group.error.notFollowedBy", vars: { name: name ?? "" } };
    case "RecipientNotFound":
      return { key: "messages.group.error.recipientNotFound" };
    case "BlockedActor":
      return { key: "messages.group.error.blockedActor" };
    case "BlockedSubject":
      return { key: "messages.group.error.blockedSubject" };
    case "AccountSuspended":
      return { key: "messages.group.error.accountSuspended" };
    default:
      return { key: "messages.group.error.unknown" };
  }
}

export function CreateGroupModal() {
  const { isOpen, close } = useCreateGroupStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileViewBasic[]>([]);
  const [selected, setSelected] = useState<ProfileViewBasic[]>([]);
  const [searching, setSearching] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorVars, setErrorVars] = useState<Record<string, string> | undefined>(undefined);
  const nameRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createGroup = useCreateGroup();

  useEffect(() => {
    if (isOpen) {
      nameRef.current?.focus();
    } else {
      setName("");
      setQuery("");
      setResults([]);
      setSelected([]);
      setErrorKey(null);
      setErrorVars(undefined);
    }
  }, [isOpen]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const agent = getAgent();
        const res = await agent.searchActorsTypeahead({ q: value, limit: 8 });
        setResults(res.data.actors);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const toggleSelect = useCallback((user: ProfileViewBasic) => {
    setSelected((prev) => {
      const exists = prev.find((p) => p.did === user.did);
      if (exists) return prev.filter((p) => p.did !== user.did);
      if (prev.length >= MAX_MEMBERS) return prev;
      return [...prev, user];
    });
  }, []);

  const handleCreate = useCallback(async () => {
    setErrorKey(null);
    const trimmedName = name.trim();
    if (!trimmedName || selected.length === 0) return;
    try {
      const res = await createGroup.mutateAsync({
        name: trimmedName,
        members: selected.map((s) => s.did),
      });
      close();
      navigate(`/messages/${res.convo.id}`);
    } catch (e) {
      const failingName = selected[0]?.displayName || selected[0]?.handle;
      const mapped = mapCreateError(e, failingName);
      setErrorKey(mapped.key);
      setErrorVars(mapped.vars);
    }
  }, [name, selected, createGroup, close, navigate]);

  if (!isOpen) return null;

  const canSubmit = name.trim().length > 0 && selected.length > 0 && !createGroup.isPending;
  const isSelected = (did: string) => selected.some((s) => s.did === did);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-12"
      onClick={close}
    >
      <div
        className="bg-white dark:bg-bg-dark rounded-card shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
          <h2 className="text-sm font-bold text-text-light dark:text-text-dark">
            {t("messages.group.createTitle")}
          </h2>
          <button
            type="button"
            onClick={close}
            className="text-gray-400 hover:text-gray-600"
            title={t("common.close")}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Name */}
        <div className="px-4 pt-3 pb-2">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {t("messages.group.nameLabel")}
          </label>
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("messages.group.namePlaceholder")}
            maxLength={MAX_NAME_GRAPHEMES * 10}
            className="w-full bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Selected members */}
        <div className="px-4 pt-1 pb-2">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {t("messages.group.selectedMembers", { count: selected.length })}
          </label>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selected.map((u) => (
                <button
                  type="button"
                  key={u.did}
                  onClick={() => toggleSelect(u)}
                  className="inline-flex items-center gap-1 pl-1 pr-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20 text-xs text-primary"
                >
                  <Avatar src={u.avatar} alt={u.displayName || u.handle} size="xs" />
                  <span className="truncate max-w-[120px]">{u.displayName || u.handle}</span>
                  <Icon name="close" size={12} />
                </button>
              ))}
            </div>
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t("messages.searchUser")}
            className="w-full bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {searching && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            </div>
          )}
          {!searching && query && results.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-4">{t("search.noResults")}</p>
          )}
          {!searching && results.map((user) => {
            const checked = isSelected(user.did);
            const atLimit = !checked && selected.length >= MAX_MEMBERS;
            return (
              <button
                type="button"
                key={user.did}
                onClick={() => toggleSelect(user)}
                disabled={atLimit}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                  atLimit
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <Avatar src={user.avatar} alt={user.displayName || user.handle} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-light dark:text-text-dark truncate">
                    {user.displayName || user.handle}
                  </p>
                  <p className="text-xs text-gray-400 truncate">@{user.handle}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    checked
                      ? "bg-primary text-white"
                      : "border border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {checked && <Icon name="check" size={14} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {errorKey && (
          <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <Icon name="error_outline" size={14} />
            {t(errorKey, errorVars)}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border-light dark:border-border-dark flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="px-3 py-1.5 rounded-btn text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t("messages.group.cancel")}
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canSubmit}
            className="px-4 py-1.5 rounded-btn text-sm font-medium bg-primary text-white hover:bg-blue-600 disabled:opacity-40"
          >
            {createGroup.isPending
              ? t("messages.group.creating")
              : t("messages.group.createButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
