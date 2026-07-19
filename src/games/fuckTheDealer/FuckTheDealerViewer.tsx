import { useParams } from "react-router-dom";
import { PlayingCard } from "../../components/PlayingCard";
import { suitSymbol } from "../../lib/deck";
import { useViewerRoom } from "../../lib/sharedRoom";
import type { FtdSharedState } from "./sharedState";

function StatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Fuck the Dealer</h1>
      </div>
      <div className="stack" style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
        <div className="card-panel text-center" style={{ maxWidth: 340 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function HistoryGrid({ history }: { history: FtdSharedState["history"] }) {
  if (history.length === 0) {
    return (
      <div className="card-panel text-center text-dim" style={{ width: "100%" }}>
        No cards played yet — waiting on the dealer to start.
      </div>
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
        gap: 12,
        width: "100%",
      }}
    >
      {history.map((h, i) => {
        const color = h.outcome === "missed" ? "var(--take)" : "var(--correct)";
        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <PlayingCard card={h.card} size="md" />
            <div style={{ fontSize: "0.75rem", textAlign: "center", color, lineHeight: 1.2 }}>
              {h.outcome === "correct1" && `${h.dealerName} -10s`}
              {h.outcome === "correct2" && `${h.dealerName} -5s`}
              {h.outcome === "missed" && `${h.guesserName} -${h.seconds}s`}
            </div>
            <div className="text-dim" style={{ fontSize: "0.65rem" }}>
              {h.guesses.join(", ")}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FuckTheDealerViewer() {
  const { code } = useParams<{ code: string }>();
  const { status, state } = useViewerRoom<FtdSharedState>(code?.toUpperCase() ?? null);

  if (status === "connecting" || status === "idle") {
    return <StatusMessage>Connecting to room {code}...</StatusMessage>;
  }
  if (status === "roomNotFound") {
    return (
      <StatusMessage>
        <strong style={{ color: "var(--take)" }}>Room not found</strong>
        <div className="text-dim">Ask the host to start a new session and scan the QR again.</div>
      </StatusMessage>
    );
  }
  if (status === "hostLeft") {
    return (
      <StatusMessage>
        <strong style={{ color: "var(--gold)" }}>Host disconnected</strong>
        <div className="text-dim">The dealer's phone dropped out. Ask them to re-open the game.</div>
      </StatusMessage>
    );
  }
  if (status === "error") {
    return (
      <StatusMessage>
        <strong style={{ color: "var(--take)" }}>Connection error</strong>
        <div className="text-dim">Try refreshing this page.</div>
      </StatusMessage>
    );
  }

  if (!state) {
    return <StatusMessage>Connected. Waiting for the game to start...</StatusMessage>;
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Fuck the Dealer</h1>
        <p>
          Dealer: <strong>{state.dealerName}</strong> &middot; Guesser:{" "}
          <strong>{state.guesserName}</strong>
        </p>
        <p className="text-dim" style={{ fontSize: "0.85rem" }}>
          {state.cardsLeft} cards left &middot; {state.consecutiveFails}/3 fails
        </p>
      </div>

      {state.dealerJustChanged && (
        <div className="card-panel text-center" style={{ borderColor: "var(--gold)", marginBottom: 12 }}>
          <strong style={{ color: "var(--gold)" }}>New Dealer: {state.dealerName}</strong>
          <div className="text-dim">Deck has passed. 3 fails reset.</div>
        </div>
      )}

      {state.phase === "peek" && (
        <div className="card-panel text-center" style={{ borderColor: "var(--accent-2)", marginBottom: 12 }}>
          <strong>Guessing in progress</strong>
          <div className="text-dim">
            {state.guesserName} is guessing. The dealer sees the card.
          </div>
        </div>
      )}

      {state.currentCardReveal && (
        <div
          className="card-panel text-center"
          style={{
            borderColor:
              state.currentCardReveal.outcome === "missed"
                ? "var(--take)"
                : "var(--correct)",
            marginBottom: 12,
          }}
        >
          <div className="text-dim" style={{ fontSize: "0.75rem", letterSpacing: 1 }}>
            LAST CARD
          </div>
          <strong style={{ fontSize: "1.4rem" }}>
            {state.currentCardReveal.card.rank}
            {suitSymbol(state.currentCardReveal.card.suit)} &middot; guesses:{" "}
            {state.currentCardReveal.guesses.join(", ")}
          </strong>
          <div
            style={{
              color:
                state.currentCardReveal.outcome === "missed"
                  ? "var(--take)"
                  : "var(--correct)",
              marginTop: 4,
            }}
          >
            {state.currentCardReveal.outcome === "correct1" &&
              `${state.currentCardReveal.dealerName} drinks 10 sec`}
            {state.currentCardReveal.outcome === "correct2" &&
              `${state.currentCardReveal.dealerName} drinks 5 sec`}
            {state.currentCardReveal.outcome === "missed" &&
              `${state.currentCardReveal.guesserName} drinks ${state.currentCardReveal.seconds} sec`}
          </div>
        </div>
      )}

      <div className="stack" style={{ flex: 1, alignItems: "center" }}>
        <HistoryGrid history={state.history} />
      </div>
    </div>
  );
}
