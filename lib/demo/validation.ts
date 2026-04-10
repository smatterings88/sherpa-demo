import { MAX_COMMISSION, MAX_DEAL_SIZE } from "./constants";

const CURRENCY_STRIP = /[$,\s]/g;

export function stripNumericInput(raw: string): string {
  return raw.replace(CURRENCY_STRIP, "").trim();
}

export function parsePositiveNumber(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw <= 0) return null;
    return raw;
  }
  if (typeof raw !== "string") return null;
  const s = stripNumericInput(raw);
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export interface ValidatedDemoInput {
  dealSize: number;
  commission: number;
}

export type ValidateDemoBodyResult =
  | { ok: true; value: ValidatedDemoInput }
  | { ok: false; error: string };

export function validateDemoBody(body: unknown): ValidateDemoBodyResult {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." };
  }
  const o = body as Record<string, unknown>;
  const dealSize = parsePositiveNumber(o.dealSize);
  const commission = parsePositiveNumber(o.commission);
  if (dealSize === null) {
    return {
      ok: false,
      error: "Average deal size must be a positive number.",
    };
  }
  if (commission === null) {
    return {
      ok: false,
      error: "Commission must be a positive number.",
    };
  }
  if (dealSize > MAX_DEAL_SIZE) {
    return {
      ok: false,
      error: `Average deal size must be at most ${MAX_DEAL_SIZE.toLocaleString("en-US")}.`,
    };
  }
  if (commission > MAX_COMMISSION) {
    return {
      ok: false,
      error: `Commission must be at most ${MAX_COMMISSION.toLocaleString("en-US")}.`,
    };
  }
  return { ok: true, value: { dealSize, commission } };
}
