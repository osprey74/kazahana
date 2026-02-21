import { load } from "@tauri-apps/plugin-store";
import type { AtpSessionData } from "@atproto/api";
import { SESSION_STORE_KEY, STORE_FILE } from "./constants";

let storeInstance: Awaited<ReturnType<typeof load>> | null = null;

async function getStore() {
  if (!storeInstance) {
    storeInstance = await load(STORE_FILE, { defaults: {}, autoSave: true });
  }
  return storeInstance;
}

export async function saveSession(session: AtpSessionData): Promise<void> {
  const store = await getStore();
  await store.set(SESSION_STORE_KEY, session);
}

export async function loadSession(): Promise<AtpSessionData | null> {
  const store = await getStore();
  const session = await store.get<AtpSessionData>(SESSION_STORE_KEY);
  return session ?? null;
}

export async function clearSession(): Promise<void> {
  const store = await getStore();
  await store.delete(SESSION_STORE_KEY);
}
