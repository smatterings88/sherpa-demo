import {
  DEFAULT_ELEVENLABS_VOICES,
  ELEVENLABS_MODEL_ID,
  ELEVENLABS_OUTPUT_FORMAT,
} from "./constants";
import type { ScriptLineRole } from "./types";

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
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

export async function synthesizeLineToMp3(
  apiKey: string,
  role: ScriptLineRole,
  text: string,
): Promise<ArrayBuffer> {
  const { voiceId, settings } = roleToVoiceAndSettings(role);
  const url = new URL(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  );
  url.searchParams.set("output_format", ELEVENLABS_OUTPUT_FORMAT);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL_ID,
      voice_settings: settings,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `ElevenLabs error ${res.status}: ${errText.slice(0, 200) || res.statusText}`,
    );
  }

  return res.arrayBuffer();
}
