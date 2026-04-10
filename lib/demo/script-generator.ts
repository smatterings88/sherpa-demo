import OpenAI from "openai";
import { buildScenarioPrompt } from "./prompts";
import { parseDemoScriptJson } from "./audio";
import type { DemoScenario, ScriptLine } from "./types";

const MODEL = "gpt-4o-mini";

export async function generateScriptLines(
  apiKey: string,
  scenario: DemoScenario,
  dealSize: number,
  commission: number,
  pain: string,
): Promise<{ ok: true; lines: ScriptLine[] } | { ok: false; error: string }> {
  const client = new OpenAI({ apiKey });
  const userPrompt = buildScenarioPrompt(
    scenario,
    dealSize,
    commission,
    pain,
  );

  let content: string;
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You write realistic sales-call dialogue for audio demos. Output only valid JSON matching the user's schema. Never use markdown code fences. The lines array must have at most 10 objects; each text must be 200 characters or fewer.",
        },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
      max_tokens: 900,
    });
    content = completion.choices[0]?.message?.content ?? "";
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OpenAI request failed.";
    return { ok: false, error: msg };
  }

  if (!content) {
    return { ok: false, error: "Empty response from language model." };
  }

  return parseDemoScriptJson(content, scenario);
}
