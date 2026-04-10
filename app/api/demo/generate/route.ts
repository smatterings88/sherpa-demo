import { randomUUID } from "crypto";
import { gzipSync } from "node:zlib";
import { bufferToBase64 } from "@/lib/demo/audio";
import {
  MAX_GZIP_RESPONSE_BYTES,
  MAX_JSON_UNCOMPRESSED_BYTES,
} from "@/lib/demo/constants";
import { pickRandomPain, pickRandomScenario } from "@/lib/demo/scenarios";
import { generateScriptLines } from "@/lib/demo/script-generator";
import { synthesizeLineToMp3 } from "@/lib/demo/tts";
import type {
  AudioSegment,
  GenerateDemoErrorResponse,
  GenerateDemoSuccessResponse,
  RemoteAudioSegment,
} from "@/lib/demo/types";
import { validateDemoBody } from "@/lib/demo/validation";

export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(
  status: number,
  body: GenerateDemoErrorResponse,
): Response {
  return Response.json(body, { status });
}

function blobStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/** Gzip shrinks base64-heavy JSON so it stays under Vercel response limits. */
function gzipSuccessResponse(payload: GenerateDemoSuccessResponse): Response {
  const raw = JSON.stringify(payload);
  const utf8 = Buffer.from(raw, "utf8");
  if (utf8.length > MAX_JSON_UNCOMPRESSED_BYTES) {
    return jsonError(502, {
      success: false,
      error:
        "Demo payload is too large. Add BLOB_READ_WRITE_TOKEN (Vercel Blob) and redeploy, or shorten the generated script.",
      code: "UNKNOWN",
    });
  }
  const gz = gzipSync(utf8, { level: 6 });
  if (gz.length > MAX_GZIP_RESPONSE_BYTES) {
    return jsonError(502, {
      success: false,
      error:
        "Compressed response still exceeds platform limits. Add BLOB_READ_WRITE_TOKEN in your Vercel project (Storage → Blob) and redeploy so audio is returned as URLs.",
      code: "UNKNOWN",
    });
  }
  return new Response(gz, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Encoding": "gzip",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    return await handleGenerate(request);
  } catch (e) {
    console.error("[demo/generate]", e);
    return jsonError(500, {
      success: false,
      error: "Unexpected error while building the demo.",
      code: "UNKNOWN",
    });
  }
}

async function handleGenerate(request: Request): Promise<Response> {
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

  const annualLoss = commission * 24;
  const loss = { commission, dealSize, annualLoss };

  const storeBlob = blobStorageConfigured();
  const segments: AudioSegment[] = [];
  const segmentUrls: RemoteAudioSegment[] = [];

  try {
    for (let i = 0; i < scriptResult.lines.length; i += 1) {
      const line = scriptResult.lines[i]!;
      const buf = await synthesizeLineToMp3(elevenKey, line.role, line.text);

      if (storeBlob) {
        const { put } = await import("@vercel/blob");
        const pathname = `demo-tts/${randomUUID()}-${i}.mp3`;
        const uploaded = await put(pathname, Buffer.from(buf), {
          access: "public",
          contentType: "audio/mpeg",
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        segmentUrls.push({
          role: line.role,
          mimeType: "audio/mpeg",
          url: uploaded.url,
        });
      } else {
        segments.push({
          role: line.role,
          mimeType: "audio/mpeg",
          base64: bufferToBase64(buf),
        });
      }
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

  if (storeBlob) {
    const payload: GenerateDemoSuccessResponse = {
      success: true,
      scenario,
      pain,
      audioMode: "segment_urls",
      segmentUrls,
      loss,
    };
    return gzipSuccessResponse(payload);
  }

  const payload: GenerateDemoSuccessResponse = {
    success: true,
    scenario,
    pain,
    audioMode: "segments",
    segments,
    loss,
  };

  return gzipSuccessResponse(payload);
}
