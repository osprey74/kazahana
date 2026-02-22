import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RichText } from "@atproto/api";
import { fetch } from "@tauri-apps/plugin-http";
import { getAgent } from "../lib/agent";

interface CreatePostParams {
  text: string;
  images?: { data: Uint8Array; mimeType: string; alt: string }[];
  external?: {
    uri: string;
    title: string;
    description: string;
    thumbUrl?: string;
  };
  replyTo?: {
    uri: string;
    cid: string;
    root?: { uri: string; cid: string };
  };
  threadgate?: "everyone" | "mention" | "follower" | "following" | "nobody";
  postgate?: { disableQuote: boolean };
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postUri: string) => {
      const agent = getAgent();
      await agent.deletePost(postUri);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
      queryClient.invalidateQueries({ queryKey: ["authorFeed"] });
      queryClient.invalidateQueries({ queryKey: ["actorLikes"] });
      queryClient.invalidateQueries({ queryKey: ["authorMediaFeed"] });
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ text, images, external, replyTo, threadgate, postgate }: CreatePostParams) => {
      const agent = getAgent();

      // Build rich text with facets
      const rt = new RichText({ text });
      await rt.detectFacets(agent);

      // Upload images if any
      const imageEmbeds: { alt: string; image: unknown }[] = [];
      if (images && images.length > 0) {
        for (const img of images) {
          const res = await agent.uploadBlob(img.data, {
            encoding: img.mimeType,
          });
          imageEmbeds.push({
            alt: img.alt,
            image: res.data.blob,
          });
        }
      }

      // Build post record
      const record: Record<string, unknown> = {
        $type: "app.bsky.feed.post",
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
      };

      if (imageEmbeds.length > 0) {
        record.embed = {
          $type: "app.bsky.embed.images",
          images: imageEmbeds,
        };
      } else if (external) {
        // Download and upload thumbnail if available
        let thumb: unknown = undefined;
        if (external.thumbUrl) {
          try {
            const imgRes = await fetch(external.thumbUrl, {
              method: "GET",
              connectTimeout: 8000,
            });
            if (imgRes.ok) {
              const blob = await imgRes.blob();
              const buf = new Uint8Array(await blob.arrayBuffer());
              const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
              const uploaded = await agent.uploadBlob(buf, { encoding: mimeType });
              thumb = uploaded.data.blob;
            }
          } catch {
            // Proceed without thumbnail
          }
        }
        record.embed = {
          $type: "app.bsky.embed.external",
          external: {
            uri: external.uri,
            title: external.title,
            description: external.description,
            ...(thumb ? { thumb } : {}),
          },
        };
      }

      if (replyTo) {
        record.reply = {
          root: replyTo.root ?? { uri: replyTo.uri, cid: replyTo.cid },
          parent: { uri: replyTo.uri, cid: replyTo.cid },
        };
      }

      const postResult = await agent.post(record as Parameters<typeof agent.post>[0]);

      // Extract rkey from post URI for threadgate/postgate (must match post rkey)
      const postRkey = postResult.uri.split("/").pop()!;
      const did = agent.session?.did;

      // Create threadgate if not "everyone"
      if (did && threadgate && threadgate !== "everyone") {
        const allowRules: Record<string, string>[] = [];
        if (threadgate === "mention") {
          allowRules.push({ $type: "app.bsky.feed.threadgate#mentionRule" });
        } else if (threadgate === "follower") {
          allowRules.push({ $type: "app.bsky.feed.threadgate#followerRule" });
        } else if (threadgate === "following") {
          allowRules.push({ $type: "app.bsky.feed.threadgate#followingRule" });
        }
        // "nobody" → empty allow array
        await agent.app.bsky.feed.threadgate.create(
          { repo: did, rkey: postRkey },
          { post: postResult.uri, allow: allowRules, createdAt: new Date().toISOString() },
        );
      }

      // Create postgate if quoting is disabled
      if (did && postgate?.disableQuote) {
        await agent.app.bsky.feed.postgate.create(
          { repo: did, rkey: postRkey },
          { post: postResult.uri, embeddingRules: [{ $type: "app.bsky.feed.postgate#disableRule" }], createdAt: new Date().toISOString() },
        );
      }

      return postResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
    },
  });
}
