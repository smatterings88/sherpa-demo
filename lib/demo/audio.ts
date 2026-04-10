import type { ScriptLine } from "./types";

export function bufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

const ROLES = new Set([
  "narrator",
  "prospect",
  "rep_bad",
  "alex",
  "rep_good",
]);

export function isScriptLineRole(
  r: unknown,
): r is ScriptLine["role"] {
  return typeof r === "string" && ROLES.has(r);
}

export function parseDemoScriptJson(
  raw: string,
  expectedScenario: import("./types").DemoScenario,
): { ok: true; lines: ScriptLine[] } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Model returned invalid JSON." };
  }
  if (parsed === null || typeof parsed !== "object") {
    return { ok: false, error: "Invalid script shape." };
  }
  const o = parsed as Record<string, unknown>;
  if (o.scenario !== expectedScenario) {
    return { ok: false, error: "Scenario mismatch in model output." };
  }
  if (!Array.isArray(o.lines)) {
    return { ok: false, error: "Missing or invalid lines array." };
  }
  const lines: ScriptLine[] = [];
  for (let i = 0; i < o.lines.length; i++) {
    const row = o.lines[i];
    if (row === null || typeof row !== "object") {
      return { ok: false, error: `Invalid line at index ${i}.` };
    }
    const lr = row as Record<string, unknown>;
    if (!isScriptLineRole(lr.role)) {
      return { ok: false, error: `Invalid role at line ${i}.` };
    }
    if (typeof lr.text !== "string" || lr.text.trim() === "") {
      return { ok: false, error: `Invalid text at line ${i}.` };
    }
    lines.push({ role: lr.role, text: lr.text.trim() });
  }
  if (lines.length < 3) {
    return { ok: false, error: "Script too short." };
  }
  return { ok: true, lines };
}
