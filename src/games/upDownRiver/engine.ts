import { createDeck, shuffle, cardColor, type Card, type Suit } from "../../lib/deck";
import type {
  GameSettings,
  GameState,
  HighLowGuess,
  InsideOutsideGuess,
  Player,
  PyramidCardState,
  PyramidOutcome,
  RedBlackGuess,
} from "./types";

const STAGE_META: { id: PyramidCardState["id"]; label: string; drinkValue: number }[] = [
  { id: "redBlack", label: "Red or Black", drinkValue: 1 },
  { id: "highLow", label: "Higher or Lower", drinkValue: 2 },
  { id: "insideOutside", label: "Inside or Outside", drinkValue: 3 },
  { id: "suit", label: "Guess the Suit", drinkValue: 4 },
];

const CARDS_PER_PLAYER = 4;

export function maxRiverCount(playerCount: number): number {
  const remaining = 52 - playerCount * CARDS_PER_PLAYER;
  const evenRemaining = Math.floor(remaining / 2) * 2;
  return Math.max(2, Math.min(16, evenRemaining));
}

export function initGame(settings: GameSettings): GameState {
  const deck = shuffle(createDeck());
  let cursor = 0;

  const players: Player[] = settings.playerNames.map((name, id) => {
    const myCards = deck.slice(cursor, cursor + CARDS_PER_PLAYER);
    cursor += CARDS_PER_PLAYER;
    const pyramid: PyramidCardState[] = STAGE_META.map((meta, i) => ({
      id: meta.id,
      label: meta.label,
      drinkValue: meta.drinkValue,
      card: myCards[i],
    }));
    return { id, name, drinksGiven: 0, drinksTaken: 0, pyramid };
  });

  const heldRanks = new Set(players.flatMap((p) => p.pyramid.map((s) => s.card.rank)));
  const matchingPool = deck.slice(cursor).filter((c) => heldRanks.has(c.rank));

  const requestedRiverCount = Math.min(settings.riverCount, maxRiverCount(players.length));
  const riverCount = Math.floor(Math.min(requestedRiverCount, matchingPool.length) / 2) * 2;
  const riverCardsRaw = matchingPool.slice(0, riverCount);

  const half = riverCount / 2;
  const riverCards = riverCardsRaw.map((card, i) => {
    const direction = (i < half ? "up" : "down") as "up" | "down";
    const positionInHalf = i < half ? i : i - half;
    return {
      card,
      direction,
      positionInHalf,
      drinkValue: positionInHalf + 1,
      matchedPlayerIds: [],
      resolved: false,
    };
  });

  return {
    players,
    phase: "pyramid",
    currentPlayerIndex: 0,
    currentStageIndex: 0,
    riverCards,
    currentRiverIndex: 0,
    riverRevealed: false,
    pushMeansDrink: settings.pushMeansDrink,
  };
}

export function resolveRedBlack(card: Card, guess: RedBlackGuess): PyramidOutcome {
  return cardColor(card) === guess ? "correct" : "wrong";
}

export function resolveHighLow(card: Card, firstCard: Card, guess: HighLowGuess): PyramidOutcome {
  if (card.value === firstCard.value) return "push";
  const isHigher = card.value > firstCard.value;
  return (guess === "higher") === isHigher ? "correct" : "wrong";
}

export function resolveInsideOutside(
  card: Card,
  firstCard: Card,
  secondCard: Card,
  guess: InsideOutsideGuess
): PyramidOutcome {
  const min = Math.min(firstCard.value, secondCard.value);
  const max = Math.max(firstCard.value, secondCard.value);
  if (card.value === min || card.value === max) return "push";
  const isInside = card.value > min && card.value < max;
  return (guess === "inside") === isInside ? "correct" : "wrong";
}

export function resolveSuit(card: Card, guess: Suit): PyramidOutcome {
  return card.suit === guess ? "correct" : "wrong";
}

export function applyOutcome(
  players: Player[],
  playerId: number,
  outcome: PyramidOutcome,
  drinkValue: number,
  pushMeansDrink: boolean
): Player[] {
  if (outcome === "push" && !pushMeansDrink) return players;
  return players.map((p) => {
    if (p.id !== playerId) return p;
    if (outcome === "correct") {
      return { ...p, drinksGiven: p.drinksGiven + drinkValue };
    }
    return { ...p, drinksTaken: p.drinksTaken + drinkValue };
  });
}

export function handHasRank(hand: Card[], rank: string): boolean {
  return hand.some((c) => c.rank === rank);
}
