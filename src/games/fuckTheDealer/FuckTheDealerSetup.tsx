import { useState } from "react";
import { Link } from "react-router-dom";
import type { FtdSettings } from "./types";

interface Props {
  onStart: (settings: FtdSettings) => void;
}

const DEFAULT_PLAYER_COUNT = 4;
const DEFAULT_NAMES = ["Bobby", "Pookie", "Miller", "Chewy"];

function defaultNameFor(index: number) {
  return DEFAULT_NAMES[index] ?? `Player ${index + 1}`;
}

export function FuckTheDealerSetup({ onStart }: Props) {
  const [names, setNames] = useState<string[]>(
    Array.from({ length: DEFAULT_PLAYER_COUNT }, (_, i) => defaultNameFor(i))
  );

  const setPlayerCount = (count: number) => {
    const clamped = Math.max(2, Math.min(16, count));
    setNames((prev) => {
      const next = [...prev];
      while (next.length < clamped) next.push(defaultNameFor(next.length));
      while (next.length > clamped) next.pop();
      return next;
    });
  };

  const updateName = (index: number, value: string) => {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  const canStart = names.every((n) => n.trim().length > 0);

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Fuck the Dealer</h1>
        <p>Guess the rank. Miss too many and you're the new dealer.</p>
      </div>

      <div className="stack">
        <div className="card-panel">
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <strong>Players</strong>
              <div className="text-dim" style={{ fontSize: "0.85rem" }}>
                First name in the list starts as dealer
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button
                className="btn"
                style={{ minHeight: 40, padding: "8px 14px" }}
                onClick={() => setPlayerCount(names.length - 1)}
                disabled={names.length <= 2}
              >
                −
              </button>
              <span style={{ minWidth: 24, textAlign: "center", fontWeight: 700 }}>
                {names.length}
              </span>
              <button
                className="btn"
                style={{ minHeight: 40, padding: "8px 14px" }}
                onClick={() => setPlayerCount(names.length + 1)}
                disabled={names.length >= 16}
              >
                +
              </button>
            </div>
          </div>

          <div className="stack" style={{ marginTop: 12 }}>
            {names.map((name, i) => (
              <input
                key={i}
                value={name}
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
            ))}
          </div>
        </div>

        <div className="card-panel text-dim" style={{ fontSize: "0.85rem" }}>
          <strong style={{ color: "var(--text)" }}>How it works</strong>
          <div style={{ marginTop: 6 }}>
            • Correct on 1st guess → dealer drinks <strong>10 sec</strong>
            <br />
            • Correct on 2nd guess → dealer drinks <strong>5 sec</strong>
            <br />
            • Miss both → guesser drinks the rank difference in seconds
            <br />
            • 3 fails in a row → deck passes to the next player
          </div>
        </div>
      </div>

      <div className="spacer" />

      <div className="stack">
        <button
          className="btn btn-primary btn-block"
          disabled={!canStart}
          onClick={() => onStart({ playerNames: names.map((n) => n.trim()) })}
        >
          Deal Me In
        </button>
        <Link to="/" className="btn btn-ghost btn-block text-center">
          Back to games
        </Link>
      </div>
    </div>
  );
}
