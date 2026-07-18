export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Color = "red" | "black";

export const RANKS = [
  "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A",
] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number; // 2-14, ace high
}

export const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export function suitSymbol(suit: Suit): string {
  return SUIT_SYMBOLS[suit];
}

export function suitColor(suit: Suit): Color {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}

export function cardColor(card: Card): Color {
  return suitColor(card.suit);
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank, index) => {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
        value: index + 2,
      });
    });
  });
  return deck;
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function cardLabel(card: Card): string {
  return `${card.rank}${suitSymbol(card.suit)}`;
}
