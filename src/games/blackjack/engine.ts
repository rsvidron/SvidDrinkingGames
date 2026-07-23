import { createDeck, shuffle, type Card } from "../../lib/deck";
import type {
  BlackjackSettings,
  BlackjackState,
  HandResult,
  PlayerHand,
} from "./types";

const NUM_DECKS = 4;
const RESHUFFLE_THRESHOLD = 40;

/** Build a fresh multi-deck shoe with per-copy card ids so React keys stay unique. */
export function buildShoe(): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < NUM_DECKS; i += 1) {
    for (const c of createDeck()) {
      cards.push({ ...c, id: `${c.id}#${i}` });
    }
  }
  return shuffle(cards);
}

/** Blackjack point value of a single card. Aces count 11 here — the caller
 *  ({@link handTotal}) demotes them to 1 as needed to avoid a bust. */
export function cardBlackjackValue(card: Card): number {
  if (card.rank === "A") return 11;
  if (card.rank === "J" || card.rank === "Q" || card.rank === "K") return 10;
  return parseInt(card.rank, 10);
}

/** Best (non-busting if possible) total for a hand.
 *  `soft` = at least one ace is still counting as 11. */
export function handTotal(cards: Card[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    total += cardBlackjackValue(c);
    if (c.rank === "A") aces += 1;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0 };
}

/** True for a "natural" — 21 on the initial two cards only. */
export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handTotal(cards).total === 21;
}

export function initBlackjack(settings: BlackjackSettings): BlackjackState {
  return {
    players: settings.players,
    playerHands: settings.players.map(() => ({
      cards: [],
      bet: settings.minBet,
      doubled: false,
      status: "pending",
    })),
    dealerHand: [],
    dealerRevealed: false,
    activePlayerIdx: 0,
    shoe: buildShoe(),
    phase: "ready",
    lastBet: settings.minBet,
    handsPlayed: 0,
    drinksDrunk: settings.players.map(() => 0),
    drinksGiven: settings.players.map(() => 0),
    results: null,
    minBet: settings.minBet,
    maxBet: settings.maxBet,
    blackjackPayoutMultiplier: settings.blackjackPayoutMultiplier,
    allowDouble: settings.allowDouble,
  };
}

/** Deal a new hand: 2 cards each to players and dealer (standard alternating order). */
export function dealHand(state: BlackjackState): BlackjackState {
  const shoe = state.shoe.length < RESHUFFLE_THRESHOLD ? buildShoe() : [...state.shoe];
  const hands: PlayerHand[] = state.players.map(() => ({
    cards: [],
    bet: state.lastBet,
    doubled: false,
    status: "pending",
  }));
  const dealerHand: Card[] = [];
  for (let round = 0; round < 2; round += 1) {
    for (const hand of hands) {
      hand.cards.push(shoe.shift()!);
    }
    dealerHand.push(shoe.shift()!);
  }
  // Naturals skip taking a turn.
  for (const hand of hands) {
    if (isBlackjack(hand.cards)) hand.status = "blackjack";
  }
  const activePlayerIdx = firstPending(hands);
  const phase = activePlayerIdx === -1 ? "dealerReveal" : "pass";
  return {
    ...state,
    shoe,
    playerHands: hands,
    dealerHand,
    dealerRevealed: false,
    activePlayerIdx: activePlayerIdx === -1 ? 0 : activePlayerIdx,
    phase,
    results: null,
  };
}

function firstPending(hands: PlayerHand[]): number {
  for (let i = 0; i < hands.length; i += 1) {
    if (hands[i].status === "pending") return i;
  }
  return -1;
}

/** Player commits their bet (from the "pass to X" screen) and reveals their hand. */
export function beginPlayerTurn(state: BlackjackState): BlackjackState {
  const hands = [...state.playerHands];
  const bet = hands[state.activePlayerIdx].bet;
  hands[state.activePlayerIdx] = {
    ...hands[state.activePlayerIdx],
    status: "playing",
  };
  return { ...state, playerHands: hands, phase: "playing", lastBet: bet };
}

/** Adjust the active player's bet before they reveal — pass-screen stepper. */
export function setBet(state: BlackjackState, bet: number): BlackjackState {
  const clamped = Math.max(state.minBet, Math.min(state.maxBet, bet));
  const hands = [...state.playerHands];
  hands[state.activePlayerIdx] = { ...hands[state.activePlayerIdx], bet: clamped };
  return { ...state, playerHands: hands };
}

