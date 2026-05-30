import { AtpAgent } from "@atproto/api";
import { getAgent } from "./agent";

const CHAT_SERVICE = "https://api.bsky.chat";
const CHAT_AUD = "did:web:api.bsky.chat";

let chatAgent: AtpAgent | null = null;

/**
 * Returns an AtpAgent pointed at the Bluesky chat service that mints a
 * fresh service auth token from the user's PDS for every chat XRPC call.
 *
 * Bluesky's chat service rejects regular PDS session JWTs ("InvalidToken,
 * Token could not be verified") because their audience is the PDS, not
 * api.bsky.chat. The AT Proto answer is `com.atproto.server.getServiceAuth`:
 * the PDS signs a short-lived JWT scoped to a single audience + lxm, and
 * the chat service can verify that JWT via the user's DID document.
 *
 * Routing via the user's PDS with an `atproto-proxy: ...#bsky_chat` header
 * is the alternative, but many independent PDSes don't implement the chat
 * proxy and return 501. getServiceAuth is part of the standard server
 * lexicon and is supported by virtually every PDS implementation, so this
 * approach works regardless of whether the user's PDS proxies chat.
 */
export function getChatAgent(): AtpAgent {
  const mainAgent = getAgent();
  const currentDid = mainAgent.session?.did;
  if (!chatAgent || chatAgent.session?.did !== currentDid) {
    chatAgent = new AtpAgent({
      service: CHAT_SERVICE,
      fetch: createServiceAuthFetch,
    });
  }
  // Keep the chat agent's session reference aligned with the main agent so
  // the SDK considers itself authenticated when dispatching chat calls.
  // The actual Authorization header is rewritten by the fetch handler below.
  if (mainAgent.session && chatAgent.sessionManager.session !== mainAgent.session) {
    chatAgent.sessionManager.session = mainAgent.session;
  }
  return chatAgent;
}

async function createServiceAuthFetch(
  url: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  const mainAgent = getAgent();
  const urlStr = url instanceof Request ? url.url : url.toString();
  const lxmMatch = new URL(urlStr).pathname.match(/^\/xrpc\/(.+)$/);

  if (!mainAgent.session || !lxmMatch) {
    return fetch(url as RequestInfo, init);
  }

  const lxm = lxmMatch[1];
  const { data } = await mainAgent.com.atproto.server.getServiceAuth({
    aud: CHAT_AUD,
    lxm,
  });

  const headers = new Headers(init?.headers);
  if (url instanceof Request) {
    url.headers.forEach((value, key) => {
      if (!headers.has(key)) headers.set(key, value);
    });
  }
  headers.set("Authorization", `Bearer ${data.token}`);

  return fetch(url as RequestInfo, { ...init, headers });
}

export function resetChatAgent(): void {
  chatAgent = null;
}
