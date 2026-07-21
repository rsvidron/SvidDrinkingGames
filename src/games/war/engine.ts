import { createDeck, shuffle, type Card } from "../../lib/deck";
import type { WarSettings, WarState } from "./types";

export function initWar(settings: WarSettings): WarState {
  return {
    players: settings.players,
    regularDrinks: settings.regularDrinks,
    warDrinks: settings.warDrinks,
    tapMode: settings.tapMode,
    deck: shuffle(createDeck()),
    p1Card: null,
    p2Card: null,
    warBurn: 0,
    drinks: [0, 0],
    handsPlayed: 0,
    warsHad: 0,
    lastResult: null,
    phase: "ready",
  };
}

/** True if the deck can afford another WAR (3 burn + 1 flip per player = 8 cards). */
export function canDeclareWar(deck: Card[]): boolean {
  return deck.length >= 8;
}

/** True if the deck can afford another normal flip (1 card per player). */
export function canFlip(deck: Card[]): boolean {
  return deck.length >= 2;
}

/** Compare two cards' ranks. Returns 0 if p1 wins, 1 if p2 wins, -1 if tied. */
export function compareRanks(a: Card, b: Card): 0 | 1 | -1 {
  if (a.value === b.value) return -1;
  return a.value > b.value ? 0 : 1;
}
