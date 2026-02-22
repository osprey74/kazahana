import { AtpAgent, type AtpSessionData, type AtpSessionEvent } from "@atproto/api";
import { DEFAULT_PDS_HOST } from "./constants";

let agent: AtpAgent | null = null;
let sessionHandler: ((evt: AtpSessionEvent, session?: AtpSessionData) => void) | null = null;

export function setSessionHandler(handler: (evt: AtpSessionEvent, session?: AtpSessionData) => void): void {
  sessionHandler = handler;
}

export function getAgent(): AtpAgent {
  if (!agent) {
    agent = new AtpAgent({
      service: DEFAULT_PDS_HOST,
      persistSession: (evt, session) => {
        sessionHandler?.(evt, session);
      },
    });
  }
  return agent;
}

export function resetAgent(): void {
  agent = null;
}
