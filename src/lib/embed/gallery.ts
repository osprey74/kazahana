import type { AppBskyEmbedImages, AppBskyEmbedGallery } from "@atproto/api";
import { AppBskyEmbedGallery as Gallery } from "@atproto/api";

export const GALLERY_VIEW_TYPE = "app.bsky.embed.gallery#view";
export const GALLERY_RECORD_TYPE = "app.bsky.embed.gallery";

// social-app enforces this as the authoring UI soft limit (PR #10707).
// lexicon schema allows up to 20 for future-proofing.
export const MAX_GALLERY_ITEMS_CLIENT = 10;
export const MAX_GALLERY_ITEMS_SCHEMA = 20;

// >this → carousel layout, ≤this → grid layout (matches social-app PR #10707).
export const CAROUSEL_THRESHOLD = 4;

export interface MediaImage {
  thumb: string;
  fullsize: string;
  alt: string;
  aspectRatio?: { width: number; height: number };
}

function fromImagesView(view: AppBskyEmbedImages.View): MediaImage[] {
  return view.images.map((img) => ({
    thumb: img.thumb,
    fullsize: img.fullsize,
    alt: img.alt,
    aspectRatio: img.aspectRatio,
  }));
}

function fromGalleryView(view: AppBskyEmbedGallery.View): MediaImage[] {
  const out: MediaImage[] = [];
  for (const item of view.items) {
    if (Gallery.isViewImage(item)) {
      out.push({
        thumb: item.thumbnail,
        fullsize: item.fullsize,
        alt: item.alt,
        aspectRatio: item.aspectRatio,
      });
    }
  }
  return out;
}

export function extractImagesFromEmbed(embed: unknown): MediaImage[] {
  if (!embed || typeof embed !== "object") return [];
  const $type = (embed as { $type?: string }).$type;
  if ($type === "app.bsky.embed.images#view") {
    return fromImagesView(embed as AppBskyEmbedImages.View);
  }
  if ($type === GALLERY_VIEW_TYPE) {
    return fromGalleryView(embed as AppBskyEmbedGallery.View);
  }
  if ($type === "app.bsky.embed.recordWithMedia#view") {
    return extractImagesFromEmbed((embed as { media?: unknown }).media);
  }
  return [];
}

export function extractImagesFromQuoteEmbeds(embeds?: unknown[]): MediaImage[] {
  if (!embeds) return [];
  for (const e of embeds) {
    const result = extractImagesFromEmbed(e);
    if (result.length > 0) return result;
  }
  return [];
}
