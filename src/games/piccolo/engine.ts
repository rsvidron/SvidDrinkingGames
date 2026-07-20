import { MILD_PROMPTS, SPICY_PROMPTS } from "./prompts";
import type { PiccoloSettings, PiccoloState, Prompt } from "./types";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function initPiccolo(settings: PiccoloSettings): PiccoloState {
  const rawPool: Prompt[] = settings.spicy
    ? [...MILD_PROMPTS, ...SPICY_PROMPTS]
    : [...MILD_PROMPTS];
  const pool = rawPool.filter((p) => settings.categories[p.category] !== false);
  return {
    deck: shuffle(pool),
    currentPrompt: null,
    activeRule: null,
    drawnCount: 0,
    phase: "draw",
  };
}
