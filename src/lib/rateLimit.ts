/**
 * Rate limit (HTTP 429) detection and retry delay utilities.
 *
 * @atproto/xrpc throws XRPCError with `status: 429` and exposes
 * response headers via `headers` property, which may contain
 * `ratelimit-reset` (Unix epoch seconds) or `retry-after` (seconds).
 */

interface ErrorWithHeaders {
  status?: number;
  headers?: Record<string, string>;
}

/** Check if the error is a 429 rate limit response */
export function isRateLimitError(error: unknown): boolean {
  const err = error as ErrorWithHeaders & { error?: string; message?: string };
  if (err?.status === 429) return true;
  // Fallback: check error code or message string (for wrapped errors)
  if (err?.error === "RateLimitExceeded") return true;
  if (typeof err?.message === "string" && err.message.includes("Rate Limit")) return true;
  return false;
}

/**
 * Extract wait duration (ms) from rate limit response headers.
 *
 * Checks `ratelimit-reset` (Unix epoch) first, then `retry-after` (seconds).
 * Returns null if no valid header is found.
 */
export function getRateLimitDelay(error: unknown): number | null {
  const headers = (error as ErrorWithHeaders)?.headers;
  if (!headers) return null;

  // ratelimit-reset: Unix epoch timestamp (seconds)
  const resetEpoch = headers["ratelimit-reset"];
  if (resetEpoch) {
    const resetMs = Number(resetEpoch) * 1000;
    const delay = resetMs - Date.now();
    if (delay > 0 && delay < 600_000) return delay; // cap at 10 min
  }

  // retry-after: seconds to wait
  const retryAfter = headers["retry-after"];
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (seconds > 0 && seconds < 600) return seconds * 1000;
  }

  return null;
}
