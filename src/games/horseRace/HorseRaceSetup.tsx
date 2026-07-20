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

function nextFreeSuit(picks: (Suit | null)[]): Suit | null {
  return SUITS.find((s) => !picks.includes(s)) ?? null;
}

export function HorseRaceSetup({ onStart }: Props) {
  const [players, setPlayers] = useState<DraftPlayer[]>(() => [
    { name: "Bobby", suit: "hearts" },
    { name: "Pookie", suit: "spades" },
  ]);
  const [raceLength, setRaceLength] = useState(7);

  function setCount(n: number) {
    const clamped = Math.max(2, Math.min(4, n));
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

  const takenBy: Partial<Record<Suit, number>> = {};
  players.forEach((p, i) => {
    if (p.suit) takenBy[p.suit] = i;
  });

  const allValid =
    players.every((p) => p.name.trim().length > 0 && p.suit !== null) &&
    new Set(players.map((p) => p.suit)).size === players.length;

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
                Each player picks a unique suit
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
                disabled={players.length >= 4}
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
                    const owner = takenBy[s];
                    const takenByOther = owner !== undefined && owner !== i;
                    const picked = p.suit === s;
                    return (
                      <button
                        key={s}
                        className="btn"
                        disabled={takenByOther}
                        onClick={() => updateSuit(i, s)}
                        style={{
                          minHeight: 44,
                          padding: "6px 4px",
                          background: picked ? "#f5f2ea" : "var(--bg-elevated)",
                          borderColor: picked ? "#f5f2ea" : "var(--border)",
                          color: picked ? SUIT_COLOR[s] : "var(--text)",
                          opacity: takenByOther ? 0.3 : 1,
                          fontSize: "1.1rem",
                          fontWeight: 700,
                        }}
                      >
                        {suitSymbol(s)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
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
            that player drinks 1
            <br />
            • First horse across the finish line wins — that player gives out
            5 drinks
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
          {allValid ? "Start the Race" : "Give each player a unique suit"}
        </button>
        <Link to="/" className="btn btn-ghost btn-block text-center">
          Back to games
        </Link>
      </div>
    </div>
  );
}
