import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatBskyActorDefs, type ChatBskyConvoDefs, type ChatBskyGroupDefs } from "@atproto/api";
import { getChatAgent } from "../lib/chatAgent";

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, members }: { name: string; members: string[] }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.group.createGroup({ name, members });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useEditGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ convoId, name }: { convoId: string; name: string }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.group.editGroup({ convoId, name });
      return res.data;
    },
    onSuccess: (_data, { convoId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", convoId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useAddMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ convoId, members }: { convoId: string; members: string[] }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.group.addMembers({ convoId, members });
      return res.data;
    },
    onSuccess: (_data, { convoId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", convoId] });
      queryClient.invalidateQueries({ queryKey: ["convoMembers", convoId] });
    },
  });
}

export function useRemoveMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ convoId, members }: { convoId: string; members: string[] }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.group.removeMembers({ convoId, members });
      return res.data;
    },
    onSuccess: (_data, { convoId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", convoId] });
      queryClient.invalidateQueries({ queryKey: ["convoMembers", convoId] });
    },
  });
}

export function useCreateJoinLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      convoId,
      joinRule,
      requireApproval,
    }: {
      convoId: string;
      joinRule: ChatBskyGroupDefs.JoinRule;
      requireApproval?: boolean;
    }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.group.createJoinLink({
        convoId,
        joinRule,
        requireApproval,
      });
      return res.data;
    },
    onSuccess: (_data, { convoId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", convoId] });
    },
  });
}

export function useEditJoinLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      convoId,
      joinRule,
      requireApproval,
    }: {
      convoId: string;
      joinRule?: ChatBskyGroupDefs.JoinRule;
      requireApproval?: boolean;
    }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.group.editJoinLink({
        convoId,
        joinRule,
        requireApproval,
      });
      return res.data;
    },
    onSuccess: (_data, { convoId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", convoId] });
    },
  });
}

export function useEnableJoinLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ convoId }: { convoId: string }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.group.enableJoinLink({ convoId });
      return res.data;
    },
    onSuccess: (_data, { convoId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", convoId] });
    },
  });
}

export function useDisableJoinLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ convoId }: { convoId: string }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.group.disableJoinLink({ convoId });
      return res.data;
    },
    onSuccess: (_data, { convoId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", convoId] });
    },
  });
}

export function useLockConvo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ convoId }: { convoId: string }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.convo.lockConvo({ convoId });
      return res.data;
    },
    onSuccess: (_data, { convoId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", convoId] });
      queryClient.invalidateQueries({ queryKey: ["messages", convoId] });
    },
  });
}

export function useUnlockConvo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ convoId }: { convoId: string }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.convo.unlockConvo({ convoId });
      return res.data;
    },
    onSuccess: (_data, { convoId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", convoId] });
      queryClient.invalidateQueries({ queryKey: ["messages", convoId] });
    },
  });
}

export function useConvoMembers(convoId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["convoMembers", convoId],
    queryFn: async ({ pageParam }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.convo.getConvoMembers({
        convoId: convoId!,
        limit: 100,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: !!convoId,
    staleTime: 30_000,
  });
}

export function useListJoinRequests(convoId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["joinRequests", convoId],
    queryFn: async ({ pageParam }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.group.listJoinRequests({
        convoId: convoId!,
        limit: 30,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: !!convoId,
    staleTime: 15_000,
  });
}

export function useApproveJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ convoId, member }: { convoId: string; member: string }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.group.approveJoinRequest({ convoId, member });
      return res.data;
    },
    onSuccess: (_data, { convoId }) => {
      queryClient.invalidateQueries({ queryKey: ["joinRequests", convoId] });
      queryClient.invalidateQueries({ queryKey: ["conversation", convoId] });
      queryClient.invalidateQueries({ queryKey: ["convoMembers", convoId] });
    },
  });
}

export function useRejectJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ convoId, member }: { convoId: string; member: string }) => {
      const agent = getChatAgent();
      await agent.chat.bsky.group.rejectJoinRequest({ convoId, member });
    },
    onSuccess: (_data, { convoId }) => {
      queryClient.invalidateQueries({ queryKey: ["joinRequests", convoId] });
      queryClient.invalidateQueries({ queryKey: ["conversation", convoId] });
    },
  });
}

export function useUpdateJoinRequestsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ convoId }: { convoId: string }) => {
      const agent = getChatAgent();
      await agent.chat.bsky.group.updateJoinRequestsRead({ convoId });
    },
    onSuccess: (_data, { convoId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", convoId] });
    },
  });
}

/**
 * Sends a chat message that embeds an existing join link. Used by the
 * group settings UI to share the group's invite link into another convo.
 */
export function useSendJoinLinkMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      convoId,
      code,
      text,
    }: {
      convoId: string;
      code: string;
      text: string;
    }) => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.convo.sendMessage({
        convoId,
        message: {
          text,
          embed: {
            $type: "chat.bsky.embed.joinLink",
            code,
          },
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

/**
 * Returns whether the viewer is the owner of the given group conversation.
 * The viewer's `ProfileViewBasic.kind` carries a `GroupConvoMember.role` of
 * "owner" or "standard" — looking that up from `convo.members` (which the
 * lexicon guarantees includes the viewer for group convos) is the canonical
 * way to determine role. `groupConvo.joinRequestCount` looks like an owner
 * indicator at first glance, but in practice the server omits it when zero,
 * so it cannot be used as a presence check.
 */
export function isViewerGroupOwner(
  convo: ChatBskyConvoDefs.ConvoView | null | undefined,
  myDid: string | null | undefined,
): boolean {
  if (!convo || !myDid) return false;
  const viewer = convo.members.find((m) => m.did === myDid);
  if (!viewer) return false;
  if (!ChatBskyActorDefs.isGroupConvoMember(viewer.kind)) return false;
  return viewer.kind.role === "owner";
}
