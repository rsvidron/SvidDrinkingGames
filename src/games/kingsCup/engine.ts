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
    currentPlayerIndex: 0,
    currentCard: null,
    kingsDrawn: 0,
    activeRule: null,
    questionMasterId: null,
    matePair: null,
    phase: "draw",
  };
}

export function mateOf(state: KcState, playerId: number): number | null {
  if (!state.matePair) return null;
  const [a, b] = state.matePair;
  if (a === playerId) return b;
  if (b === playerId) return a;
  return null;
}
