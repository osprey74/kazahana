import { useInfiniteQuery } from "@tanstack/react-query";
import { getChatAgent } from "../lib/chatAgent";

export function useConversations() {
  return useInfiniteQuery({
    queryKey: ["conversations"],
    queryFn: async ({ pageParam }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.convo.listConvos({
        limit: 30,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useConversationRequests() {
  return useInfiniteQuery({
    queryKey: ["conversationRequests"],
    queryFn: async ({ pageParam }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.convo.listConvos({
        limit: 30,
        cursor: pageParam as string | undefined,
        status: "request",
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
