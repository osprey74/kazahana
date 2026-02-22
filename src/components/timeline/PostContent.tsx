import { useNavigate } from "react-router-dom";
import type { RichText } from "@atproto/api";
import { parseRichText } from "../../lib/richtext";

interface PostContentProps {
  text: string;
  facets?: RichText["facets"];
}

export function PostContent({ text, facets }: PostContentProps) {
  const navigate = useNavigate();
  const segments = parseRichText(text, facets);

  return (
    <p className="text-sm text-text-light dark:text-text-dark whitespace-pre-wrap break-words leading-relaxed">
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
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${seg.mention!.did}`);
              }}
              className="text-primary hover:underline"
            >
              {seg.text}
            </button>
          );
        }
        if (seg.tag) {
          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/search?q=${encodeURIComponent(`#${seg.tag!.tag}`)}`);
              }}
              className="text-primary hover:underline"
            >
              {seg.text}
            </button>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </p>
  );
}
