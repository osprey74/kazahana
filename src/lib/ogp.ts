import { fetch } from "@tauri-apps/plugin-http";

export interface OgpData {
  url: string;
  title: string;
  description: string;
  imageUrl?: string;
}

/**
 * Extract the last URL from text.
 */
export function extractUrl(text: string): string | null {
  const urlRegex = /https?:\/\/[^\s\u3000]+/g;
  const matches = text.match(urlRegex);
  return matches ? matches[matches.length - 1] : null;
}

/**
 * Fetch OGP metadata from a URL using Tauri HTTP plugin (no CORS).
 */
export async function fetchOgp(url: string): Promise<OgpData | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; kazahana/0.1)",
        Accept: "text/html",
      },
      connectTimeout: 8000,
    });

    if (!res.ok) return null;

    const html = await res.text();
    return parseOgp(url, html);
  } catch {
    return null;
  }
}

function parseOgp(url: string, html: string): OgpData | null {
  const getMetaContent = (property: string): string | undefined => {
    // Match <meta property="og:..." content="..."> or <meta name="..." content="...">
    const regex = new RegExp(
      `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
      "i",
    );
    const match = html.match(regex);
    return match ? (match[1] ?? match[2]) : undefined;
  };

  const ogTitle = getMetaContent("og:title");
  const ogDescription = getMetaContent("og:description");
  const ogImage = getMetaContent("og:image");

  // Fallback to <title> tag
  const title = ogTitle ?? html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
  const description = ogDescription ?? getMetaContent("description");

  if (!title && !description) return null;

  // Resolve relative image URL
  let imageUrl = ogImage;
  if (imageUrl && !imageUrl.startsWith("http")) {
    try {
      imageUrl = new URL(imageUrl, url).href;
    } catch {
      imageUrl = undefined;
    }
  }

  return {
    url,
    title: decodeHtmlEntities(title ?? ""),
    description: decodeHtmlEntities(description ?? ""),
    imageUrl,
  };
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) =>
      String.fromCodePoint(parseInt(dec, 10)),
    );
}
