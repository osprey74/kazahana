import { create } from "zustand";
import type { AppBskyActorDefs } from "@atproto/api";
type ProfileViewDetailed = AppBskyActorDefs.ProfileViewDetailed;
import type { AtpSessionData, AtpSessionEvent } from "@atproto/api";
import { getAgent, resetAgent, setSessionHandler } from "../lib/agent";
import {
  loadSession,
  loadAllSessions,
  saveSession,
  deleteSessionForDID,
  setActiveAccountDID,
  loadSessionForDID,
  clearSession,
  addHandleHistory,
  migrateFromSingleSession,
  getPdsUrlForDID,
} from "../lib/session";
import { DEFAULT_PDS_HOST } from "../lib/constants";
import { normalizeIdentifier, resolveIdentifierToPds } from "../lib/pdsResolver";
import { isRateLimitError, getRateLimitDelay } from "../lib/rateLimit";
import { syncLanguageFromBluesky } from "../lib/languageSync";
import { useFeedStore } from "./feedStore";
import { useSearchHistoryStore } from "./searchHistoryStore";
import { useViewHistoryStore } from "./viewHistoryStore";

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  profile: ProfileViewDetailed | null;
  error: string | null;
  savedAccounts: AtpSessionData[];
  activeAccountDID: string | null;

  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  switchAccount: (did: string) => Promise<void>;
  removeAccount: (did: string) => Promise<void>;
  reloadAccounts: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  isLoading: true,
  profile: null,
  error: null,
  savedAccounts: [],
  activeAccountDID: null,

  login: async (identifier: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Identifier may be a handle, DID, or email. Email login is only supported
      // on bsky.social; for handles/DIDs we resolve the user's actual PDS first.
      const normalized = normalizeIdentifier(identifier);
      const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized);
      let pdsUrl = DEFAULT_PDS_HOST;
      if (!isEmail) {
        const resolved = await resolveIdentifierToPds(normalized);
        if (!resolved) {
          set({ isLoggedIn: false, isLoading: false, error: "pds_resolution_failed" });
          return;
        }
        pdsUrl = resolved.pdsUrl;
      }
      const agent = getAgent(pdsUrl);
      await agent.login({ identifier, password });
      addHandleHistory(identifier);
      // Explicitly save the session before reading all sessions.
      // The persistSession callback fires saveSession() without awaiting,
      // so loadAllSessions() could race and miss the new session.
      if (agent.session) {
        await saveSession(agent.session, pdsUrl);
      }
      const did = agent.session?.did ?? null;
      const accounts = await loadAllSessions();
      set({ isLoggedIn: true, isLoading: false, savedAccounts: accounts, activeAccountDID: did });
      if (did) {
        useFeedStore.getState().initForAccount(did);
        useSearchHistoryStore.getState().initForAccount(did);
        useViewHistoryStore.getState().initForAccount(did);
      }
      get().fetchProfile();
      syncLanguageFromBluesky();
    } catch (e) {
      if (isRateLimitError(e)) {
        const delay = getRateLimitDelay(e);
        const seconds = delay ? Math.ceil(delay / 1000) : null;
        set({ isLoggedIn: false, isLoading: false, error: `rate_limit:${seconds ?? ""}` });
      } else {
        const message = e instanceof Error ? e.message : "Login failed";
        set({ isLoggedIn: false, isLoading: false, error: message });
      }
    }
  },

  logout: async () => {
    const did = get().activeAccountDID;
    if (did) {
      await get().removeAccount(did);
    } else {
      await clearSession();
      resetAgent();
      set({ isLoggedIn: false, profile: null, error: null, savedAccounts: [], activeAccountDID: null });
    }
  },

  removeAccount: async (did: string) => {
    // Best-effort server-side session deletion against the account's actual PDS
    try {
      const session = await loadSessionForDID(did);
      if (session) {
        const pdsUrl = await getPdsUrlForDID(did);
        await fetch(`${pdsUrl}/xrpc/com.atproto.server.deleteSession`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.refreshJwt}` },
        });
      }
    } catch {
      // best-effort
    }

    const nextDid = await deleteSessionForDID(did);
    const accounts = await loadAllSessions();

    if (nextDid && did === get().activeAccountDID) {
      // Switch to next account
      await get().switchAccount(nextDid);
      set({ savedAccounts: accounts });
    } else if (!nextDid) {
      // No accounts left
      resetAgent();
      set({ isLoggedIn: false, profile: null, error: null, savedAccounts: [], activeAccountDID: null });
    } else {
      // Removed a non-active account
      set({ savedAccounts: accounts });
    }
  },

  switchAccount: async (did: string) => {
    set({ isLoading: true, error: null });
    try {
      // Set active DID first (race condition prevention, per iOS handoff)
      await setActiveAccountDID(did);
      const session = await loadSessionForDID(did);
      if (!session) {
        set({ isLoading: false, error: "session_not_found" });
        return;
      }
      const pdsUrl = await getPdsUrlForDID(did);
      const agent = getAgent(pdsUrl);
      await agent.resumeSession(session);
      // Ensure refreshed session is persisted before reading all sessions
      if (agent.session) {
        await saveSession(agent.session, pdsUrl);
      }
      const accounts = await loadAllSessions();
      set({ isLoggedIn: true, isLoading: false, activeAccountDID: did, savedAccounts: accounts, profile: null });
      useFeedStore.getState().initForAccount(did);
      useSearchHistoryStore.getState().initForAccount(did);
      useViewHistoryStore.getState().initForAccount(did);
      get().fetchProfile();
    } catch {
      // Session expired for this account — remove it and show error
      await deleteSessionForDID(did);
      const accounts = await loadAllSessions();
      set({
        isLoading: false,
        savedAccounts: accounts,
        error: "session_expired",
      });
    }
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      // Migrate from single-session format if needed
      await migrateFromSingleSession();

      const accounts = await loadAllSessions();
      set({ savedAccounts: accounts });

      if (accounts.length === 0) {
        set({ isLoading: false });
        return;
      }

      const session = await loadSession();
      if (!session) {
        // Accounts exist but no active — show picker
        set({ isLoading: false });
        return;
      }

      const pdsUrl = await getPdsUrlForDID(session.did);
      const agent = getAgent(pdsUrl);
      await agent.resumeSession(session);
      set({ isLoggedIn: true, isLoading: false, activeAccountDID: session.did });
      useFeedStore.getState().initForAccount(session.did);
      useSearchHistoryStore.getState().initForAccount(session.did);
      useViewHistoryStore.getState().initForAccount(session.did);
      get().fetchProfile();
      syncLanguageFromBluesky();
    } catch {
      // Active session failed — don't clear all accounts, just reset login state
      resetAgent();
      set({ isLoggedIn: false, isLoading: false });
    }
  },

  reloadAccounts: async () => {
    const accounts = await loadAllSessions();
    set({ savedAccounts: accounts });
  },

  fetchProfile: async () => {
    try {
      const agent = getAgent();
      if (!agent.session?.did) return;
      const res = await agent.getProfile({ actor: agent.session.did });
      set({ profile: res.data });
    } catch {
      // profile fetch failure is non-critical
    }
  },
}));

// Register session event handler — runs once at module load
function handleSessionEvent(evt: AtpSessionEvent, session: AtpSessionData | undefined, pdsUrl: string) {
  if (evt === "update" || evt === "create") {
    if (session) {
      // Save and update savedAccounts so UI stays in sync
      saveSession(session, pdsUrl).then(() => {
        loadAllSessions().then((accounts) => {
          useAuthStore.setState({ savedAccounts: accounts });
        });
      });
    }
  } else if (evt === "expired") {
    const { activeAccountDID, savedAccounts } = useAuthStore.getState();
    if (savedAccounts.length <= 1) {
      // Single or no account — go to login
      clearSession();
      resetAgent();
      useAuthStore.setState({
        isLoggedIn: false,
        profile: null,
        error: "session_expired",
        savedAccounts: [],
        activeAccountDID: null,
      });
    } else {
      // Multi-account: remove expired account, switch to next
      if (activeAccountDID) {
        useAuthStore.getState().removeAccount(activeAccountDID);
      }
    }
  }
  // "create-failed" and "network-error" are intentionally ignored:
  // - create-failed: handled by login() catch block
  // - network-error: transient, session data should be kept
}

setSessionHandler(handleSessionEvent);
