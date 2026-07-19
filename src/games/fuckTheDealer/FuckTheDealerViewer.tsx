import { useParams } from "react-router-dom";
import { PlayingCard } from "../../components/PlayingCard";
import { RANKS, suitSymbol, type Rank } from "../../lib/deck";
import { useViewerRoom } from "../../lib/sharedRoom";
import type { FtdHistoryEntry } from "./types";
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

const CARD_W = 56;
const CARD_H = 78;
const STACK_OFFSET = 22;
const MAX_STACK_HEIGHT = CARD_H + 3 * STACK_OFFSET; // slot for all 4 cards

function RankColumn({
  rank,
  entries,
}: {
  rank: Rank;
  entries: FtdHistoryEntry[];
}) {
  const count = entries.length;
  const exhausted = count >= 4;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: "1.05rem",
          color: exhausted ? "var(--text-dim)" : "var(--text)",
          textDecoration: exhausted ? "line-through" : "none",
          minWidth: CARD_W,
          textAlign: "center",
        }}
      >
        {rank}
      </div>
      <div
        style={{
          position: "relative",
          width: CARD_W,
          height: MAX_STACK_HEIGHT,
        }}
      >
        {[0, 1, 2, 3].map((slot) => (
          <div
            key={`slot-${slot}`}
            style={{
              position: "absolute",
              top: slot * STACK_OFFSET,
              left: 0,
              width: CARD_W,
              height: CARD_H,
              border: "1px dashed var(--border)",
              borderRadius: 10,
              opacity: 0.35,
            }}
          />
        ))}
        {entries.map((h, i) => {
          const isCorrect = h.outcome === "correct1" || h.outcome === "correct2";
          const outline = isCorrect ? "var(--correct)" : "var(--take)";
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: i * STACK_OFFSET,
                left: 0,
                outline: `2px solid ${outline}`,
                outlineOffset: -1,
                borderRadius: 10,
              }}
            >
              <PlayingCard card={h.card} size="sm" />
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: "0.7rem", color: exhausted ? "var(--text-dim)" : "var(--text)" }}>
        {count}/4
      </div>
    </div>
  );
}

function HistoryGrid({ history }: { history: FtdSharedState["history"] }) {
  const byRank: Record<Rank, FtdHistoryEntry[]> = {} as Record<Rank, FtdHistoryEntry[]>;
  for (const r of RANKS) byRank[r] = [];
  for (const h of history) byRank[h.card.rank].push(h);

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          gap: 4,
          overflowX: "auto",
          padding: "8px 4px",
          // `safe center` centers when content fits, otherwise falls back to
          // flex-start so nothing gets clipped off the leading edge.
          justifyContent: "safe center",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {RANKS.map((r) => (
          <RankColumn key={r} rank={r} entries={byRank[r]} />
        ))}
      </div>
      <div
        className="text-dim text-center"
        style={{ fontSize: "0.7rem", marginTop: 8, display: "flex", justifyContent: "center", gap: 16 }}
      >
        <span>
          <span style={{ color: "var(--correct)" }}>■</span> dealer drank
        </span>
        <span>
          <span style={{ color: "var(--take)" }}>■</span> guesser drank
        </span>
      </div>
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
    <div
      className="screen"
      style={{
        maxWidth: "none",
        padding: "8px 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", letterSpacing: 1 }}>
            FUCK THE DEALER
          </div>
          <div style={{ fontSize: "1.05rem" }}>
            <strong>Card counter</strong> — pass the deck around the circle
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: "0.85rem" }}>
          <span className="text-dim">{state.cardsLeft} left</span>
          <span
            style={{
              color: state.consecutiveFails >= 2 ? "var(--take)" : "var(--text-dim)",
              fontWeight: state.consecutiveFails >= 2 ? 700 : 400,
            }}
          >
            {state.consecutiveFails}/3 fails
          </span>
          {state.phase === "peek" && (
            <span style={{ color: "var(--accent-2)", fontWeight: 700 }}>
              🎴 guessing…
            </span>
          )}
          {state.dealerJustChanged && (
            <span style={{ color: "var(--gold)", fontWeight: 700 }}>
              👑 new dealer
            </span>
          )}
        </div>
      </div>

      {state.currentCardReveal && (
        <div
          className="text-center"
          style={{
            borderTop: `2px solid ${
              state.currentCardReveal.outcome === "missed"
                ? "var(--take)"
                : "var(--correct)"
            }`,
            borderBottom: `2px solid ${
              state.currentCardReveal.outcome === "missed"
                ? "var(--take)"
                : "var(--correct)"
            }`,
            padding: "4px 0",
            marginBottom: 8,
            fontSize: "0.95rem",
          }}
        >
          <strong>
            Last: {state.currentCardReveal.card.rank}
            {suitSymbol(state.currentCardReveal.card.suit)} &middot; guessed{" "}
            {state.currentCardReveal.guesses.join(", ")} &middot;{" "}
            <span
              style={{
                color:
                  state.currentCardReveal.outcome === "missed"
                    ? "var(--take)"
                    : "var(--correct)",
              }}
            >
              {state.currentCardReveal.outcome === "correct1" && "dealer drank 10s"}
              {state.currentCardReveal.outcome === "correct2" && "dealer drank 5s"}
              {state.currentCardReveal.outcome === "missed" &&
                `guesser drank ${state.currentCardReveal.seconds}s`}
            </span>
          </strong>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <HistoryGrid history={state.history} />
      </div>
    </div>
  );
}
