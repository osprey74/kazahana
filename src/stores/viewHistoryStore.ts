import { create } from "zustand";

const BASE_KEY = "kazahana-view-history";
const MAX_ENTRIES = 200;

let activeDID: string | null = null;

function storageKey(): string {
  return activeDID ? `${BASE_KEY}:${activeDID}` : BASE_KEY;
}

export interface ViewHistoryEntry {
  uri: string;
  viewedAt: number;
}

interface ViewHistoryState {
  history: ViewHistoryEntry[];
  addEntry: (uri: string) => void;
  removeEntry: (uri: string) => void;
  clearAll: () => void;
  initForAccount: (did: string) => void;
}

function loadHistory(): ViewHistoryEntry[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e): e is ViewHistoryEntry =>
        typeof e === "object" && e !== null
        && typeof (e as ViewHistoryEntry).uri === "string"
        && typeof (e as ViewHistoryEntry).viewedAt === "number",
      );
  } catch {
    return [];
  }
}

function saveHistory(history: ViewHistoryEntry[]) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(history));
  } catch {
    // ignore quota errors
  }
}

export const useViewHistoryStore = create<ViewHistoryState>((set, get) => ({
  history: loadHistory(),

  addEntry: (uri) => {
    if (!uri) return;
    const prev = get().history.filter((e) => e.uri !== uri);
    const next = [{ uri, viewedAt: Date.now() }, ...prev].slice(0, MAX_ENTRIES);
    saveHistory(next);
    set({ history: next });
  },

  removeEntry: (uri) => {
    const next = get().history.filter((e) => e.uri !== uri);
    saveHistory(next);
    set({ history: next });
  },

  clearAll: () => {
    saveHistory([]);
    set({ history: [] });
  },

  initForAccount: (did) => {
    activeDID = did;
    set({ history: loadHistory() });
  },
}));
