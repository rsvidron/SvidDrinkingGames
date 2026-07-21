import type { Card } from "../../lib/deck";

export interface WarPlayer {
  name: string;
}

export type WarTapMode = "either" | "both";

export interface WarSettings {
  players: [WarPlayer, WarPlayer];
  regularDrinks: number; // drinks the loser of a normal hand takes
  warDrinks: number; // drinks the loser of a WAR (tie-triggered) takes
  tapMode: WarTapMode; // "either": one player taps to advance; "both": both must tap
}

export type WarPhase =
  | "ready"     // waiting to flip
  | "revealed"  // both cards face-up, winner decided, waiting for Next Hand
  | "war"       // last flip was a tie; waiting to declare war
  | "gameover"; // deck exhausted

export interface WarResult {
  winner: 0 | 1;
  loser: 0 | 1;
  drinksLost: number;
  wasWar: boolean;
  warDepth: number;
}

export interface WarState {
  players: [WarPlayer, WarPlayer];
  regularDrinks: number;
  warDrinks: number;
  tapMode: WarTapMode;
  deck: Card[];
  p1Card: Card | null;
  p2Card: Card | null;
  warBurn: number; // count of face-down burn cards accumulated during a war chain
  drinks: [number, number]; // running drink totals
  handsPlayed: number;
  warsHad: number;
  lastResult: WarResult | null;
  phase: WarPhase;
}
