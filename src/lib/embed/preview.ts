import type { AppBskyEmbedExternal, ComAtprotoRepoStrongRef } from "@atproto/api";
import { getAgent } from "../agent";
import { fetchOgp } from "../ogp";

export interface ExternalPreview {
  external: AppBskyEmbedExternal.ViewExternal;
  associatedRefs: ComAtprotoRepoStrongRef.Main[];
}

export async function fetchExternalPreview(url: string): Promise<ExternalPreview | null> {
  try {
    const agent = getAgent();
    const res = await agent.app.bsky.embed.getEmbedExternalView({ url, uris: [] });
    const external = res.data.view?.external;
    if (external && external.title) {
      return {
        external,
        associatedRefs: res.data.associatedRefs ?? [],
      };
    }
  } catch {
    // fall through to OGP
  }

  const ogp = await fetchOgp(url);
  if (!ogp) return null;
  return {
    external: {
      uri: ogp.url,
      title: ogp.title,
      description: ogp.description,
      thumb: ogp.imageUrl,
    },
    associatedRefs: [],
  };
}
