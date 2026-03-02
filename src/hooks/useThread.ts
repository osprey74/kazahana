import { useQuery } from "@tanstack/react-query";
import { getAgent } from "../lib/agent";

/** Resolve a repost record URI to the original post URI */
async function resolveRepostUri(uri: string): Promise<string> {
  if (!uri.includes("/app.bsky.feed.repost/")) return uri;
  const match = uri.match(/^at:\/\/([^/]+)\/app\.bsky\.feed\.repost\/(.+)$/);
  if (!match) return uri;
  const agent = getAgent();
  try {
    const res = await agent.com.atproto.repo.getRecord({
      repo: match[1],
      collection: "app.bsky.feed.repost",
      rkey: match[2],
    });
    const subject = (res.data.value as { subject?: { uri?: string } })?.subject;
    if (subject?.uri) return subject.uri;
  } catch {
    // Repost may have been deleted
  }
  return uri;
}

export function useThread(uri: string) {
  return useQuery({
    queryKey: ["thread", uri],
    queryFn: async () => {
      const agent = getAgent();
      const resolvedUri = await resolveRepostUri(uri);
      const res = await agent.getPostThread({ uri: resolvedUri, depth: 10, parentHeight: 80 });
      return res.data.thread;
    },
    enabled: !!uri,
    staleTime: 30_000,
  });
}
