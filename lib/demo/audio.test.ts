import { describe, expect, it } from "vitest";
import { parseDemoScriptJson } from "./audio";

describe("parseDemoScriptJson", () => {
  it("parses valid scripts", () => {
    const raw = JSON.stringify({
      scenario: "PRICE_OBJECTION",
      lines: [
        { role: "narrator", text: "This is the moment you lost the deal." },
        { role: "prospect", text: "How much is it?" },
        { role: "rep_bad", text: "Well… it depends." },
      ],
    });
    const r = parseDemoScriptJson(raw, "PRICE_OBJECTION");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.lines).toHaveLength(3);
  });

  it("rejects scenario mismatch", () => {
    const raw = JSON.stringify({
      scenario: "SEND_ME_INFO",
      lines: [{ role: "narrator", text: "Hi" }],
    });
    const r = parseDemoScriptJson(raw, "PRICE_OBJECTION");
    expect(r.ok).toBe(false);
  });

  it("rejects too many lines", () => {
    const lines = Array.from({ length: 11 }, (_, i) => ({
      role: "narrator" as const,
      text: `Line ${i}`,
    }));
    const raw = JSON.stringify({ scenario: "PRICE_OBJECTION", lines });
    const r = parseDemoScriptJson(raw, "PRICE_OBJECTION");
    expect(r.ok).toBe(false);
  });
});
