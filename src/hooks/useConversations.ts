import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

/**
 * Lists conversation requests: incoming direct/group convo invites (ConvoView)
 * plus outgoing group join requests (JoinRequestConvoView). Replaces the prior
 * listConvos({status:"request"}) flow which only returned incoming items.
 */
export function useConvoRequests() {
  return useInfiniteQuery({
    queryKey: ["convoRequests"],
    queryFn: async ({ pageParam }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.convo.listConvoRequests({
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

export function useAcceptConvo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ convoId }: { convoId: string }) => {
      const agent = getChatAgent();
      await agent.chat.bsky.convo.acceptConvo({ convoId });
    },
    onSuccess: (_data, { convoId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", convoId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["convoRequests"] });
    },
  });
}

export function useLeaveConvo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ convoId }: { convoId: string }) => {
      const agent = getChatAgent();
      await agent.chat.bsky.convo.leaveConvo({ convoId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["convoRequests"] });
    },
  });
}
