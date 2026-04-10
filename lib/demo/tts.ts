import {
  DEFAULT_ELEVENLABS_VOICES,
  ELEVENLABS_MODEL_ID_DEFAULT,
  ELEVENLABS_OUTPUT_FORMAT,
  ELEVENLABS_OUTPUT_FORMAT_FALLBACKS,
} from "./constants";
import { elevenLabsApiBaseUrl } from "./elevenlabs-config";
import type { ScriptLineRole } from "./types";

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
}

function resolveModelId(): string {
  return (
    process.env.ELEVENLABS_MODEL_ID?.trim() || ELEVENLABS_MODEL_ID_DEFAULT
  );
}

function resolveVoiceIds(): {
  prospect: string;
  rep: string;
  alex: string;
} {
  return {
    prospect:
      process.env.ELEVENLABS_VOICE_PROSPECT ??
      DEFAULT_ELEVENLABS_VOICES.prospect,
    rep: process.env.ELEVENLABS_VOICE_REP ?? DEFAULT_ELEVENLABS_VOICES.rep,
    alex: process.env.ELEVENLABS_VOICE_ALEX ?? DEFAULT_ELEVENLABS_VOICES.alex,
  };
}

function roleToVoiceAndSettings(role: ScriptLineRole): {
  voiceId: string;
  settings: VoiceSettings;
} {
  const v = resolveVoiceIds();
  switch (role) {
    case "narrator":
      return { voiceId: v.alex, settings: { stability: 0.72, similarity_boost: 0.78 } };
    case "prospect":
      return {
        voiceId: v.prospect,
        settings: { stability: 0.52, similarity_boost: 0.72 },
      };
    case "rep_bad":
      return {
        voiceId: v.rep,
        settings: { stability: 0.34, similarity_boost: 0.82 },
      };
    case "rep_good":
      return {
        voiceId: v.rep,
        settings: { stability: 0.64, similarity_boost: 0.78 },
      };
    case "alex":
      return {
        voiceId: v.alex,
        settings: { stability: 0.8, similarity_boost: 0.82 },
      };
    default: {
      const _e: never = role;
      return _e;
    }
  }
}

function formatElevenLabsApiError(status: number, bodyText: string): string {
  const trimmed = bodyText.slice(0, 800);
  try {
    const parsed = JSON.parse(bodyText) as {
      detail?: { message?: string; code?: string };
    };
    const d = parsed.detail;
    if (d && typeof d.message === "string") {
      if (
        status === 401 &&
        (d.code === "sign_in_required" ||
          /sign in/i.test(d.message))
      ) {
        return (
          "ElevenLabs returned sign_in_required for this request. " +
          "If curl works locally with the same key: re-paste ELEVENLABS_API_KEY in Vercel (Production vs Preview env), " +
          "or set ELEVENLABS_API_BASE_URL to your regional API host (e.g. https://api.eu.residency.elevenlabs.io for EU data residency). " +
          "Also sign in once at elevenlabs.io and create a fresh API key if the account was inactive."
        );
      }
      if (status === 401) {
        return (
          `ElevenLabs: ${d.message} ` +
          "(Check ELEVENLABS_API_KEY matches a current key from Profile → API key.)"
        );
      }
      return `ElevenLabs: ${d.message}`;
    }
  } catch {
    /* fall through */
  }
  return `ElevenLabs error ${status}: ${trimmed || "unknown"}`;
}

async function fetchElevenLabsTts(
  apiKey: string,
  voiceId: string,
  outputFormat: string | null,
  body: Record<string, unknown>,
): Promise<Response> {
  const base = elevenLabsApiBaseUrl();
  const url = new URL(`${base}/v1/text-to-speech/${voiceId}`);
  if (outputFormat) {
    url.searchParams.set("output_format", outputFormat);
  }
  return fetch(url.toString(), {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
      "User-Agent": "AlexTheSherpaDemo/1.0 (Next.js; voice TTS)",
    },
    body: JSON.stringify(body),
  });
}

export async function synthesizeLineToMp3(
  apiKey: string,
  role: ScriptLineRole,
  text: string,
): Promise<ArrayBuffer> {
  const { voiceId, settings } = roleToVoiceAndSettings(role);
  const model_id = resolveModelId();
  const payload = {
    text,
    model_id,
    voice_settings: settings,
  };

  const formatAttempts: (string | null)[] = [
    ELEVENLABS_OUTPUT_FORMAT,
    ...ELEVENLABS_OUTPUT_FORMAT_FALLBACKS,
    null,
  ];

  let lastDetail = "";
  let lastStatus = 400;

  for (const fmt of formatAttempts) {
    const res = await fetchElevenLabsTts(apiKey, voiceId, fmt, payload);
    if (res.ok) {
      return res.arrayBuffer();
    }
    lastStatus = res.status;
    lastDetail = (await res.text().catch(() => "")).slice(0, 800);
    const retryable = res.status === 400 || res.status === 422;
    if (!retryable) {
      throw new Error(formatElevenLabsApiError(res.status, lastDetail));
    }
  }

  throw new Error(
    formatElevenLabsApiError(
      lastStatus,
      lastDetail || "all output format attempts failed",
    ),
  );
}
