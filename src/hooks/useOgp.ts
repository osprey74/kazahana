import { useState, useCallback } from "react";
import { extractUrl } from "../lib/ogp";
import { fetchExternalPreview, type ExternalPreview } from "../lib/embed/preview";

/**
 * Hook for manually fetching external link preview.
 * Tries app.bsky.embed.getEmbedExternalView first (Standard Site aware),
 * falls back to direct OGP fetch when the AppView has no view.
 */
export function useOgp(text: string) {
  const [preview, setPreview] = useState<ExternalPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const detectedUrl = extractUrl(text);

  const fetchCard = useCallback(async () => {
    if (!detectedUrl) return;
    setIsLoading(true);
    const data = await fetchExternalPreview(detectedUrl);
    setPreview(data);
    setIsLoading(false);
  }, [detectedUrl]);

  const fetchCardForUrl = useCallback(async (url: string) => {
    setIsLoading(true);
    const data = await fetchExternalPreview(url);
    setPreview(data);
    setIsLoading(false);
  }, []);

  const dismiss = useCallback(() => {
    setPreview(null);
  }, []);

  const reset = useCallback(() => {
    setPreview(null);
    setIsLoading(false);
  }, []);

  return {
    detectedUrl,
    preview,
    isLoading,
    fetchCard,
    fetchCardForUrl,
    dismiss,
    reset,
  };
}
