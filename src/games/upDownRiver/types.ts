import type { Card, Suit } from "../../lib/deck";

export type PyramidStageId = "redBlack" | "highLow" | "insideOutside" | "suit";

export type RedBlackGuess = "red" | "black";
export type HighLowGuess = "higher" | "lower";
export type InsideOutsideGuess = "inside" | "outside";
export type SuitGuess = Suit;

export type PyramidOutcome = "correct" | "wrong" | "push";

export interface PyramidCardState {
  id: PyramidStageId;
  label: string;
  drinkValue: number;
  card: Card;
  guess?: string;
  outcome?: PyramidOutcome;
  saying?: string;
}

export interface Player {
  id: number;
  name: string;
  drinksGiven: number;
  drinksTaken: number;
  pyramid: PyramidCardState[]; // this player's own 4 cards, doubles as their river hand
}

export type GamePhase = "pyramid" | "river" | "summary";

export interface RiverCardResult {
  card: Card;
  direction: "up" | "down";
  positionInHalf: number; // 0-indexed position within its up/down half
  drinkValue: number; // positionInHalf + 1
  matchedPlayerIds: number[];
  resolved: boolean;
}

export interface GameSettings {
  playerNames: string[];
  riverCount: number; // even number
  pushMeansDrink: boolean;
}

export interface GameState {
  players: Player[];
  phase: GamePhase;
  currentPlayerIndex: number;
  currentStageIndex: number;
  riverCards: RiverCardResult[];
  currentRiverIndex: number;
  riverRevealed: boolean;
  pushMeansDrink: boolean;
}
