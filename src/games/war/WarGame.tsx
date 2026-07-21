import { useState } from "react";
import { GameMenu } from "../../components/GameMenu";
import { PlayingCard } from "../../components/PlayingCard";
import { canDeclareWar, canFlip, compareRanks, initWar } from "./engine";
import type { WarSettings, WarState } from "./types";

interface Props {
  settings: WarSettings;
  onMenuRestart: () => void;
}

const WAR_RULES = (
  <>
    <p style={{ marginTop: 0 }}>
      Two players each flip a card. Higher rank wins the hand — the loser
      drinks.
    </p>
    <ul style={{ paddingLeft: 20 }}>
      <li>
        <strong>Same rank → WAR.</strong> Each player burns 3 face-down cards
        from the top, then flips a 4th. Higher card wins the war and the
        loser takes the war penalty.
      </li>
      <li>
        <strong>War tied again?</strong> Another war stacks on top — more
        cards burn, higher penalty.
      </li>
      <li>
        The game ends when the deck can't afford another flip.
      </li>
    </ul>
  </>
);

export function WarGame({ settings, onMenuRestart }: Props) {
  const [state, setState] = useState<WarState>(() => initWar(settings));
  const menu = <GameMenu gameTitle="War" rules={WAR_RULES} onRestart={onMenuRestart} />;

  function flipInitial() {
    setState((prev) => {
      if (!canFlip(prev.deck)) return { ...prev, phase: "gameover" };
      const [c1, c2, ...rest] = prev.deck;
      const cmp = compareRanks(c1, c2);
      if (cmp === -1) {
        // Tied — enter war state
        return {
          ...prev,
          deck: rest,
          p1Card: c1,
          p2Card: c2,
          warBurn: 0,
          handsPlayed: prev.handsPlayed + 1,
          warsHad: prev.warsHad + 1,
          lastResult: null,
          phase: "war",
        };
      }
      const winner = cmp; // 0 or 1
      const loser = (1 - cmp) as 0 | 1;
      const drinksLost = prev.regularDrinks;
      const nextDrinks: [number, number] = [...prev.drinks];
      nextDrinks[loser] += drinksLost;
      return {
        ...prev,
        deck: rest,
        p1Card: c1,
        p2Card: c2,
        warBurn: 0,
        handsPlayed: prev.handsPlayed + 1,
        drinks: nextDrinks,
        lastResult: {
          winner,
          loser,
          drinksLost,
          wasWar: false,
          warDepth: 0,
        },
        phase: "revealed",
      };
    });
  }

  function declareWar() {
    setState((prev) => {
      if (!canDeclareWar(prev.deck)) {
        // Not enough cards to finish this war — call it a draw and end.
        return {
          ...prev,
          phase: "gameover",
        };
      }
      // Burn 3 per side, then flip 1 per side.
      const rest = prev.deck.slice(6); // burn 3+3
      const c1 = rest[0];
      const c2 = rest[1];
      const afterFlip = rest.slice(2);
      const newBurn = prev.warBurn + 6;
      const cmp = compareRanks(c1, c2);
      if (cmp === -1) {
        // Tied again — chain another war.
        return {
          ...prev,
          deck: afterFlip,
          p1Card: c1,
          p2Card: c2,
          warBurn: newBurn,
          warsHad: prev.warsHad + 1,
          lastResult: null,
          phase: "war",
        };
      }
      const winner = cmp;
      const loser = (1 - cmp) as 0 | 1;
      const drinksLost = prev.warDrinks;
      const nextDrinks: [number, number] = [...prev.drinks];
      nextDrinks[loser] += drinksLost;
      return {
        ...prev,
        deck: afterFlip,
        p1Card: c1,
        p2Card: c2,
        warBurn: newBurn,
        drinks: nextDrinks,
        lastResult: {
          winner,
          loser,
          drinksLost,
          wasWar: true,
          warDepth: Math.floor(newBurn / 6),
        },
        phase: "revealed",
      };
    });
  }

  function nextHand() {
    setState((prev) => {
      if (!canFlip(prev.deck)) return { ...prev, phase: "gameover" };
      return {
        ...prev,
        p1Card: null,
        p2Card: null,
        warBurn: 0,
        lastResult: null,
        phase: "ready",
      };
    });
  }

  if (state.phase === "gameover") {
    const [d1, d2] = state.drinks;
    const overallLoser: 0 | 1 | null =
      d1 === d2 ? null : d1 > d2 ? 0 : 1;
    return (
      <>
        {menu}
        <div className="screen">
          <div className="screen-header">
            <h1>War is Over</h1>
            <p>
              {state.handsPlayed} hand{state.handsPlayed === 1 ? "" : "s"}
              {state.warsHad > 0
                ? ` · ${state.warsHad} war${state.warsHad === 1 ? "" : "s"}`
                : ""}
            </p>
          </div>
          <div className="stack" style={{ flex: 1, marginTop: 12 }}>
            <ScoreCard name={state.players[0].name} drinks={d1} />
            <ScoreCard name={state.players[1].name} drinks={d2} />
            <div
              className="card-panel text-center"
              style={{
                borderColor: overallLoser === null ? "var(--gold)" : "var(--take)",
              }}
            >
              {overallLoser === null ? (
                <strong style={{ color: "var(--gold)" }}>Perfectly tied! 🤝</strong>
              ) : (
                <>
                  <strong style={{ color: "var(--take)" }}>
                    {state.players[overallLoser].name} lost the war
                  </strong>
                  <div style={{ fontSize: "0.85rem", marginTop: 4 }}>
                    Take a final victory sip anyway.
                  </div>
                </>
              )}
            </div>
          </div>
          <button className="btn btn-primary btn-block" onClick={onMenuRestart}>
            Rematch
          </button>
        </div>
      </>
    );
  }

  const inWar = state.phase === "war";
  const revealed = state.phase === "revealed";

  return (
    <>
      {menu}
      <div className="screen">
        <div className="screen-header">
          <h1>War</h1>
          <p>
            {state.deck.length} cards left &middot; hand {state.handsPlayed + (state.phase === "ready" ? 1 : 0)}
          </p>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around", gap: 12 }}>
          <PlayerRow
            name={state.players[0].name}
            drinks={state.drinks[0]}
            card={state.p1Card}
            revealed={revealed || inWar}
            highlight={
              revealed && state.lastResult
                ? state.lastResult.winner === 0
                  ? "win"
                  : state.lastResult.loser === 0
                  ? "lose"
                  : null
                : null
            }
          />

          <div className="text-dim text-center" style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: 2 }}>
            {inWar ? "⚔ TIED ⚔" : "VS"}
          </div>

          <PlayerRow
            name={state.players[1].name}
            drinks={state.drinks[1]}
            card={state.p2Card}
            revealed={revealed || inWar}
            highlight={
              revealed && state.lastResult
                ? state.lastResult.winner === 1
                  ? "win"
                  : state.lastResult.loser === 1
                  ? "lose"
                  : null
                : null
            }
          />
        </div>

        {state.warBurn > 0 && (
          <div className="text-dim text-center" style={{ fontSize: "0.8rem", marginTop: 8 }}>
            🔥 {state.warBurn} cards burned in this war
          </div>
        )}

        {revealed && state.lastResult && (
          <div
            className="card-panel text-center"
            style={{
              borderColor: state.lastResult.wasWar ? "var(--gold)" : "var(--take)",
              marginTop: 12,
            }}
          >
            <strong
              style={{
                color: state.lastResult.wasWar ? "var(--gold)" : "var(--take)",
                fontSize: "1.2rem",
              }}
            >
              {state.lastResult.wasWar ? "⚔ War won by " : ""}
              {state.players[state.lastResult.winner].name}
            </strong>
            <div style={{ marginTop: 4 }}>
              {state.players[state.lastResult.loser].name} drinks{" "}
              {state.lastResult.drinksLost}
            </div>
          </div>
        )}

        <div className="stack" style={{ marginTop: 12 }}>
          {state.phase === "ready" && (
            <button
              className="btn btn-primary btn-block"
              onClick={flipInitial}
              disabled={!canFlip(state.deck)}
            >
              Flip Cards
            </button>
          )}
          {state.phase === "war" && (
            <button
              className="btn btn-block"
              style={{ background: "var(--gold)", borderColor: "var(--gold)", color: "#3a2c00" }}
              onClick={declareWar}
              disabled={!canDeclareWar(state.deck)}
            >
              {canDeclareWar(state.deck) ? "⚔ Declare War" : "Not enough cards left"}
            </button>
          )}
          {state.phase === "revealed" && (
            <button
              className="btn btn-primary btn-block"
              onClick={nextHand}
              disabled={!canFlip(state.deck)}
            >
              {canFlip(state.deck) ? "Next Hand" : "Finish"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function PlayerRow({
  name,
  drinks,
  card,
  revealed,
  highlight,
}: {
  name: string;
  drinks: number;
  card: import("../../lib/deck").Card | null;
  revealed: boolean;
  highlight: "win" | "lose" | null;
}) {
  const borderColor =
    highlight === "win"
      ? "var(--correct)"
      : highlight === "lose"
      ? "var(--take)"
      : "transparent";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: 12,
        borderRadius: 12,
        border: `2px solid ${borderColor}`,
        transition: "border-color 0.15s ease",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{name}</div>
        <div className="text-dim" style={{ fontSize: "0.8rem" }}>
          🍺 {drinks} drink{drinks === 1 ? "" : "s"}
        </div>
      </div>
      <PlayingCard card={revealed && card ? card : undefined} faceDown={!revealed || !card} size="md" />
    </div>
  );
}

function ScoreCard({ name, drinks }: { name: string; drinks: number }) {
  return (
    <div className="card-panel row" style={{ justifyContent: "space-between", alignItems: "center" }}>
      <strong>{name}</strong>
      <span style={{ color: "var(--take)" }}>
        🍺 {drinks} drink{drinks === 1 ? "" : "s"}
      </span>
    </div>
  );
}
