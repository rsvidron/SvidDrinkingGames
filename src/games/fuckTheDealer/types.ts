import type { Card, Rank } from "../../lib/deck";

export type FtdPhase = "handoff" | "peek" | "result" | "gameover";

export interface FtdHistoryEntry {
  card: Card;
  outcome: "correct1" | "correct2" | "missed";
  seconds: number;
  guesses: Rank[]; // one or two guesses
}

// No settings needed — the game only tracks the deck and shared rules.
export interface FtdSettings {}

export interface FtdState {
  deck: Card[];
  consecutiveFails: number;
  currentCard: Card | null;
  firstGuess: Rank | null;
  history: FtdHistoryEntry[];
  lastEntry: FtdHistoryEntry | null;
  dealerJustChanged: boolean;
  phase: FtdPhase;
}