export function playerHit(state: BlackjackState): BlackjackState {
  const shoe = [...state.shoe];
  const card = shoe.shift()!;
  const hands = [...state.playerHands];
  const hand = { ...hands[state.activePlayerIdx] };
  hand.cards = [...hand.cards, card];
  const { total } = handTotal(hand.cards);
  if (total > 21) hand.status = "busted";
  else if (total === 21) hand.status = "stood"; // auto-stand on 21
  hands[state.activePlayerIdx] = hand;
  return advanceIfHandDone({ ...state, playerHands: hands, shoe });
}

export function playerStand(state: BlackjackState): BlackjackState {
  const hands = [...state.playerHands];
  hands[state.activePlayerIdx] = { ...hands[state.activePlayerIdx], status: "stood" };
  return advanceIfHandDone({ ...state, playerHands: hands });
}

/** Double: bet doubles (capped at 2× maxBet), one card, auto-stand or bust. */
export function playerDouble(state: BlackjackState): BlackjackState {
  const shoe = [...state.shoe];
  const card = shoe.shift()!;
  const hands = [...state.playerHands];
  const hand = { ...hands[state.activePlayerIdx] };
  hand.bet = Math.min(state.maxBet * 2, hand.bet * 2);
  hand.doubled = true;
  hand.cards = [...hand.cards, card];
  const { total } = handTotal(hand.cards);
  hand.status = total > 21 ? "busted" : "stood";
  hands[state.activePlayerIdx] = hand;
  return advanceIfHandDone({ ...state, playerHands: hands, shoe });
}

function advanceIfHandDone(state: BlackjackState): BlackjackState {
  const currentHand = state.playerHands[state.activePlayerIdx];
  if (currentHand.status === "playing") return state; // still deciding
  for (let i = state.activePlayerIdx + 1; i < state.playerHands.length; i += 1) {
    if (state.playerHands[i].status === "pending") {
      return { ...state, activePlayerIdx: i, phase: "pass" };
    }
  }
  return { ...state, phase: "dealerReveal" };
}

/** Reveal hole card, dealer hits until 17+, then compute results. */
export function dealerPlay(state: BlackjackState): BlackjackState {
  const dealerHand = [...state.dealerHand];
  const shoe = [...state.shoe];
  while (handTotal(dealerHand).total < 17) {
    dealerHand.push(shoe.shift()!);
  }
  const settled: BlackjackState = { ...state, dealerHand, shoe, dealerRevealed: true };
  return computeResults(settled);
}

function computeResults(state: BlackjackState): BlackjackState {
  const dealerTotal = handTotal(state.dealerHand).total;
  const dealerBust = dealerTotal > 21;
  const dealerBlackjack = isBlackjack(state.dealerHand);
  const results: HandResult[] = [];
  const drinksDrunk = [...state.drinksDrunk];
  const drinksGiven = [...state.drinksGiven];

  state.playerHands.forEach((hand, idx) => {
    const { total } = handTotal(hand.cards);
    let outcome: HandResult["outcome"] = "push";
    let drink = 0;
    let give = 0;

    if (hand.status === "busted") {
      // Bust always loses, even if the dealer also busts.
      outcome = "lose";
      drink = hand.bet;
    } else if (hand.status === "blackjack") {
      if (dealerBlackjack) {
        outcome = "push";
      } else {
        outcome = "blackjack";
        give = Math.ceil(hand.bet * state.blackjackPayoutMultiplier);
      }
    } else if (dealerBlackjack) {
      outcome = "lose";
      drink = hand.bet;
    } else if (dealerBust) {
      outcome = "win";
      give = hand.bet;
    } else if (total > dealerTotal) {
      outcome = "win";
      give = hand.bet;
    } else if (total < dealerTotal) {
      outcome = "lose";
      drink = hand.bet;
    }

    drinksDrunk[idx] += drink;
    drinksGiven[idx] += give;
    results.push({ playerIdx: idx, outcome, drinksDrunk: drink, drinksGiven: give });
  });

  return {
    ...state,
    phase: "results",
    results,
    drinksDrunk,
    drinksGiven,
    handsPlayed: state.handsPlayed + 1,
  };
}

/** After the results screen, go back to "ready" for the next hand. */
export function readyForNextHand(state: BlackjackState): BlackjackState {
  return { ...state, phase: "ready", results: null };
}
