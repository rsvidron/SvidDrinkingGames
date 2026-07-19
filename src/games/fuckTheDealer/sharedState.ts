import type { FtdHistoryEntry } from "./types";

export interface FtdSharedState {
  cardsLeft: number;
  consecutiveFails: number;
  history: FtdHistoryEntry[];
  phase: "handoff" | "peek" | "result" | "gameover";
  /** Only populated on result / gameover — never during peek so the viewer never spoils. */
  currentCardReveal: FtdHistoryEntry | null;
  dealerJustChanged: boolean;
}
