import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RichText } from "@atproto/api";
import { getAgent } from "../lib/agent";

interface CreatePostParams {
  text: string;
  images?: { data: Uint8Array; mimeType: string }[];
  replyTo?: {
    uri: string;
    cid: string;
    root?: { uri: string; cid: string };
  };
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ text, images, replyTo }: CreatePostParams) => {
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
            alt: "",
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
