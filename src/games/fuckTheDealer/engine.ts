import { createDeck, shuffle, RANKS, type Rank } from "../../lib/deck";
import type { FtdSettings, FtdState } from "./types";

export function initFtd(settings: FtdSettings): FtdState {
  const players = settings.playerNames.map((name, id) => ({ id, name }));
  return {
    players,
    deck: shuffle(createDeck()),
    dealerIndex: 0,
    guesserIndex: 1 % players.length,
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

export function nextGuesserIndex(state: FtdState, dealerIndex: number, currentGuesserIndex: number): number {
  const n = state.players.length;
  let idx = (currentGuesserIndex + 1) % n;
  if (idx === dealerIndex) idx = (idx + 1) % n;
  return idx;
}
