import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChatAgent } from "../lib/chatAgent";

const JOIN_LINK_CODE_RE = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Parses a join link URL of the form `https://bsky.app/chat/<code>` and
 * returns the code, or null if the URL does not match the expected shape.
 */
export function parseJoinLinkUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.host !== "bsky.app" && u.host !== "www.bsky.app") return null;
    const segments = u.pathname.split("/").filter(Boolean);
    if (segments.length !== 2 || segments[0] !== "chat") return null;
    const code = segments[1];
    return JOIN_LINK_CODE_RE.test(code) ? code : null;
  } catch {
    return null;
  }
}

export function useJoinLinkPreview(code: string | null | undefined) {
  return useQuery({
    queryKey: ["joinLinkPreview", code],
    queryFn: async () => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.group.getJoinLinkPreviews({
        codes: [code!],
      });
      return res.data.joinLinkPreviews[0] ?? null;
    },
    enabled: !!code,
    staleTime: 60_000,
  });
}

export function useRequestJoin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.group.requestJoin({ code });
      return res.data;
    },
    onSuccess: (_data, { code }) => {
      queryClient.invalidateQueries({ queryKey: ["joinLinkPreview", code] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["convoRequests"] });
    },
  });
}

export function useWithdrawJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ convoId }: { convoId: string }) => {
      const agent = getChatAgent();
      await agent.chat.bsky.group.withdrawJoinRequest({ convoId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["joinLinkPreview"] });
      queryClient.invalidateQueries({ queryKey: ["convoRequests"] });
    },
  });
}
