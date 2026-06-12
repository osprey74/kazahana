import { parseJoinLinkUrl } from "../hooks/useJoinLink";

/**
 * Resolves a URL to an in-app route when it points to a Bluesky resource
 * that kazahana handles natively (currently: group chat invite links).
 * Returns the local pathname or null if the URL should be opened externally.
 */
export function resolveInAppRoute(url: string): string | null {
  const joinCode = parseJoinLinkUrl(url);
  if (joinCode) return `/chat/${joinCode}`;
  return null;
}
