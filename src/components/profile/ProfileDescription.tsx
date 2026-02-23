import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RichText } from "@atproto/api";
import { openUrl } from "@tauri-apps/plugin-opener";
import { getAgent } from "../../lib/agent";
import { parseRichText } from "../../lib/richtext";

interface ProfileDescriptionProps {
  text: string;
}

export function ProfileDescription({ text }: ProfileDescriptionProps) {
  const navigate = useNavigate();
  const [facets, setFacets] = useState<RichText["facets"]>(undefined);

  useEffect(() => {
    let cancelled = false;
    const detect = async () => {
      const rt = new RichText({ text });
      await rt.detectFacets(getAgent());
      if (!cancelled) {
        setFacets(rt.facets);
      }
    };
    detect();
    return () => { cancelled = true; };
  }, [text]);

  const segments = parseRichText(text, facets);

  return (
    <p className="text-sm text-text-light dark:text-text-dark mt-2 whitespace-pre-wrap break-words">
      {segments.map((seg, i) => {
        if (seg.link) {
          return (
            <button
              key={i}
              onClick={() => openUrl(seg.link!.uri)}
              className="text-primary hover:underline"
            >
              {seg.text}
            </button>
          );
        }
        if (seg.mention) {
          return (
            <button
              key={i}
              onClick={() => navigate(`/profile/${seg.mention!.did}`)}
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
              onClick={() => navigate(`/search?q=${encodeURIComponent(`#${seg.tag!.tag}`)}`)}
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
