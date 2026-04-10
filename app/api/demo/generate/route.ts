import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { bufferToBase64 } from "@/lib/demo/audio";
import { MAX_JSON_RESPONSE_BYTES } from "@/lib/demo/constants";
import { pickRandomPain, pickRandomScenario } from "@/lib/demo/scenarios";
import { generateScriptLines } from "@/lib/demo/script-generator";
import { synthesizeLineToMp3 } from "@/lib/demo/tts";
import type {
  AudioSegment,
  GenerateDemoErrorResponse,
  GenerateDemoSuccessResponse,
  RemoteAudioSegment,
} from "@/lib/demo/types";
import { sanitizeElevenLabsApiKey } from "@/lib/demo/elevenlabs-config";
import { validateDemoBody } from "@/lib/demo/validation";

export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(
  status: number,
  body: GenerateDemoErrorResponse,
): NextResponse {
  return NextResponse.json(body, { status });
}

/** Vercel may expose either name when Blob is linked to the project. */
function readBlobReadWriteToken(): string | undefined {
  return (
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN?.trim()
  );
}

function blobStorageConfigured(): boolean {
  return Boolean(readBlobReadWriteToken());
}

/**
 * Plain JSON only (no manual gzip). Vercel counts the serialized body against
 * the ~4.5MB limit; gzip at the edge does not change that cap for Functions.
 */
function jsonSuccessResponse(
  payload: GenerateDemoSuccessResponse,
): NextResponse {
  const body = JSON.stringify(payload);
  const bytes = Buffer.byteLength(body, "utf8");
  if (bytes > MAX_JSON_RESPONSE_BYTES) {
    return jsonError(503, {
      success: false,
      error:
        "Demo response is too large. In Vercel open Storage → Blob, create a store and connect it to this project (adds BLOB_READ_WRITE_TOKEN), then redeploy so audio is returned as URLs instead of embedded data.",
      code: "CONFIG",
    });
  }
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
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

async function handleGenerate(request: Request): Promise<NextResponse> {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const elevenKey = sanitizeElevenLabsApiKey(
    process.env.ELEVENLABS_API_KEY ?? "",
  );

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
    return jsonError(422, {
      success: false,
      error: scriptResult.error,
      code: "LLM",
    });
  }

  const annualLoss = commission * 24;
  const loss = { commission, dealSize, annualLoss };

  const storeBlob = blobStorageConfigured();
  const blobToken = readBlobReadWriteToken();
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
          ...(blobToken ? { token: blobToken } : {}),
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
    return jsonError(422, {
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
    return jsonSuccessResponse(payload);
  }

  const payload: GenerateDemoSuccessResponse = {
    success: true,
    scenario,
    pain,
    audioMode: "segments",
    segments,
    loss,
  };

  return jsonSuccessResponse(payload);
}
