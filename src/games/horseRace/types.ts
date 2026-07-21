import type { Card, Suit } from "../../lib/deck";

export interface HrPlayer {
  name: string;
  suit: Suit;
}

export interface HrSettings {
  players: HrPlayer[]; // 2-4, each with a unique suit
  raceLength: number; // spaces from start to finish (2-10)
}

export type HrPhase = "playing" | "gameover";

export interface HrState {
  players: HrPlayer[];
  raceLength: number;
  positions: Record<Suit, number>; // only entries for picked suits
  deck: Card[];
  lastCard: Card | null;
  lastMovedSuit: Suit | null;
  soleLastSuit: Suit | null; // whichever suit is currently in solo last place, or null if tied
  drinkerSuit: Suit | null; // set when a NEW horse falls into solo last place
  winnerSuit: Suit | null;
  phase: HrPhase;
}
