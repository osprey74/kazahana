import { useQuery } from "@tanstack/react-query";
import { getChatAgent } from "../lib/chatAgent";

export function useUnreadDMs() {
  return useQuery({
    queryKey: ["unreadDMs"],
    queryFn: async () => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.convo.listConvos({ limit: 100 });
      return res.data.convos.reduce((sum, c) => sum + c.unreadCount, 0);
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
