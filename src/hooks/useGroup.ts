import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatBskyActorDefs, type ChatBskyActorDeclaration, type ChatBskyConvoDefs, type ChatBskyGroupDefs } from "@atproto/api";
import { getAgent } from "../lib/agent";
import { getChatAgent } from "../lib/chatAgent";

export type AllowInvitesPref = "all" | "following" | "none";

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
      queryClient.invalidateQueries({ queryKey: ["unreadDMs"] });
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

const DECLARATION_COLLECTION = "chat.bsky.actor.declaration";
const DECLARATION_RKEY = "self";

function normalizeAllowInvitesPref(value: unknown): AllowInvitesPref {
  return value === "none" || value === "following" ? value : "all";
}

/**
 * Reads the viewer's chat.bsky.actor.declaration record from their PDS.
 * Missing record is treated as defaults (`allowIncoming: "all"`,
 * `allowGroupInvites: "all"`). The declaration record lives in the user's
 * own repo (not on the chat service), so we use the main PDS agent here.
 */
export function useChatDeclaration() {
  const agent = getAgent();
  const did = agent.session?.did;
  return useQuery({
    queryKey: ["chatDeclaration", did],
    queryFn: async (): Promise<{
      allowIncoming: AllowInvitesPref;
      allowGroupInvites: AllowInvitesPref;
    }> => {
      try {
        const res = await agent.com.atproto.repo.getRecord({
          repo: did!,
          collection: DECLARATION_COLLECTION,
          rkey: DECLARATION_RKEY,
        });
        const value = res.data.value as ChatBskyActorDeclaration.Record;
        return {
          allowIncoming: normalizeAllowInvitesPref(value.allowIncoming),
          allowGroupInvites: normalizeAllowInvitesPref(value.allowGroupInvites),
        };
      } catch (err) {
        if (err instanceof Error && /RecordNotFound|Could not locate/i.test(err.message)) {
          return { allowIncoming: "all", allowGroupInvites: "all" };
        }
        throw err;
      }
    },
    enabled: !!did,
    staleTime: 60_000,
  });
}

export function useUpdateAllowGroupInvites() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (allowGroupInvites: AllowInvitesPref) => {
      const agent = getAgent();
      const repo = agent.session!.did;

      let existing: ChatBskyActorDeclaration.Record | null = null;
      try {
        const res = await agent.com.atproto.repo.getRecord({
          repo,
          collection: DECLARATION_COLLECTION,
          rkey: DECLARATION_RKEY,
        });
        existing = res.data.value as ChatBskyActorDeclaration.Record;
      } catch (err) {
        if (!(err instanceof Error && /RecordNotFound|Could not locate/i.test(err.message))) {
          throw err;
        }
      }

      const next: ChatBskyActorDeclaration.Record = {
        ...(existing ?? {}),
        $type: DECLARATION_COLLECTION,
        allowIncoming: normalizeAllowInvitesPref(existing?.allowIncoming),
        allowGroupInvites,
      };

      await agent.com.atproto.repo.putRecord({
        repo,
        collection: DECLARATION_COLLECTION,
        rkey: DECLARATION_RKEY,
        record: next,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatDeclaration"] });
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
