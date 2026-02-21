import type { RichText } from "@atproto/api";
import { parseRichText } from "../../lib/richtext";

interface PostContentProps {
  text: string;
  facets?: RichText["facets"];
}

export function PostContent({ text, facets }: PostContentProps) {
  const segments = parseRichText(text, facets);

  return (
    <p className="text-sm text-text-light whitespace-pre-wrap break-words leading-relaxed">
      {segments.map((seg, i) => {
        if (seg.link) {
          return (
            <a
              key={i}
              href={seg.link.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {seg.text}
            </a>
          );
        }
        if (seg.mention) {
          return (
            <span key={i} className="text-primary hover:underline cursor-pointer">
              {seg.text}
            </span>
          );
        }
        if (seg.tag) {
          return (
            <span key={i} className="text-primary hover:underline cursor-pointer">
              {seg.text}
            </span>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </p>
  );
}
