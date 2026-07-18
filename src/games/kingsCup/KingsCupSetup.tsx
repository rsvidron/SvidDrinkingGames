import { useState } from "react";
import { Link } from "react-router-dom";
import type { Gender, KcSettings } from "./types";

interface Props {
  onStart: (settings: KcSettings) => void;
}

const DEFAULT_PLAYER_COUNT = 4;
const DEFAULT_NAMES = ["Bobby", "Pookie", "Miller", "Chewy"];

function defaultNameFor(index: number) {
  return DEFAULT_NAMES[index] ?? `Player ${index + 1}`;
}

export function KingsCupSetup({ onStart }: Props) {
  const [names, setNames] = useState<string[]>(
    Array.from({ length: DEFAULT_PLAYER_COUNT }, (_, i) => defaultNameFor(i))
  );
  const [genders, setGenders] = useState<Gender[]>(
    Array.from({ length: DEFAULT_PLAYER_COUNT }, () => "guy")
  );

  const setPlayerCount = (count: number) => {
    const clamped = Math.max(2, Math.min(16, count));
    setNames((prev) => {
      const next = [...prev];
      while (next.length < clamped) next.push(defaultNameFor(next.length));
      while (next.length > clamped) next.pop();
      return next;
    });
    setGenders((prev) => {
      const next = [...prev];
      while (next.length < clamped) next.push("guy");
      while (next.length > clamped) next.pop();
      return next;
    });
  };

  const updateName = (index: number, value: string) => {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  const toggleGender = (index: number) => {
    setGenders((prev) => prev.map((g, i) => (i === index ? (g === "guy" ? "girl" : "guy") : g)));
  };

  const canStart = names.every((n) => n.trim().length > 0);

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Kings Cup</h1>
        <p>Draw cards, follow the rules, don't be the last King.</p>
      </div>

      <div className="stack">
        <div className="card-panel">
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <strong>Players</strong>
              <div className="text-dim" style={{ fontSize: "0.85rem" }}>
                Tag Guy/Girl for the Guys &amp; Chicks rounds
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
              <div key={i} className="row" style={{ gap: 8 }}>
                <input
                  value={name}
                  onChange={(e) => updateName(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  style={{
                    flex: 1,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    color: "var(--text)",
                    fontSize: "1rem",
                    minWidth: 0,
                  }}
                />
                <button
                  className="btn"
                  style={{
                    minHeight: 44,
                    padding: "8px 14px",
                    minWidth: 68,
                    background: genders[i] === "girl" ? "var(--take)" : "var(--give)",
                    borderColor: genders[i] === "girl" ? "var(--take)" : "var(--give)",
                    color: genders[i] === "girl" ? "#3a0000" : "#00203a",
                  }}
                  onClick={() => toggleGender(i)}
                >
                  {genders[i] === "girl" ? "Girl" : "Guy"}
                </button>
              </div>
            ))}
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
              playerGenders: genders,
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
