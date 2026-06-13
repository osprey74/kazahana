import { useQuery } from "@tanstack/react-query";
import { ChatBskyConvoDefs } from "@atproto/api";
import { getChatAgent } from "../lib/chatAgent";

export function useUnreadDMs() {
  return useQuery({
    queryKey: ["unreadDMs"],
    queryFn: async () => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.convo.listConvos({ limit: 100 });
      return res.data.convos.reduce((sum, c) => {
        const joinRequests = ChatBskyConvoDefs.isGroupConvo(c.kind)
          ? (c.kind.unreadJoinRequestCount ?? 0)
          : 0;
        return sum + c.unreadCount + joinRequests;
      }, 0);
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
