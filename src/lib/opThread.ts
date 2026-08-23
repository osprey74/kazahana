import type { AppBskyFeedDefs } from "@atproto/api";

/**
 * OP (original poster) thread numbering.
 *
 * The AppView tags feedViewPost entries that belong to a contiguous same-author
 * ("OP") thread with 1-based `opThreadPostIndex` / `opThreadPostCount`.
 *
 * NOTE (provisional field): as of @atproto/api 0.20.16 these fields are served
 * at runtime but are NOT present in the type definitions — the canonical lexicon
 * has not been updated and the AppView serves them behind the server-side
 * `CanonicalPostNumberingEnable` flag (see social-app PR #11472). This accessor
 * reads them via a local cast so the untyped access stays contained here; revisit
 * on the next @atproto/api upgrade in case the fields become officially typed.
 */
export interface OpThreadNumbering {
  index: number;
  count: number;
}

export function getOpThreadNumbering(
  feedItem: AppBskyFeedDefs.FeedViewPost,
): OpThreadNumbering | null {
  const { opThreadPostIndex, opThreadPostCount } = feedItem as {
    opThreadPostIndex?: number;
    opThreadPostCount?: number;
  };
  // Only surface numbering for real multi-post OP threads. Missing fields
  // (post is not part of an OP thread, or flag is off) yield null → no badge.
  if (
    typeof opThreadPostIndex !== "number" ||
    typeof opThreadPostCount !== "number" ||
    opThreadPostCount < 2 ||
    opThreadPostIndex < 1 ||
    opThreadPostIndex > opThreadPostCount
  ) {
    return null;
  }
  return { index: opThreadPostIndex, count: opThreadPostCount };
}
