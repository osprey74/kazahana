import type { AppBskyFeedDefs, AppBskyEmbedExternal } from "@atproto/api";

type PostView = AppBskyFeedDefs.PostView;
type ViewExternal = AppBskyEmbedExternal.ViewExternal;

export function getExternalEmbed(post?: PostView): ViewExternal | null {
  const embed = post?.embed;
  if (!embed) return null;
  if (embed.$type === "app.bsky.embed.external#view") {
    return (embed as { external?: ViewExternal }).external ?? null;
  }
  if (embed.$type === "app.bsky.embed.recordWithMedia#view") {
    const media = (embed as { media?: { $type?: string; external?: ViewExternal } }).media;
    if (media?.$type === "app.bsky.embed.external#view") {
      return media.external ?? null;
    }
  }
  return null;
}
