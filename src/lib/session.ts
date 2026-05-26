import { load } from "@tauri-apps/plugin-store";
import type { AtpSessionData } from "@atproto/api";
import {
  SESSION_STORE_KEY,
  ACCOUNTS_KEY,
  ACTIVE_ACCOUNT_DID_KEY,
  HANDLE_HISTORY_KEY,
  STORE_FILE,
  DEFAULT_PDS_HOST,
} from "./constants";

let storeInstance: Awaited<ReturnType<typeof load>> | null = null;

async function getStore() {
  if (!storeInstance) {
    storeInstance = await load(STORE_FILE, { defaults: {}, autoSave: true });
  }
  return storeInstance;
}

// --- Multi-account session management ---

interface AccountsData {
  sessions: Record<string, AtpSessionData>; // keyed by DID
  pdsUrls?: Record<string, string>; // keyed by DID — absent means legacy (bsky.social)
  order: string[]; // DID order (insertion order preserved)
}

async function loadAccountsData(): Promise<AccountsData> {
  const store = await getStore();
  const data = await store.get<AccountsData>(ACCOUNTS_KEY);
  return data ?? { sessions: {}, order: [] };
}

async function saveAccountsData(data: AccountsData): Promise<void> {
  const store = await getStore();
  await store.set(ACCOUNTS_KEY, data);
}

/** Migrate from single-session format (v1) to multi-account format. */
export async function migrateFromSingleSession(): Promise<void> {
  const store = await getStore();
  const data = await store.get<AccountsData>(ACCOUNTS_KEY);
  if (data && data.order.length > 0) return; // already migrated

  const oldSession = await store.get<AtpSessionData>(SESSION_STORE_KEY);
  if (!oldSession?.did) return;

  const migrated: AccountsData = {
    sessions: { [oldSession.did]: oldSession },
    order: [oldSession.did],
  };
  await store.set(ACCOUNTS_KEY, migrated);
  await store.set(ACTIVE_ACCOUNT_DID_KEY, oldSession.did);
  await store.delete(SESSION_STORE_KEY);
}

/**
 * Save or update a session for an account.
 *
 * When pdsUrl is provided (login / switch), the per-DID PDS URL is updated.
 * When omitted (token refresh from persistSession callback), the existing
 * PDS URL is preserved.
 */
export async function saveSession(session: AtpSessionData, pdsUrl?: string): Promise<void> {
  const data = await loadAccountsData();
  data.sessions[session.did] = session;
  if (!data.order.includes(session.did)) {
    data.order.push(session.did);
  }
  if (pdsUrl) {
    data.pdsUrls = data.pdsUrls ?? {};
    data.pdsUrls[session.did] = pdsUrl;
  }
  await saveAccountsData(data);
  // Also set as active
  const store = await getStore();
  await store.set(ACTIVE_ACCOUNT_DID_KEY, session.did);
}

/** Get the PDS URL associated with a DID, falling back to bsky.social for legacy sessions. */
export async function getPdsUrlForDID(did: string): Promise<string> {
  const data = await loadAccountsData();
  return data.pdsUrls?.[did] ?? DEFAULT_PDS_HOST;
}

/** Load the active session. */
export async function loadSession(): Promise<AtpSessionData | null> {
  const store = await getStore();
  const activeDid = await store.get<string>(ACTIVE_ACCOUNT_DID_KEY);
  if (!activeDid) return null;
  const data = await loadAccountsData();
  return data.sessions[activeDid] ?? null;
}

/** Load all saved sessions in order. */
export async function loadAllSessions(): Promise<AtpSessionData[]> {
  const data = await loadAccountsData();
  return data.order
    .map((did) => data.sessions[did])
    .filter((s): s is AtpSessionData => !!s);
}

/** Get the active account DID. */
export async function getActiveAccountDID(): Promise<string | null> {
  const store = await getStore();
  return (await store.get<string>(ACTIVE_ACCOUNT_DID_KEY)) ?? null;
}

/** Set the active account DID. */
export async function setActiveAccountDID(did: string): Promise<void> {
  const store = await getStore();
  await store.set(ACTIVE_ACCOUNT_DID_KEY, did);
}

/** Load a session for a specific DID. */
export async function loadSessionForDID(did: string): Promise<AtpSessionData | null> {
  const data = await loadAccountsData();
  return data.sessions[did] ?? null;
}

/** Delete a session by DID. Returns the DID of the next account to activate, or null. */
export async function deleteSessionForDID(did: string): Promise<string | null> {
  const data = await loadAccountsData();
  delete data.sessions[did];
  if (data.pdsUrls) delete data.pdsUrls[did];
  data.order = data.order.filter((d) => d !== did);
  await saveAccountsData(data);

  const store = await getStore();
  const activeDid = await store.get<string>(ACTIVE_ACCOUNT_DID_KEY);
  if (activeDid === did) {
    const nextDid = data.order[0] ?? null;
    if (nextDid) {
      await store.set(ACTIVE_ACCOUNT_DID_KEY, nextDid);
    } else {
      await store.delete(ACTIVE_ACCOUNT_DID_KEY);
    }
    return nextDid;
  }
  return activeDid ?? null;
}

/** Clear all sessions (full reset). */
export async function clearSession(): Promise<void> {
  const store = await getStore();
  await store.delete(ACCOUNTS_KEY);
  await store.delete(ACTIVE_ACCOUNT_DID_KEY);
  await store.delete(SESSION_STORE_KEY); // clean up legacy key too
}

// --- Handle history (unchanged) ---

export async function loadHandleHistory(): Promise<string[]> {
  const store = await getStore();
  const history = await store.get<string[]>(HANDLE_HISTORY_KEY);
  return history ?? [];
}

export async function addHandleHistory(handle: string): Promise<void> {
  const store = await getStore();
  const history = await store.get<string[]>(HANDLE_HISTORY_KEY) ?? [];
  const filtered = history.filter((h) => h !== handle);
  filtered.unshift(handle);
  await store.set(HANDLE_HISTORY_KEY, filtered.slice(0, 20));
}

export async function removeHandleHistory(handle: string): Promise<void> {
  const store = await getStore();
  const history = await store.get<string[]>(HANDLE_HISTORY_KEY) ?? [];
  await store.set(HANDLE_HISTORY_KEY, history.filter((h) => h !== handle));
}
