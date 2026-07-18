import type { Card, Rank } from "../../lib/deck";

export interface FtdPlayer {
  id: number;
  name: string;
}

export type FtdPhase = "handoff" | "peek" | "result" | "gameover";

export interface FtdHistoryEntry {
  card: Card;
  dealerName: string;
  guesserName: string;
  outcome: "correct1" | "correct2" | "missed";
  seconds: number;
  guesses: Rank[]; // one or two guesses
}

export interface FtdSettings {
  playerNames: string[];
}

export interface FtdState {
  players: FtdPlayer[];
  deck: Card[];
  dealerIndex: number;
  guesserIndex: number;
  consecutiveFails: number;
  currentCard: Card | null;
  firstGuess: Rank | null;
  history: FtdHistoryEntry[];
  lastEntry: FtdHistoryEntry | null;
  dealerJustChanged: boolean;
  phase: FtdPhase;
}
