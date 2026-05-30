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
  const urlRegex = /https?:\/\/[^\s　]+/g;
  const matches = text.match(urlRegex);
  return matches ? matches[matches.length - 1] : null;
}

/**
 * Fetch HTML body from a URL using Tauri HTTP plugin (no CORS).
 * Used by OGP parsing and Standard Site URI extraction.
 */
export async function fetchHtml(url: string): Promise<string | null> {
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
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Fetch OGP metadata from a URL. Convenience wrapper around fetchHtml + parseOgp.
 */
export async function fetchOgp(url: string): Promise<OgpData | null> {
  const html = await fetchHtml(url);
  if (!html) return null;
  return parseOgp(url, html);
}

/**
 * Extract Atmosphere AT-URIs from `<link rel="site.standard.*" href="at://...">` tags.
 * Used to populate the `uris` parameter of app.bsky.embed.getEmbedExternalView.
 */
export function extractStandardSiteUris(html: string): string[] {
  const uris = new Set<string>();
  const linkRegex = /<link\b[^>]*>/gi;
  for (const match of html.matchAll(linkRegex)) {
    const tag = match[0];
    if (!/rel=["']site\.standard\.[a-z]+["']/i.test(tag)) continue;
    const href = tag.match(/href=["'](at:\/\/[^"']+)["']/i);
    if (href) uris.add(href[1]);
  }
  return [...uris];
}

export function parseOgp(url: string, html: string): OgpData | null {
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
