import { PAIN_OPTIONS, SCENARIOS } from "./constants";
import type { DemoScenario } from "./types";

function pickRandom<T>(items: readonly T[]): T {
  const i = Math.floor(Math.random() * items.length);
  return items[i]!;
}

export function pickRandomScenario(): DemoScenario {
  return pickRandom(SCENARIOS);
}

export function pickRandomPain(): string {
  return pickRandom(PAIN_OPTIONS);
}
