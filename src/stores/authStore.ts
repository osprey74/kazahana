import { create } from "zustand";
import type { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { getAgent, resetAgent } from "../lib/agent";
import { loadSession, clearSession } from "../lib/session";

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  profile: ProfileViewDetailed | null;
  error: string | null;

  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  isLoading: true,
  profile: null,
  error: null,

  login: async (identifier: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const agent = getAgent();
      await agent.login({ identifier, password });
      set({ isLoggedIn: true, isLoading: false });
      get().fetchProfile();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Login failed";
      set({ isLoggedIn: false, isLoading: false, error: message });
    }
  },

  logout: async () => {
    await clearSession();
    resetAgent();
    set({ isLoggedIn: false, profile: null, error: null });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const session = await loadSession();
      if (!session) {
        set({ isLoading: false });
        return;
      }
      const agent = getAgent();
      await agent.resumeSession(session);
      set({ isLoggedIn: true, isLoading: false });
      get().fetchProfile();
    } catch {
      await clearSession();
      set({ isLoggedIn: false, isLoading: false });
    }
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
