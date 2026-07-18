import { useState } from "react";
import { PlayingCard } from "../../components/PlayingCard";
import { RANKS, suitSymbol, type Rank } from "../../lib/deck";
import { directionHint, initFtd, nextGuesserIndex, rankDifference } from "./engine";
import type { FtdHistoryEntry, FtdState, FtdSettings } from "./types";

interface Props {
  settings: FtdSettings;
  onRestart: () => void;
}

function HistoryStrip({ history }: { history: FtdHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="card-panel text-center text-dim" style={{ fontSize: "0.8rem", width: "100%" }}>
        No cards played yet
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        padding: "8px 4px",
        width: "100%",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {history.map((h, i) => {
        const color = h.outcome === "missed" ? "var(--take)" : "var(--correct)";
        return (
          <div
            key={i}
            style={{
              minWidth: 84,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <PlayingCard card={h.card} size="sm" />
            <div style={{ fontSize: "0.7rem", textAlign: "center", color, lineHeight: 1.2 }}>
              {h.outcome === "correct1" && `${h.dealerName} -10s`}
              {h.outcome === "correct2" && `${h.dealerName} -5s`}
              {h.outcome === "missed" && `${h.guesserName} -${h.seconds}s`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankKeypad({
  allowedRanks,
  onPick,
}: {
  allowedRanks: Rank[];
  onPick: (r: Rank) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 6,
        width: "100%",
      }}
    >
      {RANKS.map((r) => {
        const enabled = allowedRanks.includes(r);
        return (
          <button
            key={r}
            className="btn"
            style={{
              padding: "10px 0",
              minHeight: 48,
              fontSize: "1.1rem",
              opacity: enabled ? 1 : 0.25,
              cursor: enabled ? "pointer" : "not-allowed",
            }}
            disabled={!enabled}
            onClick={() => enabled && onPick(r)}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}

export function FuckTheDealerGame({ settings, onRestart }: Props) {
  const [state, setState] = useState<FtdState>(() => initFtd(settings));

  const dealer = state.players[state.dealerIndex];
  const guesser = state.players[state.guesserIndex];

  function beginTurn() {
    setState((prev) => {
      if (prev.deck.length === 0) return { ...prev, phase: "gameover" };
      const [card, ...rest] = prev.deck;
      return {
        ...prev,
        deck: rest,
        currentCard: card,
        firstGuess: null,
        phase: "peek",
        dealerJustChanged: false,
      };
    });
  }

  function submitGuess(guess: Rank) {
    setState((prev) => {
      const card = prev.currentCard!;
      // First guess?
      if (prev.firstGuess == null) {
        if (guess === card.rank) {
          const entry: FtdHistoryEntry = {
            card,
            dealerName: prev.players[prev.dealerIndex].name,
            guesserName: prev.players[prev.guesserIndex].name,
            outcome: "correct1",
            seconds: 10,
            guesses: [guess],
          };
          return {
            ...prev,
            history: [...prev.history, entry],
            lastEntry: entry,
            consecutiveFails: 0,
            phase: "result",
          };
        }
        // Wrong first guess — record and move to second guess
        return { ...prev, firstGuess: guess };
      }

      // Second guess
      if (guess === card.rank) {
        const entry: FtdHistoryEntry = {
          card,
          dealerName: prev.players[prev.dealerIndex].name,
          guesserName: prev.players[prev.guesserIndex].name,
          outcome: "correct2",
          seconds: 5,
          guesses: [prev.firstGuess!, guess],
        };
        return {
          ...prev,
          history: [...prev.history, entry],
          lastEntry: entry,
          consecutiveFails: 0,
          phase: "result",
        };
      }

      // Missed both
      const diffFirst = rankDifference(prev.firstGuess!, card.rank);
      const diffSecond = rankDifference(guess, card.rank);
      const seconds = Math.min(diffFirst, diffSecond);
      const entry: FtdHistoryEntry = {
        card,
        dealerName: prev.players[prev.dealerIndex].name,
        guesserName: prev.players[prev.guesserIndex].name,
        outcome: "missed",
        seconds,
        guesses: [prev.firstGuess!, guess],
      };
      return {
        ...prev,
        history: [...prev.history, entry],
        lastEntry: entry,
        consecutiveFails: prev.consecutiveFails + 1,
        phase: "result",
      };
    });
  }

  function nextTurn() {
    setState((prev) => {
      const missedThreshold = prev.consecutiveFails >= 3;
      let dealerIndex = prev.dealerIndex;
      let guesserIndex = prev.guesserIndex;
      let consecutiveFails = prev.consecutiveFails;
      let dealerJustChanged = false;

      if (missedThreshold) {
        dealerIndex = (prev.dealerIndex + 1) % prev.players.length;
        guesserIndex = (dealerIndex + 1) % prev.players.length;
        consecutiveFails = 0;
        dealerJustChanged = true;
      } else {
        guesserIndex = nextGuesserIndex(prev, dealerIndex, guesserIndex);
      }

      const isDeckEmpty = prev.deck.length === 0;
      return {
        ...prev,
        dealerIndex,
        guesserIndex,
        consecutiveFails,
        currentCard: null,
        firstGuess: null,
        dealerJustChanged,
        phase: isDeckEmpty ? "gameover" : "handoff",
      };
    });
  }

  if (state.phase === "gameover") {
    return (
      <div className="screen">
        <div className="screen-header">
          <h1>Deck's Done</h1>
          <p>The dealer has been thoroughly fucked. Cheers!</p>
        </div>
        <div className="stack" style={{ flex: 1, marginTop: 16 }}>
          <HistoryStrip history={state.history} />
        </div>
        <button className="btn btn-primary btn-block" onClick={onRestart}>
          Play Again
        </button>
      </div>
    );
  }

  if (state.phase === "handoff") {
    return (
      <div className="screen">
        <div className="screen-header">
          <h1>Pass the phone to {dealer.name}</h1>
          <p>
            {guesser.name} is guessing &middot; {state.deck.length} cards left &middot;{" "}
            {state.consecutiveFails}/3 fails
          </p>
        </div>
        <div className="stack" style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
          {state.dealerJustChanged && (
            <div className="card-panel text-center" style={{ borderColor: "var(--gold)" }}>
              <strong style={{ color: "var(--gold)" }}>New Dealer: {dealer.name}</strong>
              <div className="text-dim">Deck has passed. 3 fails reset.</div>
            </div>
          )}
          <div className="card-panel text-center">
            <strong>{guesser.name}, look away!</strong>
            <div className="text-dim">
              {dealer.name} peeks the card, then asks you for a rank.
            </div>
          </div>
          <button className="btn btn-primary btn-block" onClick={beginTurn}>
            Peek Card (Dealer)
          </button>
        </div>
        <HistoryStrip history={state.history} />
      </div>
    );
  }

  if (state.phase === "peek") {
    const card = state.currentCard!;
    const isFirstGuess = state.firstGuess == null;
    const hint = isFirstGuess ? null : directionHint(state.firstGuess!, card.rank);
    const firstIdx = state.firstGuess != null ? RANKS.indexOf(state.firstGuess) : -1;
    const allowedRanks: Rank[] = isFirstGuess
      ? [...RANKS]
      : hint === "higher"
      ? RANKS.slice(firstIdx + 1)
      : RANKS.slice(0, firstIdx);

    return (
      <div className="screen">
        <div className="screen-header">
          <h1>{isFirstGuess ? "First Guess" : `Wrong — ${hint === "higher" ? "Higher" : "Lower"}!`}</h1>
          <p>
            Dealer: {dealer.name} &middot; Guesser: {guesser.name}
          </p>
        </div>
        <div className="stack" style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
          <PlayingCard card={card} size="lg" />
          {!isFirstGuess && (
            <div
              className="card-panel text-center"
              style={{ borderColor: hint === "higher" ? "var(--give)" : "var(--take)" }}
            >
              <strong style={{ color: hint === "higher" ? "var(--give)" : "var(--take)" }}>
                Tell {guesser.name}: {hint === "higher" ? "Higher!" : "Lower!"}
              </strong>
              <div className="text-dim">First guess was {state.firstGuess}</div>
            </div>
          )}
          <div className="text-dim text-center">
            Tap the rank {guesser.name} guessed
          </div>
          <RankKeypad allowedRanks={allowedRanks} onPick={submitGuess} />
        </div>
        <HistoryStrip history={state.history} />
      </div>
    );
  }

  // result
  const last = state.lastEntry!;
  const isMissed = last.outcome === "missed";
  const willChangeDealer = state.consecutiveFails >= 3;

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>
          {last.outcome === "correct1"
            ? "Correct on 1st!"
            : last.outcome === "correct2"
            ? "Correct on 2nd!"
            : "Missed both!"}
        </h1>
        <p>
          Card was {last.card.rank}
          {suitSymbol(last.card.suit)} &middot; guesses: {last.guesses.join(", ")}
        </p>
      </div>
      <div className="stack" style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
        <PlayingCard card={last.card} size="lg" />
        <div
          className="card-panel text-center"
          style={{ borderColor: isMissed ? "var(--take)" : "var(--correct)" }}
        >
          {last.outcome === "correct1" && (
            <strong style={{ color: "var(--correct)", fontSize: "1.4rem" }}>
              {last.dealerName} drinks 10 seconds!
            </strong>
          )}
          {last.outcome === "correct2" && (
            <strong style={{ color: "var(--correct)", fontSize: "1.4rem" }}>
              {last.dealerName} drinks 5 seconds!
            </strong>
          )}
          {last.outcome === "missed" && (
            <strong style={{ color: "var(--take)", fontSize: "1.4rem" }}>
              {last.guesserName} drinks {last.seconds} second{last.seconds === 1 ? "" : "s"}!
            </strong>
          )}
        </div>
        {willChangeDealer && (
          <div className="card-panel text-center" style={{ borderColor: "var(--gold)" }}>
            <strong style={{ color: "var(--gold)" }}>3 fails in a row!</strong>
            <div className="text-dim">Deck passes to the next player.</div>
          </div>
        )}
        <button className="btn btn-primary btn-block" onClick={nextTurn}>
          {willChangeDealer ? "Pass the Deck" : "Next Card"}
        </button>
      </div>
      <HistoryStrip history={state.history} />
    </div>
  );
}
