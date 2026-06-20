import { RichText } from "@atproto/api";

export interface RichTextSegment {
  text: string;
  link?: { uri: string };
  mention?: { did: string };
  tag?: { tag: string };
}

export function parseRichText(
  text: string,
  facets?: RichText["facets"],
): RichTextSegment[] {
  const rt = new RichText({ text, facets });
  const segments: RichTextSegment[] = [];

  for (const segment of rt.segments()) {
    segments.push({
      text: segment.text,
      link: segment.link,
      mention: segment.mention,
      tag: segment.tag,
    });
  }

  return segments;
}

/**
 * Strip mention facets whose DID failed to resolve (empty string).
 * `RichText.detectFacets()` can produce these when the handle lookup
 * fails — sending such a facet causes the server to reject the record
 * with `Invalid DID (got "")`. Drop the offending feature, and drop
 * the whole facet if it has no features left, so the `@handle` text
 * falls back to plain text.
 */
export function sanitizeFacets(
  facets: RichText["facets"],
): RichText["facets"] {
  if (!facets) return facets;
  const cleaned = facets
    .map((facet) => {
      const features = facet.features.filter((feature) => {
        if (feature.$type === "app.bsky.richtext.facet#mention") {
          const did = (feature as { did?: unknown }).did;
          return typeof did === "string" && did.length > 0;
        }
        return true;
      });
      return { ...facet, features };
    })
    .filter((facet) => facet.features.length > 0);
  return cleaned;
}
