import { AtpAgent, type AtpSessionData, type AtpSessionEvent } from "@atproto/api";
import { DEFAULT_PDS_HOST } from "./constants";
import { resetChatAgent } from "./chatAgent";

let agent: AtpAgent | null = null;
let currentService: string | null = null;
let sessionHandler:
  | ((evt: AtpSessionEvent, session: AtpSessionData | undefined, pdsUrl: string) => void)
  | null = null;

export function setSessionHandler(
  handler: (evt: AtpSessionEvent, session: AtpSessionData | undefined, pdsUrl: string) => void,
): void {
  sessionHandler = handler;
}

/**
 * Return the shared AtpAgent.
 *
 * - When called without pdsUrl (the common case from query hooks etc.), return the
 *   existing agent untouched. Only construct a fresh agent if none exists yet,
 *   in which case DEFAULT_PDS_HOST is used as the initial service.
 * - When called with pdsUrl (from auth flow), (re)create the agent if the service
 *   URL changes. AtpAgent cannot switch service after construction, so different
 *   pdsUrl forces a fresh agent.
 */
export function getAgent(pdsUrl?: string): AtpAgent {
  if (!pdsUrl) {
    if (agent) return agent;
    return createAgent(DEFAULT_PDS_HOST);
  }
  if (agent && currentService === pdsUrl) {
    return agent;
  }
  if (agent) {
    resetChatAgent();
  }
  return createAgent(pdsUrl);
}

function createAgent(service: string): AtpAgent {
  currentService = service;
  agent = new AtpAgent({
    service,
    persistSession: (evt, session) => {
      sessionHandler?.(evt, session, service);
    },
  });
  // Route app.bsky.* (AppView) queries via the public Bluesky AppView.
  // Use configureProxy (not setHeader) so withProxy() clones — e.g. the chat
  // agent that needs did:web:api.bsky.chat#bsky_chat — can override this.
  agent.configureProxy("did:web:api.bsky.app#bsky_appview");
  return agent;
}

export function resetAgent(): void {
  agent = null;
  currentService = null;
  resetChatAgent();
}
