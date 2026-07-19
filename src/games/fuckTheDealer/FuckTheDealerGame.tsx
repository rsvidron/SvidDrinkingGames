import { useEffect, useState } from "react";
import { PlayingCard } from "../../components/PlayingCard";
import { RANKS, suitSymbol, type Rank } from "../../lib/deck";
import { directionHint, initFtd, rankDifference } from "./engine";
import type { FtdSharedState } from "./sharedState";
import type { FtdHistoryEntry, FtdState } from "./types";

interface Props {
  publish: (state: FtdSharedState) => void;
  onRestart: () => void;
}

function toSharedState(state: FtdState): FtdSharedState {
  return {
    cardsLeft: state.deck.length,
    consecutiveFails: state.consecutiveFails,
    history: state.history,
    phase: state.phase,
    // Only surface the current card on result (or gameover), never during peek —
    // viewer must not see the card while the guesser is still guessing.
    currentCardReveal:
      state.phase === "result" || state.phase === "gameover" ? state.lastEntry : null,
    dealerJustChanged: state.dealerJustChanged,
  };
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
        gap: 8,
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
              padding: "16px 0",
              minHeight: 60,
              fontSize: "1.5rem",
              fontWeight: 700,
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

export function FuckTheDealerGame({ publish, onRestart }: Props) {
  const [state, setState] = useState<FtdState>(() => initFtd());

  useEffect(() => {
    publish(toSharedState(state));
  }, [state, publish]);

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
      if (prev.firstGuess == null) {
        if (guess === card.rank) {
          const entry: FtdHistoryEntry = {
            card,
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
        return { ...prev, firstGuess: guess };
      }

      if (guess === card.rank) {
        const entry: FtdHistoryEntry = {
          card,
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

      const diffFirst = rankDifference(prev.firstGuess!, card.rank);
      const diffSecond = rankDifference(guess, card.rank);
      const seconds = Math.min(diffFirst, diffSecond);
      const entry: FtdHistoryEntry = {
        card,
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
      const consecutiveFails = missedThreshold ? 0 : prev.consecutiveFails;
      const isDeckEmpty = prev.deck.length === 0;
      return {
        ...prev,
        consecutiveFails,
        currentCard: null,
        firstGuess: null,
        dealerJustChanged: missedThreshold,
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
        <div style={{ flex: 1 }} />
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
          <h1>Pass the phone to the dealer</h1>
          <p>
            {state.deck.length} cards left &middot; {state.consecutiveFails}/3 fails
          </p>
        </div>
        <div className="stack" style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
          {state.dealerJustChanged && (
            <div className="card-panel text-center" style={{ borderColor: "var(--gold)" }}>
              <strong style={{ color: "var(--gold)" }}>Deck passes to the next player!</strong>
              <div className="text-dim">3 fails reset.</div>
            </div>
          )}
          <div className="card-panel text-center">
            <strong>Guesser, look away!</strong>
            <div className="text-dim">
              Dealer peeks the card, then asks you for a rank.
            </div>
          </div>
          <button className="btn btn-primary btn-block" onClick={beginTurn}>
            Peek Card (Dealer)
          </button>
        </div>
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
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PlayingCard card={card} size="md" />
        </div>
        <div className="stack" style={{ width: "100%", gap: 8 }}>
          {!isFirstGuess && (
            <div
              className="text-center"
              style={{
                borderTop: `2px solid ${hint === "higher" ? "var(--give)" : "var(--take)"}`,
                borderBottom: `2px solid ${hint === "higher" ? "var(--give)" : "var(--take)"}`,
                padding: "6px 0",
              }}
            >
              <strong style={{ color: hint === "higher" ? "var(--give)" : "var(--take)", fontSize: "0.95rem" }}>
                Tell them: {hint === "higher" ? "Higher!" : "Lower!"} (first guess {state.firstGuess})
              </strong>
            </div>
          )}
          <div className="text-dim text-center" style={{ fontSize: "0.8rem" }}>
            Tap the rank they guessed
          </div>
          <RankKeypad allowedRanks={allowedRanks} onPick={submitGuess} />
        </div>
      </div>
    );
  }

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
              Dealer drinks 10 seconds!
            </strong>
          )}
          {last.outcome === "correct2" && (
            <strong style={{ color: "var(--correct)", fontSize: "1.4rem" }}>
              Dealer drinks 5 seconds!
            </strong>
          )}
          {last.outcome === "missed" && (
            <strong style={{ color: "var(--take)", fontSize: "1.4rem" }}>
              Guesser drinks {last.seconds} second{last.seconds === 1 ? "" : "s"}!
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
    </div>
  );
}
