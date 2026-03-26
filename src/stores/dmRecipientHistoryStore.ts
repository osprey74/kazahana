import { create } from "zustand";

const STORAGE_KEY = "kazahana-dm-recipient-history";
const MAX_ENTRIES = 20;

export interface DMRecipient {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

interface DMRecipientHistoryState {
  history: DMRecipient[];
  addRecipient: (recipient: DMRecipient) => void;
  removeRecipient: (did: string) => void;
  clearAll: () => void;
}

function loadHistory(): DMRecipient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DMRecipient[];
  } catch {
    // ignore
  }
  return [];
}

function saveHistory(history: DMRecipient[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export const useDMRecipientHistoryStore = create<DMRecipientHistoryState>((set, get) => ({
  history: loadHistory(),

  addRecipient: (recipient) => {
    const prev = get().history.filter((r) => r.did !== recipient.did);
    const next = [recipient, ...prev].slice(0, MAX_ENTRIES);
    saveHistory(next);
    set({ history: next });
  },

  removeRecipient: (did) => {
    const next = get().history.filter((r) => r.did !== did);
    saveHistory(next);
    set({ history: next });
  },

  clearAll: () => {
    saveHistory([]);
    set({ history: [] });
  },
}));
