import type { Card } from "../../lib/deck";

export type Gender = "guy" | "girl";

export interface KcPlayer {
  id: number;
  name: string;
  gender: Gender;
  fingers: number; // for Jack / Never Have I Ever, starts at 3
}

export type KcPhase = "draw" | "resolve" | "gameover";

export interface KcSettings {
  playerNames: string[];
  playerGenders: Gender[];
}

export interface KcState {
  players: KcPlayer[];
  deck: Card[];
  currentCard: Card | null;
  kingsDrawn: number;
  activeRule: string | null;
  questionMasterId: number | null;
  matePairs: Array<[number, number]>;
  phase: KcPhase;
}
