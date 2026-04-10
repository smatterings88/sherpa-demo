import { describe, expect, it } from "vitest";
import { formatUsd } from "./currency";

describe("formatUsd", () => {
  it("formats whole dollars without cents", () => {
    expect(formatUsd(10000)).toBe("$10,000");
    expect(formatUsd(1000)).toBe("$1,000");
  });

  it("formats fractional amounts", () => {
    expect(formatUsd(10.5)).toBe("$10.50");
  });
});
