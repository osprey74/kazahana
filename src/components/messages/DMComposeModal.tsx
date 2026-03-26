import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDMComposeStore } from "../../stores/dmComposeStore";
import { useDMRecipientHistoryStore } from "../../stores/dmRecipientHistoryStore";
import { getAgent } from "../../lib/agent";
import { getChatAgent } from "../../lib/chatAgent";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";
import type { ProfileViewBasic } from "@atproto/api/dist/client/types/app/bsky/actor/defs";

export function DMComposeModal() {
  const { isOpen, recipientDid, close } = useDMComposeStore();
  const { history: recipientHistory, addRecipient, removeRecipient } = useDMRecipientHistoryStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileViewBasic[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (isOpen && recipientDid) {
      // Direct open with a known user — create/get convo immediately
      handleSelectByDid(recipientDid);
    }
    return () => {
      setQuery("");
      setResults([]);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, recipientDid]);

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

  const handleSelectByDid = useCallback(async (did: string) => {
    setCreating(true);
    try {
      const chatAgent = getChatAgent();
      const res = await chatAgent.chat.bsky.convo.getConvoForMembers({ members: [did] });
      close();
      navigate(`/messages/${res.data.convo.id}`);
    } catch {
      // Error creating conversation
    } finally {
      setCreating(false);
    }
  }, [close, navigate]);

  const handleSelect = useCallback(async (user: ProfileViewBasic) => {
    addRecipient({
      did: user.did,
      handle: user.handle,
      displayName: user.displayName,
      avatar: user.avatar,
    });
    await handleSelectByDid(user.did);
  }, [handleSelectByDid, addRecipient]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16" onClick={close}>
      <div
        className="bg-white dark:bg-bg-dark rounded-card shadow-xl w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
          <h2 className="text-sm font-bold text-text-light dark:text-text-dark">
            {t("messages.newMessage")}
          </h2>
          <button onClick={close} className="text-gray-400 hover:text-gray-600">
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t("messages.searchUser")}
            className="w-full bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Results / History */}
        <div className="max-h-64 overflow-y-auto scrollbar-thin">
          {creating && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            </div>
          )}
          {!creating && searching && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            </div>
          )}
          {/* Search results */}
          {!creating && !searching && query && results.map((user) => (
            <button
              key={user.did}
              onClick={() => handleSelect(user)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left"
            >
              <Avatar src={user.avatar} alt={user.displayName || user.handle} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-light dark:text-text-dark truncate">
                  {user.displayName || user.handle}
                </p>
                <p className="text-xs text-gray-400 truncate">@{user.handle}</p>
              </div>
            </button>
          ))}
          {!creating && !searching && query && results.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-4">{t("search.noResults")}</p>
          )}
          {/* Recent recipients history */}
          {!creating && !searching && !query && recipientHistory.length > 0 && (
            <>
              <div className="px-4 py-1.5 text-xs text-gray-400 font-medium">
                {t("messages.recentRecipients")}
              </div>
              {recipientHistory.map((r) => (
                <div key={r.did} className="flex items-center group">
                  <button
                    onClick={() => handleSelect({ did: r.did, handle: r.handle, displayName: r.displayName, avatar: r.avatar })}
                    className="flex-1 flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left min-w-0"
                  >
                    <Avatar src={r.avatar} alt={r.displayName || r.handle} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-light dark:text-text-dark truncate">
                        {r.displayName || r.handle}
                      </p>
                      <p className="text-xs text-gray-400 truncate">@{r.handle}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => removeRecipient(r.did)}
                    className="px-3 py-2 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t("common.delete")}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
