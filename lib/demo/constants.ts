import type { DemoScenario } from "./types";

export const PAIN_OPTIONS: readonly string[] = [
  "losing deals right at the finish line",
  "having qualified prospects go cold after the call",
  "discounting deals you should have closed at full price",
  "watching buyers stall out when they were ready to move",
  "getting trapped in 'let me think about it' conversations",
  "spending weeks on deals that never convert",
  "having urgency disappear the second the call ends",
  "letting momentum die when the buyer was leaning in",
  "losing control of the conversation when price comes up",
  "watching commissions slip because you softened at the wrong moment",
] as const;

export const SCENARIOS: readonly DemoScenario[] = [
  "PRICE_OBJECTION",
  "SEND_ME_INFO",
  "COMPETITOR_OBJECTION",
] as const;

export const MAX_DEAL_SIZE = 1_000_000;
export const MAX_COMMISSION = 100_000;

/** Premade ElevenLabs voices; override via env for production. */
export const DEFAULT_ELEVENLABS_VOICES = {
  prospect: "21m00Tcm4TlvDq8ikWAM",
  rep: "pNInz6obpgDQGcFmaJgB",
  alex: "ErXwobaYiN019PkySv",
} as const;

/** Default model; override with ELEVENLABS_MODEL_ID (e.g. eleven_turbo_v2_5). */
export const ELEVENLABS_MODEL_ID_DEFAULT = "eleven_multilingual_v2";

/** Query param for ElevenLabs convert; smaller files avoid Vercel response limits. */
export const ELEVENLABS_OUTPUT_FORMAT = "mp3_22050_32" as const;

/** Fallback output formats if the primary is rejected for the account/model. */
export const ELEVENLABS_OUTPUT_FORMAT_FALLBACKS = [
  "mp3_44100_64",
  "mp3_44100_32",
] as const;

/** Hard caps keep TTS count and JSON payload under serverless limits. */
export const MAX_SCRIPT_LINES = 12;
export const MAX_LINE_CHARS = 240;

/** Reject uncompressed JSON larger than this before gzip (memory guard). */
export const MAX_JSON_UNCOMPRESSED_BYTES = 12_000_000;

/** Stay under ~4.5MB Vercel response limits (gzip wire size). */
export const MAX_GZIP_RESPONSE_BYTES = 3_800_000;

/** Pause between segment playback (ms); feels like breath between lines. */
export const SEGMENT_GAP_MS = 220;
