import { createDeck, shuffle, RANKS, type Rank } from "../../lib/deck";
import type { FtdState } from "./types";

export function initFtd(): FtdState {
  return {
    deck: shuffle(createDeck()),
    consecutiveFails: 0,
    currentCard: null,
    firstGuess: null,
    history: [],
    lastEntry: null,
    dealerJustChanged: false,
    phase: "handoff",
  };
}

export function rankIndex(rank: Rank): number {
  return RANKS.indexOf(rank);
}

export function rankDifference(a: Rank, b: Rank): number {
  return Math.abs(rankIndex(a) - rankIndex(b));
}

export function directionHint(guess: Rank, actual: Rank): "higher" | "lower" | "same" {
  const g = rankIndex(guess);
  const a = rankIndex(actual);
  if (a > g) return "higher";
  if (a < g) return "lower";
  return "same";
}
