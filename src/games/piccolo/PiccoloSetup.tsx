import { useState } from "react";
import { Link } from "react-router-dom";
import type { PiccoloSettings } from "./types";

interface Props {
  onStart: (settings: PiccoloSettings) => void;
}

export function PiccoloSetup({ onStart }: Props) {
  const [spicy, setSpicy] = useState(true);

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Piccolo</h1>
        <p>Pass the phone around. Do what the card says.</p>
      </div>

      <div className="stack">
        <div className="card-panel">
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <strong>Spicy prompts</strong>
              <div className="text-dim" style={{ fontSize: "0.85rem" }}>
                Include raunchier truths, dares, and drink prompts
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button
                className="btn"
                style={{
                  minHeight: 40,
                  padding: "8px 14px",
                  background: spicy ? "var(--bg-elevated)" : "var(--take)",
                  borderColor: spicy ? "var(--border)" : "var(--take)",
                  color: spicy ? "var(--text)" : "#3a0000",
                }}
                onClick={() => setSpicy(false)}
              >
                Mild
              </button>
              <button
                className="btn"
                style={{
                  minHeight: 40,
                  padding: "8px 14px",
                  background: spicy ? "var(--take)" : "var(--bg-elevated)",
                  borderColor: spicy ? "var(--take)" : "var(--border)",
                  color: spicy ? "#3a0000" : "var(--text)",
                }}
                onClick={() => setSpicy(true)}
              >
                Spicy 🌶️
              </button>
            </div>
          </div>
        </div>

        <div className="card-panel text-dim" style={{ fontSize: "0.85rem" }}>
          <strong style={{ color: "var(--text)" }}>How it works</strong>
          <div style={{ marginTop: 6 }}>
            • Pass the phone around the circle
            <br />
            • Tap the deck to draw a card
            <br />
            • Do what the card says — drink, dare, truth, race, or rule
            <br />
            • Rule cards stay on screen until a new rule replaces them
            <br />
            • Game ends when the deck runs out
          </div>
        </div>
      </div>

      <div className="spacer" />

      <div className="stack">
        <button
          className="btn btn-primary btn-block"
          onClick={() => onStart({ spicy })}
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
