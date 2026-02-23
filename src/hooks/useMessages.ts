import { useCallback } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RichText } from "@atproto/api";
import { getChatAgent } from "../lib/chatAgent";
import { getAgent } from "../lib/agent";

export function useMessages(convoId: string) {
  return useInfiniteQuery({
    queryKey: ["messages", convoId],
    queryFn: async ({ pageParam }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.convo.getMessages({
        convoId,
        limit: 50,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    enabled: !!convoId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ convoId, text }: { convoId: string; text: string }) => {
      const agent = getChatAgent();
      const rt = new RichText({ text });
      await rt.detectFacets(getAgent());
      const res = await agent.chat.bsky.convo.sendMessage({
        convoId,
        message: {
          text: rt.text,
          facets: rt.facets,
        },
      });
      return res.data;
    },
    onSuccess: (_data, { convoId }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", convoId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ convoId, messageId }: { convoId: string; messageId: string }) => {
      const agent = getChatAgent();
      await agent.chat.bsky.convo.deleteMessageForSelf({ convoId, messageId });
    },
    onSuccess: (_data, { convoId }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", convoId] });
    },
  });
}

export function useMarkConvoAsRead() {
  const queryClient = useQueryClient();

  return useCallback(
    async (convoId: string) => {
      try {
        const agent = getChatAgent();
        await agent.chat.bsky.convo.updateRead({ convoId });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["unreadDMs"] });
      } catch {
        // non-critical
      }
    },
    [queryClient],
  );
}
