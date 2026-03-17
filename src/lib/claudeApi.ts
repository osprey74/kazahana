import { fetch } from "@tauri-apps/plugin-http";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

/**
 * Generate ALT text for an image using Claude API.
 */
export async function generateAltText(
  apiKey: string,
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif",
  lang: string,
): Promise<string> {
  const langInstruction = lang.startsWith("ja")
    ? "日本語で"
    : lang.startsWith("en")
      ? "in English"
      : `in the language with code "${lang}"`;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 },
            },
            {
              type: "text",
              text: `Describe this image concisely ${langInstruction} for use as ALT text on social media. Focus on the key visual elements. Do not include any prefix like "ALT:" — output only the description.`,
            },
          ],
        },
      ],
    }),
    connectTimeout: 30000,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Claude API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (typeof text !== "string" || text.length === 0) {
    throw new Error("Empty response from Claude API");
  }
  return text.trim();
}

/**
 * Convert a File to base64 string and detect media type.
 */
export async function fileToBase64(file: File): Promise<{ base64: string; mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" }> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Detect actual format from magic bytes
  let mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" = "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50) mediaType = "image/png";
  else if (bytes[0] === 0x47 && bytes[1] === 0x49) mediaType = "image/gif";
  else if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57 && bytes[9] === 0x45) mediaType = "image/webp";

  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return { base64, mediaType };
}
