import { create } from "zustand";

const STORAGE_KEY = "kazahana-search-history";
const MAX_ENTRIES = 200;

interface SearchHistoryState {
  history: string[];
  addQuery: (query: string) => void;
  removeQuery: (query: string) => void;
  clearAll: () => void;
}

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    // ignore
  }
  return [];
}

function saveHistory(history: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
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
}));
