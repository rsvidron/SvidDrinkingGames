import type { Card } from "../../lib/deck";

export interface BlackjackPlayer {
  name: string;
}

export interface BlackjackSettings {
  players: BlackjackPlayer[]; // 1-4
  minBet: number;
  maxBet: number;
  blackjackPayoutMultiplier: number; // 1.5 = 3:2 (traditional), 2 = double
  allowDouble: boolean;
}

/** Phase machine. See BlackjackGame.tsx for the UI wired to each. */
export type BlackjackPhase =
  | "ready"         // pre-deal: press Deal Hand
  | "pass"          // "pass to Bobby" — hides previous player's cards
  | "playing"       // active player looking at their private hand
  | "dealerReveal"  // "tap to reveal dealer" screen
  | "dealerPlaying" // hole flipped; dealer draws one card at a time on a timer
  | "results";      // all hands + outcomes + drink assignments

export type PlayerHandStatus =
  | "pending"     // hasn't played this hand
  | "playing"     // actively deciding hit/stand/double
  | "stood"
  | "busted"
  | "blackjack";  // natural 21 on the deal

export interface PlayerHand {
  cards: Card[];
  bet: number;         // drinks wagered this hand
  doubled: boolean;    // true if player doubled down
  status: PlayerHandStatus;
}

export type HandOutcome = "win" | "lose" | "push" | "blackjack";

export interface HandResult {
  playerIdx: number;
  outcome: HandOutcome;
  drinksDrunk: number; // 0 unless they lost
  drinksGiven: number; // 0 unless they won — winner picks recipients at the table
}

export interface BlackjackState {
  players: BlackjackPlayer[];
  playerHands: PlayerHand[];   // parallel to players
  dealerHand: Card[];          // [0] up, [1] hole (hidden until dealerRevealed)
  dealerRevealed: boolean;
  activePlayerIdx: number;     // whose turn during pass/playing
  shoe: Card[];                // multi-deck shoe, reshuffled when low
  phase: BlackjackPhase;
  lastBet: number;             // default bet for next hand (persistence)
  handsPlayed: number;
  drinksDrunk: number[];       // running total per player (parallel to players)
  drinksGiven: number[];       // running total per player
  results: HandResult[] | null;

  // Settings snapshotted into state so mid-game edits (via GameMenu → Settings)
  // apply cleanly.
  minBet: number;
  maxBet: number;
  blackjackPayoutMultiplier: number;
  allowDouble: boolean;
}
