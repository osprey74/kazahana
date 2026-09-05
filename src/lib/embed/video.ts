export const VIDEO_VIEW_TYPE = "app.bsky.embed.video#view";

export interface VideoEmbedView {
  playlist: string;
  thumbnail?: string;
  alt?: string;
  aspectRatio?: { width: number; height: number };
}

export function extractVideoFromEmbed(embed: unknown): VideoEmbedView | null {
  if (!embed || typeof embed !== "object") return null;
  const $type = (embed as { $type?: string }).$type;
  if ($type === VIDEO_VIEW_TYPE) {
    return embed as VideoEmbedView;
  }
  if ($type === "app.bsky.embed.recordWithMedia#view") {
    return extractVideoFromEmbed((embed as { media?: unknown }).media);
  }
  return null;
}

export function extractVideoFromQuoteEmbeds(embeds?: unknown[]): VideoEmbedView | null {
  if (!embeds) return null;
  for (const e of embeds) {
    const v = extractVideoFromEmbed(e);
    if (v) return v;
  }
  return null;
}
