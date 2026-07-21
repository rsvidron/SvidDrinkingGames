import { createDeck, shuffle, type Card } from "../../lib/deck";
import type { WarSettings, WarState } from "./types";

export function initWar(settings: WarSettings): WarState {
  const shuffled = shuffle(createDeck());
  const base: WarState = {
    players: settings.players,
    regularDrinks: settings.regularDrinks,
    warDrinks: settings.warDrinks,
    tapMode: settings.tapMode,
    mode: settings.mode,
    deck: [],
    p1Pile: [],
    p2Pile: [],
    pot: [],
    p1Card: null,
    p2Card: null,
    warBurn: 0,
    drinks: [0, 0],
    handsPlayed: 0,
    warsHad: 0,
    lastResult: null,
    phase: "ready",
  };
  if (settings.mode === "traditional") {
    base.p1Pile = shuffled.slice(0, 26);
    base.p2Pile = shuffled.slice(26);
  } else {
    base.deck = shuffled;
  }
  return base;
}

/**
 * Simple mode: shared-deck helpers. Traditional mode uses `canFlipTraditional`
 * / `canDeclareWarTraditional` which check per-player piles instead.
 */

/** True if the shared deck can afford another WAR (3 burn + 1 flip per player = 8 cards). */
export function canDeclareWar(deck: Card[]): boolean {
  return deck.length >= 8;
}

/** True if the shared deck can afford another normal flip (1 card per player). */
export function canFlip(deck: Card[]): boolean {
  return deck.length >= 2;
}

/** True if both players still have at least one card to flip. */
export function canFlipTraditional(p1Pile: Card[], p2Pile: Card[]): boolean {
  return p1Pile.length >= 1 && p2Pile.length >= 1;
}

/**
 * True if both players can put SOMETHING down for a war — even one card is
 * enough (traditional rule: if you can't cover the war you lose it). The
 * game only ends when a player has no cards at all.
 */
export function canDeclareWarTraditional(p1Pile: Card[], p2Pile: Card[]): boolean {
  return p1Pile.length >= 1 && p2Pile.length >= 1;
}

/** Compare two cards' ranks. Returns 0 if p1 wins, 1 if p2 wins, -1 if tied. */
export function compareRanks(a: Card, b: Card): 0 | 1 | -1 {
  if (a.value === b.value) return -1;
  return a.value > b.value ? 0 : 1;
}

/**
 * Shuffle a set of cards (to be added to the bottom of a pile). Winning a
 * hand or war means these get shuffled in — without shuffling, deterministic
 * sequences can loop forever on some seeds.
 */
export function shuffleForPile(cards: Card[]): Card[] {
  return shuffle(cards);
}
