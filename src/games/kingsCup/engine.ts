import { createDeck, shuffle } from "../../lib/deck";
import type { KcSettings, KcState } from "./types";

export function initKingsCup(settings: KcSettings): KcState {
  const players = settings.playerNames.map((name, id) => ({
    id,
    name,
    gender: settings.playerGenders[id] ?? ("guy" as const),
    fingers: 3,
  }));

  return {
    players,
    deck: shuffle(createDeck()),
    currentCard: null,
    kingsDrawn: 0,
    activeRule: null,
    questionMasterId: null,
    matePairs: [],
    phase: "draw",
  };
}

export function matesOf(state: KcState, playerId: number): number[] {
  const result: number[] = [];
  for (const [a, b] of state.matePairs) {
    if (a === playerId) result.push(b);
    else if (b === playerId) result.push(a);
  }
  return result;
}
