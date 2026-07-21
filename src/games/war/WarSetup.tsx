import { useState } from "react";
import { Link } from "react-router-dom";
import type { WarSettings, WarTapMode, WarMode } from "./types";

interface Props {
  onStart: (settings: WarSettings) => void;
}

export function WarSetup({ onStart }: Props) {
  const [p1Name, setP1Name] = useState("Bobby");
  const [p2Name, setP2Name] = useState("Pookie");
  const [regularDrinks, setRegularDrinks] = useState(1);
  const [warDrinks, setWarDrinks] = useState(3);
  const [tapMode, setTapMode] = useState<WarTapMode>("either");
  const [mode, setMode] = useState<WarMode>("simple");

  const canStart = p1Name.trim().length > 0 && p2Name.trim().length > 0;

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>War</h1>
        <p>1 vs 1. High card wins the hand. Loser drinks.</p>
      </div>

      <div className="stack">
        <div className="card-panel">
          <strong>Players</strong>
          <div className="text-dim" style={{ fontSize: "0.85rem" }}>
            Two players. Higher card wins, tied cards trigger a WAR.
          </div>
          <div className="stack" style={{ marginTop: 12, gap: 8 }}>
            <input
              value={p1Name}
              onChange={(e) => setP1Name(e.target.value)}
              placeholder="Player 1"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
              spellCheck={false}
              style={inputStyle}
            />
            <input
              value={p2Name}
              onChange={(e) => setP2Name(e.target.value)}
              placeholder="Player 2"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
              spellCheck={false}
              style={inputStyle}
            />
          </div>
        </div>

        <Stepper
          label="Drinks per hand"
          hint="Loser drinks this each round"
          value={regularDrinks}
          setValue={setRegularDrinks}
          min={1}
          max={5}
        />

        <Stepper
          label="Drinks per WAR"
          hint="Bonus penalty when a tie triggers a war"
          value={warDrinks}
          setValue={setWarDrinks}
          min={1}
          max={10}
        />

        <div className="card-panel">
          <strong>Game style</strong>
          <div className="text-dim" style={{ fontSize: "0.85rem" }}>
            Simple = ~26 hands, deck runs out and you're done. Traditional =
            winner keeps the cards; ends when one player runs out. Longer,
            more like the actual card game.
          </div>
          <div className="row" style={{ gap: 8, marginTop: 10 }}>
            <button
              className="btn"
              onClick={() => setMode("simple")}
              style={{
                flex: 1,
                background: mode === "simple" ? "var(--accent)" : "var(--panel)",
                borderColor: mode === "simple" ? "var(--accent)" : "var(--border)",
                color: mode === "simple" ? "#fff" : "var(--text)",
              }}
            >
              Simple
            </button>
            <button
              className="btn"
              onClick={() => setMode("traditional")}
              style={{
                flex: 1,
                background: mode === "traditional" ? "var(--accent)" : "var(--panel)",
                borderColor: mode === "traditional" ? "var(--accent)" : "var(--border)",
                color: mode === "traditional" ? "#fff" : "var(--text)",
              }}
            >
              Traditional
            </button>
          </div>
        </div>

        <div className="card-panel">
          <strong>Who flips?</strong>
          <div className="text-dim" style={{ fontSize: "0.85rem" }}>
            Either mode = one tap advances the hand. Both mode = each player
            has to tap their own button before cards flip.
          </div>
          <div className="row" style={{ gap: 8, marginTop: 10 }}>
            <button
              className="btn"
              onClick={() => setTapMode("either")}
              style={{
                flex: 1,
                background: tapMode === "either" ? "var(--accent)" : "var(--panel)",
                borderColor: tapMode === "either" ? "var(--accent)" : "var(--border)",
                color: tapMode === "either" ? "#fff" : "var(--text)",
              }}
            >
              Either taps
            </button>
            <button
              className="btn"
              onClick={() => setTapMode("both")}
              style={{
                flex: 1,
                background: tapMode === "both" ? "var(--accent)" : "var(--panel)",
                borderColor: tapMode === "both" ? "var(--accent)" : "var(--border)",
                color: tapMode === "both" ? "#fff" : "var(--text)",
              }}
            >
              Both must tap
            </button>
          </div>
        </div>

        <div className="card-panel text-dim" style={{ fontSize: "0.85rem" }}>
          <strong style={{ color: "var(--text)" }}>How it works</strong>
          <div style={{ marginTop: 6 }}>
            • Both players flip a card from the top of the deck
            <br />
            • Higher rank wins the hand — the loser drinks
            <br />
            • <strong>Same rank → WAR!</strong> Each player burns 3 face-down
            cards, then flips a 4th. Higher wins the war.
            <br />
            • If the war ties again, it stacks another war on top
            <br />
            • Game ends when the deck can't afford another flip
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
              players: [{ name: p1Name.trim() }, { name: p2Name.trim() }],
              regularDrinks,
              warDrinks,
              tapMode,
              mode,
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

const inputStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "12px 14px",
  color: "var(--text)",
  fontSize: "1rem",
};
