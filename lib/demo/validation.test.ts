import { describe, expect, it } from "vitest";
import {
  parsePositiveNumber,
  stripNumericInput,
  validateDemoBody,
} from "./validation";

describe("stripNumericInput", () => {
  it("removes currency symbols, commas, and spaces", () => {
    expect(stripNumericInput(" $1,234.50 ")).toBe("1234.50");
  });
});

describe("parsePositiveNumber", () => {
  it("accepts formatted strings", () => {
    expect(parsePositiveNumber("10,000")).toBe(10000);
    expect(parsePositiveNumber("$1,000")).toBe(1000);
  });

  it("rejects non-positive", () => {
    expect(parsePositiveNumber("0")).toBeNull();
    expect(parsePositiveNumber("-5")).toBeNull();
    expect(parsePositiveNumber("abc")).toBeNull();
  });

  it("accepts finite positive numbers", () => {
    expect(parsePositiveNumber(2500)).toBe(2500);
  });
});

describe("validateDemoBody", () => {
  it("validates good payloads", () => {
    const r = validateDemoBody({ dealSize: 10000, commission: 1000 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.dealSize).toBe(10000);
      expect(r.value.commission).toBe(1000);
    }
  });

  it("coerces numeric strings", () => {
    const r = validateDemoBody({ dealSize: "50,000", commission: "2,500" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.dealSize).toBe(50000);
      expect(r.value.commission).toBe(2500);
    }
  });

  it("rejects out-of-range values", () => {
    const r = validateDemoBody({ dealSize: 2_000_000, commission: 100 });
    expect(r.ok).toBe(false);
  });
});
