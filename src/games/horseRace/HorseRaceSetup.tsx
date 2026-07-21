import { useState } from "react";
import { Link } from "react-router-dom";
import { SUITS, suitSymbol, type Suit } from "../../lib/deck";
import type { HrSettings } from "./types";

interface Props {
  onStart: (settings: HrSettings) => void;
}

const DEFAULT_NAMES = ["Bobby", "Pookie", "Miller", "Chewy"];
const SUIT_COLOR: Record<Suit, string> = {
  hearts: "#c1121f",
  diamonds: "#c1121f",
  clubs: "#14151a",
  spades: "#14151a",
};

interface DraftPlayer {
  name: string;
  suit: Suit | null;
}

function nextFreeSuit(picks: (Suit | null)[]): Suit {
  const remaining = SUITS.find((s) => !picks.includes(s));
  return remaining ?? SUITS[picks.length % SUITS.length];
}

export function HorseRaceSetup({ onStart }: Props) {
  const [players, setPlayers] = useState<DraftPlayer[]>(() => [
    { name: "Bobby", suit: "hearts" },
    { name: "Pookie", suit: "spades" },
  ]);
  const [raceLength, setRaceLength] = useState(7);

  function setCount(n: number) {
    const clamped = Math.max(2, Math.min(12, n));
    setPlayers((prev) => {
      const next = [...prev];
      while (next.length < clamped) {
        const picks = next.map((p) => p.suit);
        next.push({
          name: DEFAULT_NAMES[next.length] ?? `Player ${next.length + 1}`,
          suit: nextFreeSuit(picks),
        });
      }
      while (next.length > clamped) next.pop();
      return next;
    });
  }

  function updateName(index: number, value: string) {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, name: value } : p)));
  }

  function updateSuit(index: number, value: Suit) {
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, suit: value } : p))
    );
  }

  // Count how many players are on each suit — used to badge shared suits.
  const suitCounts: Record<Suit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
  players.forEach((p) => {
    if (p.suit) suitCounts[p.suit] += 1;
  });
  const uniqueSuitCount = SUITS.filter((s) => suitCounts[s] > 0).length;

  const allValid = players.every((p) => p.name.trim().length > 0 && p.suit !== null);

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Horse Race</h1>
        <p>Pick a suit. First horse to the finish line wins.</p>
      </div>

      <div className="stack">
        <div className="card-panel">
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <strong>Players</strong>
              <div className="text-dim" style={{ fontSize: "0.85rem" }}>
                Up to 4 unique horses. 5+ players share suits and drink
                together.
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button
                className="btn"
                style={{ minHeight: 40, padding: "8px 14px" }}
                onClick={() => setCount(players.length - 1)}
                disabled={players.length <= 2}
              >
                −
              </button>
              <span style={{ minWidth: 24, textAlign: "center", fontWeight: 700 }}>
                {players.length}
              </span>
              <button
                className="btn"
                style={{ minHeight: 40, padding: "8px 14px" }}
                onClick={() => setCount(players.length + 1)}
                disabled={players.length >= 12}
              >
                +
              </button>
            </div>
          </div>

          <div className="stack" style={{ marginTop: 12, gap: 12 }}>
            {players.map((p, i) => (
              <div key={i} className="stack" style={{ gap: 8 }}>
                <input
                  value={p.name}
                  onChange={(e) => updateName(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    color: "var(--text)",
                    fontSize: "1rem",
                  }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {SUITS.map((s) => {
                    const picked = p.suit === s;
                    const suitCount = suitCounts[s];
                    // Show "N" badge only if this suit is shared with another player.
                    const showShareBadge = suitCount > 1;
                    return (
                      <button
                        key={s}
                        className="btn"
                        onClick={() => updateSuit(i, s)}
                        style={{
                          minHeight: 44,
                          padding: "6px 4px",
                          background: picked ? "#f5f2ea" : "var(--bg-elevated)",
                          borderColor: picked ? "#f5f2ea" : "var(--border)",
                          color: picked ? SUIT_COLOR[s] : "var(--text)",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          position: "relative",
                        }}
                      >
                        {suitSymbol(s)}
                        {showShareBadge && (
                          <span
                            style={{
                              position: "absolute",
                              top: 2,
                              right: 4,
                              fontSize: "0.6rem",
                              color: picked ? SUIT_COLOR[s] : "var(--text-dim)",
                              fontWeight: 700,
                            }}
                          >
                            {suitCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div
            className="text-dim"
            style={{ fontSize: "0.8rem", marginTop: 12 }}
          >
            {uniqueSuitCount} horse{uniqueSuitCount === 1 ? "" : "s"} racing
            {players.length > uniqueSuitCount
              ? ` · ${players.length - uniqueSuitCount} sharing`
              : ""}
          </div>
        </div>

        <div className="card-panel">
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <strong>Race length</strong>
              <div className="text-dim" style={{ fontSize: "0.85rem" }}>
                Spaces from start to the finish line
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button
                className="btn"
                style={{ minHeight: 40, padding: "8px 14px" }}
                onClick={() => setRaceLength((n) => Math.max(2, n - 1))}
                disabled={raceLength <= 2}
              >
                −
              </button>
              <span style={{ minWidth: 24, textAlign: "center", fontWeight: 700 }}>
                {raceLength}
              </span>
              <button
                className="btn"
                style={{ minHeight: 40, padding: "8px 14px" }}
                onClick={() => setRaceLength((n) => Math.min(10, n + 1))}
                disabled={raceLength >= 10}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="card-panel text-dim" style={{ fontSize: "0.85rem" }}>
          <strong style={{ color: "var(--text)" }}>How it works</strong>
          <div style={{ marginTop: 6 }}>
            • The aces of each picked suit start at position 0
            <br />
            • Tap the deck to flip the next card — the matching suit's ace
            advances 1
            <br />
            • Whenever a new horse falls into <strong>solo last place</strong>,
            everyone on that suit drinks 1
            <br />
            • First horse across the finish line wins — those players give
            out 5 drinks
          </div>
        </div>
      </div>

      <div className="spacer" />

      <div className="stack">
        <button
          className="btn btn-primary btn-block"
          disabled={!allValid}
          onClick={() =>
            onStart({
              players: players.map((p) => ({ name: p.name.trim(), suit: p.suit! })),
              raceLength,
            })
          }
        >
          {allValid ? "Start the Race" : "Give each player a suit"}
        </button>
        <Link to="/" className="btn btn-ghost btn-block text-center">
          Back to games
        </Link>
      </div>
    </div>
  );
}
