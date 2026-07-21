import { createDeck, shuffle, type Suit } from "../../lib/deck";
import type { HrSettings, HrState } from "./types";

/**
 * Suits currently in the race. If only 2 people play with hearts and spades,
 * only those suits are in the deck and on the track. Deduped so multiple
 * players sharing a suit still map to a single horse.
 */
export function activeSuits(settings: HrSettings): Suit[] {
  return Array.from(new Set(settings.players.map((p) => p.suit)));
}

/**
 * Build the drawing deck: full 52-card deck restricted to the active suits,
 * with the aces removed (they're pre-placed on the track).
 */
export function buildRaceDeck(settings: HrSettings) {
  const suits = new Set(activeSuits(settings));
  const full = createDeck().filter((c) => suits.has(c.suit) && c.rank !== "A");
  return shuffle(full);
}

/**
 * If exactly one horse is in last place, return that suit; otherwise null.
 * "Last" means the lowest position value among active suits.
 */
export function findSoleLast(
  positions: Record<Suit, number>
): Suit | null {
  const suits = Object.keys(positions) as Suit[];
  if (suits.length === 0) return null;
  let min = Infinity;
  for (const s of suits) if (positions[s] < min) min = positions[s];
  const at = suits.filter((s) => positions[s] === min);
  return at.length === 1 ? at[0] : null;
}

export function initHorseRace(settings: HrSettings): HrState {
  const positions = {} as Record<Suit, number>;
  for (const p of settings.players) positions[p.suit] = 0;
  return {
    players: settings.players,
    raceLength: settings.raceLength,
    positions,
    deck: buildRaceDeck(settings),
    lastCard: null,
    lastMovedSuit: null,
    soleLastSuit: findSoleLast(positions),
    drinkerSuit: null,
    winnerSuit: null,
    phase: "playing",
  };
}
