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
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ text, images, external, replyTo }: CreatePostParams) => {
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

      return agent.post(record as Parameters<typeof agent.post>[0]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
    },
  });
}
