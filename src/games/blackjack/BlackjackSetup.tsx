import { useState } from "react";
import { Link } from "react-router-dom";
import type { BlackjackSettings } from "./types";

interface Props {
  onStart: (settings: BlackjackSettings) => void;
}

const DEFAULT_NAMES = ["Bobby", "Pookie", "Miller", "Chewy"];

export function BlackjackSetup({ onStart }: Props) {
  const [names, setNames] = useState(["Bobby", "Pookie", "", ""]);
  const [minBet, setMinBet] = useState(1);
  const [maxBet, setMaxBet] = useState(5);
  const [payoutMultiplier, setPayoutMultiplier] = useState(1.5);
  const [allowDouble, setAllowDouble] = useState(true);

  const activeNames = names.map((n) => n.trim()).filter((n) => n.length > 0);
  const canStart = activeNames.length >= 1 && activeNames.length <= 4;

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Blackjack</h1>
        <p>Beat the dealer. Loser drinks the bet, winner gives it out.</p>
      </div>

      <div className="stack">
        <div className="card-panel">
          <strong>Players</strong>
          <div className="text-dim" style={{ fontSize: "0.85rem" }}>
            1–4 players. Leave blank to skip. Cards stay private — pass the phone
            each turn.
          </div>
          <div className="stack" style={{ marginTop: 12, gap: 8 }}>
            {names.map((name, i) => (
              <input
                key={i}
                value={name}
                onChange={(e) => {
                  const next = [...names];
                  next[i] = e.target.value;
                  setNames(next);
                }}
                placeholder={DEFAULT_NAMES[i]}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck={false}
                style={inputStyle}
              />
            ))}
          </div>
        </div>

        <Stepper
          label="Minimum bet"
          hint="Smallest number of drinks a player can bet"
          value={minBet}
          setValue={(v) => setMinBet(Math.min(v, maxBet))}
          min={1}
          max={10}
        />

        <Stepper
          label="Maximum bet"
          hint="Largest number of drinks (before doubling down)"
          value={maxBet}
          setValue={(v) => setMaxBet(Math.max(v, minBet))}
          min={1}
          max={10}
        />

        <div className="card-panel">
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <strong>Blackjack payout</strong>
              <div className="text-dim" style={{ fontSize: "0.85rem" }}>
                Multiplier on a natural 21 (bet × this, rounded up)
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button
                className="btn"
                onClick={() => setPayoutMultiplier(1.5)}
                style={pillStyle(payoutMultiplier === 1.5)}
              >
                3 : 2
              </button>
              <button
                className="btn"
                onClick={() => setPayoutMultiplier(2)}
                style={pillStyle(payoutMultiplier === 2)}
              >
                2 : 1
              </button>
            </div>
          </div>
        </div>

        <div className="card-panel">
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <strong>Doubling down</strong>
              <div className="text-dim" style={{ fontSize: "0.85rem" }}>
                Double your bet, take exactly 1 more card
              </div>
            </div>
            <button
              className="btn"
              onClick={() => setAllowDouble((v) => !v)}
              style={pillStyle(allowDouble)}
            >
              {allowDouble ? "On" : "Off"}
            </button>
          </div>
        </div>

        <div className="card-panel text-dim" style={{ fontSize: "0.85rem" }}>
          <strong style={{ color: "var(--text)" }}>How it works</strong>
          <div style={{ marginTop: 6 }}>
            • Each hand, the phone deals every player 2 cards face-down and the
            dealer 1 up + 1 hole
            <br />
            • On your turn: set your bet, tap to reveal your hand
            <br />
            • Hit, Stand, or Double until you stand or bust
            <br />
            • After every player is done, the dealer flips and plays to 17+
            <br />
            • Higher hand wins the bet — loser drinks, winner gives out
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
              players: activeNames.map((name) => ({ name })),
              minBet,
              maxBet,
              blackjackPayoutMultiplier: payoutMultiplier,
              allowDouble,
            })
          }
        >
          Start
        </button>
        <Link to="/" className="btn btn-ghost btn-block text-center">
          Back to games
        </Link>
      </div>
    </div>
  );
}

function Stepper({
  label,
  hint,
  value,
  setValue,
  min,
  max,
}: {
  label: string;
  hint: string;
  value: number;
  setValue: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="card-panel">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <strong>{label}</strong>
          <div className="text-dim" style={{ fontSize: "0.85rem" }}>{hint}</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button
            className="btn"
            style={{ minHeight: 40, padding: "8px 14px" }}
            onClick={() => setValue(Math.max(min, value - 1))}
            disabled={value <= min}
          >
            −
          </button>
          <span style={{ minWidth: 24, textAlign: "center", fontWeight: 700 }}>
            {value}
          </span>
          <button
            className="btn"
            style={{ minHeight: 40, padding: "8px 14px" }}
            onClick={() => setValue(Math.min(max, value + 1))}
            disabled={value >= max}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    minHeight: 40,
    padding: "8px 14px",
    background: active ? "var(--accent)" : "var(--panel)",
    borderColor: active ? "var(--accent)" : "var(--border)",
    color: active ? "#fff" : "var(--text)",
    fontWeight: 700,
  };
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "12px 14px",
  color: "var(--text)",
  fontSize: "1rem",
};
