import { AtpAgent } from "@atproto/api";
import { getAgent } from "./agent";

const CHAT_SERVICE = "https://api.bsky.chat";

let chatAgent: AtpAgent | null = null;

/**
 * Returns an AtpAgent pointed directly at the Bluesky chat service.
 *
 * We can't rely on the user's PDS to proxy chat traffic: independent PDSes
 * (anything outside bsky.network) typically don't implement the chat proxy
 * and return 501. Hitting api.bsky.chat directly lets it validate the
 * session JWT via standard AT Proto identity resolution.
 */
export function getChatAgent(): AtpAgent {
  const mainAgent = getAgent();
  if (!chatAgent || chatAgent.session?.did !== mainAgent.session?.did) {
    chatAgent = new AtpAgent({ service: CHAT_SERVICE });
    chatAgent.configureProxy("did:web:api.bsky.chat#bsky_chat");
  }
  // Sync the session reference each call so token refresh on the main agent
  // is reflected here (the references diverge once main's session is replaced
  // wholesale during a refresh).
  if (mainAgent.session && chatAgent.sessionManager.session !== mainAgent.session) {
    chatAgent.sessionManager.session = mainAgent.session;
  }
  return chatAgent;
}

export function resetChatAgent(): void {
  chatAgent = null;
}
