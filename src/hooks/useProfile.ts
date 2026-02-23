import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAgent } from "../lib/agent";

export function useProfile(handle: string) {
  return useQuery({
    queryKey: ["profile", handle],
    queryFn: async () => {
      const agent = getAgent();
      const res = await agent.getProfile({ actor: handle });
      return res.data;
    },
    enabled: !!handle,
    staleTime: 30_000,
  });
}

export function useAuthorFeed(handle: string) {
  return useInfiniteQuery({
    queryKey: ["authorFeed", handle],
    queryFn: async ({ pageParam }) => {
      const agent = getAgent();
      const res = await agent.getAuthorFeed({
        actor: handle,
        limit: 50,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: !!handle,
    staleTime: 30_000,
  });
}

export function useActorLikes(handle: string) {
  return useInfiniteQuery({
    queryKey: ["actorLikes", handle],
    queryFn: async ({ pageParam }) => {
      const agent = getAgent();
      const res = await agent.getActorLikes({
        actor: handle,
        limit: 50,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: !!handle,
    staleTime: 30_000,
  });
}

export function useAuthorMediaFeed(handle: string) {
  return useInfiniteQuery({
    queryKey: ["authorMediaFeed", handle],
    queryFn: async ({ pageParam }) => {
      const agent = getAgent();
      const res = await agent.getAuthorFeed({
        actor: handle,
        limit: 50,
        cursor: pageParam as string | undefined,
        filter: "posts_with_media",
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: !!handle,
    staleTime: 30_000,
  });
}

export function useFollowers(handle: string) {
  return useInfiniteQuery({
    queryKey: ["followers", handle],
    queryFn: async ({ pageParam }) => {
      const agent = getAgent();
      const res = await agent.getFollowers({
        actor: handle,
        limit: 20,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: !!handle,
    staleTime: 30_000,
  });
}

export function useFollowing(handle: string) {
  return useInfiniteQuery({
    queryKey: ["following", handle],
    queryFn: async ({ pageParam }) => {
      const agent = getAgent();
      const res = await agent.getFollows({
        actor: handle,
        limit: 20,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: !!handle,
    staleTime: 30_000,
  });
}

export function useBookmarks(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["bookmarks"],
    queryFn: async ({ pageParam }) => {
      const agent = getAgent();
      const res = await agent.app.bsky.bookmark.getBookmarks({
        limit: 50,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled,
    staleTime: 30_000,
  });
}

export function useActorStarterPacks(handle: string) {
  return useInfiniteQuery({
    queryKey: ["actorStarterPacks", handle],
    queryFn: async ({ pageParam }) => {
      const agent = getAgent();
      const res = await agent.app.bsky.graph.getActorStarterPacks({
        actor: handle,
        limit: 20,
        cursor: pageParam as string | undefined,
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: !!handle,
    staleTime: 30_000,
  });
}

export function useStarterPack(uri: string) {
  return useQuery({
    queryKey: ["starterPack", uri],
    queryFn: async () => {
      const agent = getAgent();
      const res = await agent.app.bsky.graph.getStarterPack({
        starterPack: uri,
      });
      return res.data;
    },
    enabled: !!uri,
    staleTime: 30_000,
  });
}

export function useMuteActor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ did }: { did: string }) => {
      const agent = getAgent();
      await agent.mute(did);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUnmuteActor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ did }: { did: string }) => {
      const agent = getAgent();
      await agent.unmute(did);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useBlockActor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ did }: { did: string }) => {
      const agent = getAgent();
      const res = await agent.app.bsky.graph.block.create(
        { repo: agent.session!.did },
        { subject: did, createdAt: new Date().toISOString() },
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
    },
  });
}

export function useUnblockActor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ blockUri }: { blockUri: string }) => {
      const agent = getAgent();
      const rkey = blockUri.split("/").pop()!;
      await agent.app.bsky.graph.block.delete({
        repo: agent.session!.did,
        rkey,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useListMemberships(targetDid: string) {
  return useQuery({
    queryKey: ["listMemberships", targetDid],
    queryFn: async () => {
      const agent = getAgent();
      const records: Array<{ uri: string; value: { list: string; subject: string } }> = [];
      let cursor: string | undefined;
      do {
        const res = await agent.com.atproto.repo.listRecords({
          repo: agent.session!.did,
          collection: "app.bsky.graph.listitem",
          limit: 100,
          cursor,
        });
        for (const r of res.data.records) {
          const val = r.value as { list?: string; subject?: string };
          if (val.list && val.subject) {
            records.push({ uri: r.uri, value: { list: val.list, subject: val.subject } });
          }
        }
        cursor = res.data.cursor;
      } while (cursor);

      const memberships: Record<string, string> = {};
      for (const r of records) {
        if (r.value.subject === targetDid) {
          memberships[r.value.list] = r.uri;
        }
      }
      return memberships;
    },
    enabled: !!targetDid,
    staleTime: 10_000,
  });
}

export function useAddToList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ did, listUri }: { did: string; listUri: string }) => {
      const agent = getAgent();
      const res = await agent.com.atproto.repo.createRecord({
        repo: agent.session!.did,
        collection: "app.bsky.graph.listitem",
        record: {
          $type: "app.bsky.graph.listitem",
          subject: did,
          list: listUri,
          createdAt: new Date().toISOString(),
        },
      });
      return res.data;
    },
    onMutate: async ({ did, listUri }) => {
      await queryClient.cancelQueries({ queryKey: ["listMemberships", did] });
      const previous = queryClient.getQueryData<Record<string, string>>(["listMemberships", did]);
      queryClient.setQueryData<Record<string, string>>(["listMemberships", did], (old) => ({
        ...old,
        [listUri]: "__pending__",
      }));
      return { previous };
    },
    onError: (_err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["listMemberships", vars.did], context.previous);
      }
    },
    onSettled: (_, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ["listMemberships", vars.did] });
    },
  });
}

export function useRemoveFromList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ did, itemUri }: { did: string; itemUri: string }) => {
      const agent = getAgent();
      const rkey = itemUri.split("/").pop()!;
      await agent.com.atproto.repo.deleteRecord({
        repo: agent.session!.did,
        collection: "app.bsky.graph.listitem",
        rkey,
      });
    },
    onMutate: async ({ did, itemUri }) => {
      await queryClient.cancelQueries({ queryKey: ["listMemberships", did] });
      const previous = queryClient.getQueryData<Record<string, string>>(["listMemberships", did]);
      queryClient.setQueryData<Record<string, string>>(["listMemberships", did], (old) => {
        if (!old) return old;
        const next = { ...old };
        for (const [listUri, uri] of Object.entries(next)) {
          if (uri === itemUri) {
            delete next[listUri];
            break;
          }
        }
        return next;
      });
      return { previous };
    },
    onError: (_err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["listMemberships", vars.did], context.previous);
      }
    },
    onSettled: (_, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ["listMemberships", vars.did] });
    },
  });
}

export function useFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ did }: { did: string }) => {
      const agent = getAgent();
      return agent.follow(did);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
    },
  });
}

export function useUnfollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ followUri }: { followUri: string }) => {
      const agent = getAgent();
      return agent.deleteFollow(followUri);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
    },
  });
}
