import { useQuery } from "@tanstack/react-query";
import { getAgent } from "../lib/agent";

/** Resolve a repost record URI to the original post URI */
async function resolveRepostUri(uri: string): Promise<string> {
  if (!uri.includes("/app.bsky.feed.repost/")) return uri;
  console.log("[useThread] Detected repost URI, resolving:", uri);
  const match = uri.match(/^at:\/\/([^/]+)\/app\.bsky\.feed\.repost\/(.+)$/);
  if (!match) {
    console.warn("[useThread] Repost URI regex did not match:", uri);
    return uri;
  }
  const agent = getAgent();
  try {
    const res = await agent.com.atproto.repo.getRecord({
      repo: match[1],
      collection: "app.bsky.feed.repost",
      rkey: match[2],
    });
    const subject = (res.data.value as { subject?: { uri?: string } })?.subject;
    if (subject?.uri) {
      console.log("[useThread] Resolved repost →", subject.uri);
      return subject.uri;
    }
    console.warn("[useThread] Repost record has no subject.uri:", res.data.value);
  } catch (err) {
    console.error("[useThread] Failed to resolve repost URI:", err);
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
