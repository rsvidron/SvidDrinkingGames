import { useState } from "react";
import { Link } from "react-router-dom";
import { maxRiverCount } from "./engine";
import type { GameSettings } from "./types";

interface Props {
  onStart: (settings: GameSettings) => void;
}

const DEFAULT_PLAYER_COUNT = 4;

export function UpDownRiverSetup({ onStart }: Props) {
  const [names, setNames] = useState<string[]>(
    Array.from({ length: DEFAULT_PLAYER_COUNT }, (_, i) => `Player ${i + 1}`)
  );
  const [riverCount, setRiverCount] = useState(8);
  const [pushMeansDrink, setPushMeansDrink] = useState(true);

  const riverCap = maxRiverCount(names.length);
  const effectiveRiverCount = Math.min(riverCount, riverCap);

  const setPlayerCount = (count: number) => {
    const clamped = Math.max(2, Math.min(12, count));
    setNames((prev) => {
      const next = [...prev];
      while (next.length < clamped) next.push(`Player ${next.length + 1}`);
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
        <h1>Up the River, Down the River</h1>
        <p>Set up your players before you deal the pyramid.</p>
      </div>

      <div className="stack">
        <div className="card-panel">
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <strong>Players</strong>
              <div className="text-dim" style={{ fontSize: "0.85rem" }}>
                Each player gets their own 4-card pyramid
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
                disabled={names.length >= 12}
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

        <div className="card-panel">
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <strong>River cards</strong>
              <div className="text-dim" style={{ fontSize: "0.85rem" }}>
                Split evenly: give 1,2,3... up the river, drink 1,2,3... down the river
                {riverCap < riverCount ? ` (max ${riverCap} with this many players)` : ""}
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button
                className="btn"
                style={{ minHeight: 40, padding: "8px 14px" }}
                onClick={() => setRiverCount((c) => Math.max(2, c - 2))}
                disabled={effectiveRiverCount <= 2}
              >
                −
              </button>
              <span style={{ minWidth: 24, textAlign: "center", fontWeight: 700 }}>
                {effectiveRiverCount}
              </span>
              <button
                className="btn"
                style={{ minHeight: 40, padding: "8px 14px" }}
                onClick={() => setRiverCount((c) => Math.min(riverCap, c + 2))}
                disabled={effectiveRiverCount >= riverCap}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="card-panel">
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <strong>On a push (tie)</strong>
              <div className="text-dim" style={{ fontSize: "0.85rem" }}>
                Higher/Lower or Inside/Outside ties with a pyramid card
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button
                className="btn"
                style={{
                  minHeight: 40,
                  padding: "8px 14px",
                  background: pushMeansDrink ? "var(--bg-elevated)" : "var(--take)",
                  borderColor: pushMeansDrink ? "var(--border)" : "var(--take)",
                  color: pushMeansDrink ? "var(--text)" : "#00203a",
                }}
                onClick={() => setPushMeansDrink(false)}
              >
                Free
              </button>
              <button
                className="btn"
                style={{
                  minHeight: 40,
                  padding: "8px 14px",
                  background: pushMeansDrink ? "var(--take)" : "var(--bg-elevated)",
                  borderColor: pushMeansDrink ? "var(--take)" : "var(--border)",
                  color: pushMeansDrink ? "#00203a" : "var(--text)",
                }}
                onClick={() => setPushMeansDrink(true)}
              >
                Drink
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="spacer" />

      <div className="stack">
        <button
          className="btn btn-primary btn-block"
          disabled={!canStart}
          onClick={() =>
            onStart({
              playerNames: names.map((n) => n.trim()),
              riverCount: effectiveRiverCount,
              pushMeansDrink,
            })
          }
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
