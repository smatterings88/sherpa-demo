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

export const ELEVENLABS_MODEL_ID = "eleven_turbo_v2_5";

/** Pause between segment playback (ms); feels like breath between lines. */
export const SEGMENT_GAP_MS = 220;
