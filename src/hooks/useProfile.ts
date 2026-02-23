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
