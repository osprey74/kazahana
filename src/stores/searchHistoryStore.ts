import { create } from "zustand";

const BASE_KEY = "kazahana-search-history";
const MAX_ENTRIES = 200;

let activeDID: string | null = null;

function storageKey(): string {
  return activeDID ? `${BASE_KEY}:${activeDID}` : BASE_KEY;
}

interface SearchHistoryState {
  history: string[];
  addQuery: (query: string) => void;
  removeQuery: (query: string) => void;
  clearAll: () => void;
  initForAccount: (did: string) => void;
}

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    // ignore
  }
  return [];
}

function saveHistory(history: string[]) {
  localStorage.setItem(storageKey(), JSON.stringify(history));
}

export const useSearchHistoryStore = create<SearchHistoryState>((set, get) => ({
  history: loadHistory(),

  addQuery: (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const prev = get().history.filter((q) => q !== trimmed);
    const next = [trimmed, ...prev].slice(0, MAX_ENTRIES);
    saveHistory(next);
    set({ history: next });
  },

  removeQuery: (query) => {
    const next = get().history.filter((q) => q !== query);
    saveHistory(next);
    set({ history: next });
  },

  clearAll: () => {
    saveHistory([]);
    set({ history: [] });
  },

  initForAccount: (did: string) => {
    activeDID = did;
    set({ history: loadHistory() });
  },
}));
