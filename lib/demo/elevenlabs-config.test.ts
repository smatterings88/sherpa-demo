import { describe, expect, it } from "vitest";
import { sanitizeElevenLabsApiKey } from "./elevenlabs-config";

describe("sanitizeElevenLabsApiKey", () => {
  it("trims and strips inner whitespace", () => {
    expect(sanitizeElevenLabsApiKey("  abc def  ")).toBe("abcdef");
  });

  it("removes BOM and zero-width space", () => {
    const key = "\uFEFFsk_live_x\u200B";
    expect(sanitizeElevenLabsApiKey(key)).toBe("sk_live_x");
  });
});
