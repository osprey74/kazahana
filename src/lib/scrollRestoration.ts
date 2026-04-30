const STORAGE_KEY = "kazahana:scrollPositions";
const MAX_ENTRIES = 50;

export interface SavedScrollPosition {
  topUri: string;
}

interface StoreEntry {
  pos: SavedScrollPosition;
  t: number;
}

type Store = Record<string, StoreEntry>;

function readStore(): Store {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    const entries = Object.entries(store);
    if (entries.length > MAX_ENTRIES) {
      entries.sort((a, b) => b[1].t - a[1].t);
      const trimmed: Store = Object.fromEntries(entries.slice(0, MAX_ENTRIES));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / serialization errors
  }
}

export function saveScrollPosition(historyKey: string, pos: SavedScrollPosition) {
  if (!historyKey) return;
  const store = readStore();
  store[historyKey] = { pos, t: Date.now() };
  writeStore(store);
}

export function loadScrollPosition(historyKey: string): SavedScrollPosition | null {
  if (!historyKey) return null;
  return readStore()[historyKey]?.pos ?? null;
}
