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
