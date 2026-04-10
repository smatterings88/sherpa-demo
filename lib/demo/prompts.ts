import type { DemoScenario } from "./types";
import { formatUsd } from "./currency";

const JSON_SCHEMA_INSTRUCTION = `
Return ONLY valid JSON (no markdown, no commentary) with exactly this shape:
{
  "scenario": "PRICE_OBJECTION" | "SEND_ME_INFO" | "COMPETITOR_OBJECTION",
  "lines": [
    { "role": "narrator", "text": "string" },
    { "role": "prospect" | "rep_bad" | "alex" | "rep_good" | "narrator", "text": "string" }
  ]
}

Allowed roles: narrator, prospect, rep_bad, alex, rep_good.
The "scenario" field must match the scenario you were given.

Style rules (enforce strictly):
- Real conversation; slightly messy, natural, believable; short lines.
- High-stakes but subtle. No hype, no sales-guru language, no corporate jargon, no long explanations.
- Alex only speaks 1–2 short sentences total across the whole script (single alex line with 1–2 sentences is OK).
- Total spoken length about 30–45 seconds when read aloud.
- The listener should think "I've done that."

Structure the lines array to tell the story in order: opening narrator beat, failure exchange, alex intervention, corrected exchange, closing narrator line as specified per scenario.
`.trim();

function priceObjectionPrompt(
  dealSize: number,
  commission: number,
  pain: string,
): string {
  const ds = formatUsd(dealSize);
  const cm = formatUsd(commission);
  return `
You are writing a short, emotionally accurate, high-stakes sales call moment for a voice-AI demo.

This must sound like a REAL sales conversation.
Not polished. Not theatrical. Not "sales training content."
It should feel like an actual moment where a rep loses control, then gets corrected.

CONTEXT:
- Deal size: ${ds}
- Commission earned on a closed deal: ${cm}
- Scenario: price objection
- Prospect pain/theme: ${pain}

GOAL:
Create a 3-part audio demo that makes the listener feel:
1. "I've done that."
2. "That just cost me real money."
3. "I need the fix."

STRICT STRUCTURE:
PART 1 — FAILURE MOMENT
- Prospect asks the price
- Rep answers weakly
- Rep slightly flinches, softens, over-explains, or tries to reduce tension
- Prospect loses confidence and starts to exit
- Keep this short and natural

PART 2 — ALEX INTERVENTION
- 1–2 sentences only
- Calm, surgical, direct
- No theory
- No motivation
- No "what you want to do here is..."
- It should feel like a quiet in-ear correction in the exact moment the rep slipped

PART 3 — REPLAY / CORRECTED MOMENT
- Same moment starts again
- Rep answers clearly and calmly
- Rep uses this framing naturally (adapt wording slightly if needed for flow, keep the numbers exact):
  "It's ${ds}… and whether that feels expensive depends on what it's costing you to ${pain}."
- Prospect re-engages
- Rep regains control without sounding pushy

${JSON_SCHEMA_INSTRUCTION}
`.trim();
}

function sendMeInfoPrompt(
  dealSize: number,
  commission: number,
  pain: string,
): string {
  const ds = formatUsd(dealSize);
  const cm = formatUsd(commission);
  return `
You are writing a short, emotionally accurate, high-stakes sales call moment for a voice-AI demo.

This must sound like a REAL sales conversation.
Not polished. Not theatrical. Not "sales training content."
It should feel like an actual moment where a deal quietly dies.

CONTEXT:
- Deal size: ${ds}
- Commission earned on a closed deal: ${cm}
- Scenario: prospect says "just send me some information"
- Prospect pain/theme: ${pain}

GOAL:
Create a 3-part audio demo that makes the listener feel:
1. "I do this all the time."
2. "That just killed the deal."
3. "I need that fix immediately."

STRICT STRUCTURE:
PART 1 — FAILURE MOMENT
- Conversation is going reasonably well
- Prospect says some version of: "This sounds good… can you just send me something?"
- Rep feels subtle relief
- Rep agrees too quickly
- Rep loses control of the sale
- Prospect disengages politely

PART 2 — ALEX INTERVENTION
- 1–2 sentences only
- Calm, surgical, direct
- No theory, no explanation
- Must reframe immediately
- Must redirect away from sending info and back into a controlled next step or decision

PART 3 — REPLAY / CORRECTED MOMENT
- Same setup
- Prospect asks for info again
- Rep does NOT agree immediately
- Rep acknowledges but redirects
- Rep regains control
- Prospect re-engages meaningfully

${JSON_SCHEMA_INSTRUCTION}
`.trim();
}

function competitorObjectionPrompt(
  dealSize: number,
  commission: number,
  pain: string,
): string {
  const ds = formatUsd(dealSize);
  const cm = formatUsd(commission);
  return `
You are writing a short, emotionally accurate, high-stakes sales call moment for a voice-AI demo.

This must sound like a REAL sales conversation.
Not polished. Not theatrical. Not "sales training content."
It should feel like a moment where the rep loses authority and becomes forgettable.

CONTEXT:
- Deal size: ${ds}
- Commission earned on a closed deal: ${cm}
- Scenario: prospect asks "why you over [competitor]?"
- Prospect pain/theme: ${pain}

GOAL:
Create a 3-part audio demo that makes the listener feel:
1. "I've said something like that before."
2. "That answer made me sound like everyone else."
3. "I need a better way to handle that immediately."

STRICT STRUCTURE:
PART 1 — FAILURE MOMENT
- Prospect asks a direct comparison question
- Rep gives a generic, safe answer
- Rep sounds slightly uncertain or overly agreeable
- Answer lacks conviction and differentiation
- Prospect loses interest subtly

PART 2 — ALEX INTERVENTION
- 1–2 sentences only
- Calm, surgical, direct
- No theory
- Must shift the rep away from generic comparison
- Must reframe toward the prospect's actual problem

PART 3 — REPLAY / CORRECTED MOMENT
- Same question
- Rep does NOT compare features
- Rep reframes around the prospect's situation
- Prospect leans in or asks a follow-up
- Rep regains authority

${JSON_SCHEMA_INSTRUCTION}
`.trim();
}

export function buildScenarioPrompt(
  scenario: DemoScenario,
  dealSize: number,
  commission: number,
  pain: string,
): string {
  switch (scenario) {
    case "PRICE_OBJECTION":
      return priceObjectionPrompt(dealSize, commission, pain);
    case "SEND_ME_INFO":
      return sendMeInfoPrompt(dealSize, commission, pain);
    case "COMPETITOR_OBJECTION":
      return competitorObjectionPrompt(dealSize, commission, pain);
    default: {
      const _exhaustive: never = scenario;
      return _exhaustive;
    }
  }
}
