/**
 * ElevenLabs keys are a single token; Vercel/env paste often adds whitespace,
 * BOM, or zero-width characters that break auth while the "same" key works in curl.
 */
export function sanitizeElevenLabsApiKey(raw: string): string {
  return raw
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/\s+/g, "");
}

/** Global default; EU/enterprise residency may need https://api.eu.residency.elevenlabs.io */
export function elevenLabsApiBaseUrl(): string {
  const raw = process.env.ELEVENLABS_API_BASE_URL?.trim();
  if (!raw) return "https://api.elevenlabs.io";
  return raw.replace(/\/$/, "");
}
