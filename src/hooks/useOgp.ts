import { useState, useCallback } from "react";
import { extractUrl, fetchOgp, type OgpData } from "../lib/ogp";

/**
 * Hook for manually fetching OGP metadata.
 * Detects the last URL in text and fetches on explicit trigger.
 */
export function useOgp(text: string) {
  const [ogp, setOgp] = useState<OgpData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const detectedUrl = extractUrl(text);

  const fetchCard = useCallback(async () => {
    if (!detectedUrl) return;
    setIsLoading(true);
    const data = await fetchOgp(detectedUrl);
    setOgp(data);
    setIsLoading(false);
  }, [detectedUrl]);

  const fetchCardForUrl = useCallback(async (url: string) => {
    setIsLoading(true);
    const data = await fetchOgp(url);
    setOgp(data);
    setIsLoading(false);
  }, []);

  const dismiss = useCallback(() => {
    setOgp(null);
  }, []);

  const reset = useCallback(() => {
    setOgp(null);
    setIsLoading(false);
  }, []);

  return {
    detectedUrl,
    ogp,
    isLoading,
    fetchCard,
    fetchCardForUrl,
    dismiss,
    reset,
  };
}
