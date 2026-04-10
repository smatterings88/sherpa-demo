import { bufferToBase64 } from "@/lib/demo/audio";
import { pickRandomPain, pickRandomScenario } from "@/lib/demo/scenarios";
import { generateScriptLines } from "@/lib/demo/script-generator";
import { synthesizeLineToMp3 } from "@/lib/demo/tts";
import type {
  AudioSegment,
  GenerateDemoErrorResponse,
  GenerateDemoSuccessResponse,
} from "@/lib/demo/types";
import { validateDemoBody } from "@/lib/demo/validation";

export const maxDuration = 60;

function jsonError(
  status: number,
  body: GenerateDemoErrorResponse,
): Response {
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const elevenKey = process.env.ELEVENLABS_API_KEY?.trim();

  if (!openaiKey) {
    return jsonError(503, {
      success: false,
      error: "Demo generation is not configured (missing OpenAI key).",
      code: "CONFIG",
    });
  }
  if (!elevenKey) {
    return jsonError(503, {
      success: false,
      error: "Demo generation is not configured (missing ElevenLabs key).",
      code: "CONFIG",
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, {
      success: false,
      error: "Invalid JSON body.",
      code: "VALIDATION",
    });
  }

  const validated = validateDemoBody(body);
  if (!validated.ok) {
    return jsonError(400, {
      success: false,
      error: validated.error,
      code: "VALIDATION",
    });
  }

  const { dealSize, commission } = validated.value;
  const scenario = pickRandomScenario();
  const pain = pickRandomPain();

  const scriptResult = await generateScriptLines(
    openaiKey,
    scenario,
    dealSize,
    commission,
    pain,
  );

  if (!scriptResult.ok) {
    return jsonError(502, {
      success: false,
      error: scriptResult.error,
      code: "LLM",
    });
  }

  const segments: AudioSegment[] = [];
  try {
    for (const line of scriptResult.lines) {
      const buf = await synthesizeLineToMp3(elevenKey, line.role, line.text);
      segments.push({
        role: line.role,
        mimeType: "audio/mpeg",
        base64: bufferToBase64(buf),
      });
    }
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Text-to-speech request failed.";
    return jsonError(502, {
      success: false,
      error: msg,
      code: "TTS",
    });
  }

  const annualLoss = commission * 24;

  const payload: GenerateDemoSuccessResponse = {
    success: true,
    scenario,
    pain,
    lines: scriptResult.lines,
    audioMode: "segments",
    segments,
    loss: {
      commission,
      dealSize,
      annualLoss,
    },
  };

  return Response.json(payload);
}
