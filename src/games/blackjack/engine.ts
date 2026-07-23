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

/** Deal a new hand: 2 cards each to players and dealer (standard alternating order).
 *  Naturals are NOT auto-marked here — the player still gets a "reveal" moment on
 *  their turn so they can see they were dealt blackjack. */
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
  return {
    ...state,
    shoe,
    playerHands: hands,
    dealerHand,
    dealerRevealed: false,
    activePlayerIdx: 0,
    phase: "pass",
    results: null,
  };
}

/** Player commits their bet (from the "pass to X" screen) and reveals their hand.
 *  A natural 21 is detected here and marked as "blackjack" — the UI shows the
 *  celebration screen and the player taps "Pass phone" when ready. */
export function beginPlayerTurn(state: BlackjackState): BlackjackState {
  const hands = [...state.playerHands];
  const current = hands[state.activePlayerIdx];
  const bet = current.bet;
  const nextStatus = isBlackjack(current.cards) ? "blackjack" : "playing";
  hands[state.activePlayerIdx] = { ...current, status: nextStatus };
  return { ...state, playerHands: hands, phase: "playing", lastBet: bet };
}

/** Adjust the active player's bet before they reveal — pass-screen stepper. */
export function setBet(state: BlackjackState, bet: number): BlackjackState {
  const clamped = Math.max(state.minBet, Math.min(state.maxBet, bet));
  const hands = [...state.playerHands];
  hands[state.activePlayerIdx] = { ...hands[state.activePlayerIdx], bet: clamped };
  return { ...state, playerHands: hands };
}

/** Take a hit. Doesn't advance — the UI shows the result (including bust)
 *  and the player taps "Pass phone" to hand off. */
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
  return { ...state, playerHands: hands, shoe };
}

/** Stand. Doesn't advance — the UI shows STOOD + total and the player taps
 *  "Pass phone" to hand off. */
export function playerStand(state: BlackjackState): BlackjackState {
  const hands = [...state.playerHands];
  hands[state.activePlayerIdx] = { ...hands[state.activePlayerIdx], status: "stood" };
  return { ...state, playerHands: hands };
}

/** Double: bet doubles (capped at 2× maxBet), one card, auto-stand or bust.
 *  Doesn't advance — same reveal-then-tap pattern as hit/stand. */
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
  return { ...state, playerHands: hands, shoe };
}

/** Explicit "pass phone" — called from the UI when the player has finished
 *  looking at their bust/stand/blackjack outcome. Moves to the next pending
 *  player, or transitions to the dealer phase if everyone's done. */
export function advancePlayer(state: BlackjackState): BlackjackState {
  for (let i = state.activePlayerIdx + 1; i < state.playerHands.length; i += 1) {
    if (state.playerHands[i].status === "pending") {
      return { ...state, activePlayerIdx: i, phase: "pass" };
    }
  }
  return { ...state, phase: "dealerReveal" };
}

/** Flip the hole card and enter the paced dealer-draw phase. If the dealer
 *  is already at 17+ (or blackjack) after the flip, the UI still shows the
 *  flip briefly before {@link dealerHitOne} transitions to results. */
export function revealDealerHole(state: BlackjackState): BlackjackState {
  return { ...state, dealerRevealed: true, phase: "dealerPlaying" };
}

/** One step of dealer play: draw one card if under 17, otherwise finalize.
 *  The UI drives this on a timer so each card appears with a pause. */
export function dealerHitOne(state: BlackjackState): BlackjackState {
  const currentTotal = handTotal(state.dealerHand).total;
  if (currentTotal >= 17) {
    // Nothing more to draw — settle the hand.
    return computeResults(state);
  }
  const shoe = [...state.shoe];
  const card = shoe.shift()!;
  const dealerHand = [...state.dealerHand, card];
  const next = { ...state, dealerHand, shoe };
  const newTotal = handTotal(dealerHand).total;
  if (newTotal >= 17) {
    // Landed at 17+ (or bust); settle now.
    return computeResults(next);
  }
  return next; // stays in dealerPlaying — UI will schedule the next hit.
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
