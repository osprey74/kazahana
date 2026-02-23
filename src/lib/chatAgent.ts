import type { AtpAgent } from "@atproto/api";
import { getAgent } from "./agent";

let chatAgent: AtpAgent | null = null;

export function getChatAgent(): AtpAgent {
  const agent = getAgent();
  if (!chatAgent || chatAgent.session?.did !== agent.session?.did) {
    chatAgent = agent.withProxy("bsky_chat", "did:web:api.bsky.chat") as typeof agent;
  }
  return chatAgent;
}

export function resetChatAgent(): void {
  chatAgent = null;
}
