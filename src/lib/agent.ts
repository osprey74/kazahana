import { AtpAgent, type AtpSessionData, type AtpSessionEvent } from "@atproto/api";
import { DEFAULT_PDS_HOST } from "./constants";
import { saveSession, clearSession } from "./session";

let agent: AtpAgent | null = null;

function handleSessionChange(evt: AtpSessionEvent, session?: AtpSessionData) {
  if (evt === "update" || evt === "create") {
    if (session) {
      saveSession(session);
    }
  } else if (evt === "expired") {
    clearSession();
  }
}

export function getAgent(): AtpAgent {
  if (!agent) {
    agent = new AtpAgent({
      service: DEFAULT_PDS_HOST,
      persistSession: handleSessionChange,
    });
  }
  return agent;
}

export function resetAgent(): void {
  agent = null;
}
