import type { AppBskyEmbedExternal, ComAtprotoRepoStrongRef } from "@atproto/api";
import { getAgent } from "../agent";
import { extractStandardSiteUris, fetchHtml, parseOgp } from "../ogp";

export interface ExternalPreview {
  external: AppBskyEmbedExternal.ViewExternal;
  associatedRefs: ComAtprotoRepoStrongRef.Main[];
}

export async function fetchExternalPreview(url: string): Promise<ExternalPreview | null> {
  const html = await fetchHtml(url);
  const uris = html ? extractStandardSiteUris(html) : [];

  if (uris.length > 0) {
    try {
      const agent = getAgent();
      const res = await agent.app.bsky.embed.getEmbedExternalView({ url, uris });
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
  }

  if (html) {
    const ogp = parseOgp(url, html);
    if (ogp) {
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
  }
  return null;
}
