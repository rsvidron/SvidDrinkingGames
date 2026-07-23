import { useState } from "react";
import { GameMenu } from "../../components/GameMenu";
import { PlayingCard } from "../../components/PlayingCard";
import {
  beginPlayerTurn,
  dealHand,
  dealerPlay,
  handTotal,
  initBlackjack,
  playerDouble,
  playerHit,
  playerStand,
  readyForNextHand,
  setBet,
} from "./engine";
import type { BlackjackSettings, BlackjackState, PlayerHand } from "./types";

interface Props {
  settings: BlackjackSettings;
  onMenuRestart: () => void;
}

const BLACKJACK_RULES = (
  <>
    <p style={{ marginTop: 0 }}>
      Beat the dealer. Each player privately plays their own hand — pass the
      phone between turns.
    </p>
    <ul style={{ paddingLeft: 20 }}>
      <li>
        <strong>On your turn:</strong> set your bet on the pass screen, then
        reveal your hand.
      </li>
      <li>
        <strong>Hit</strong> to take another card, <strong>Stand</strong> to
        keep your total, or <strong>Double</strong> to double your bet + take
        one card + auto-stand.
      </li>
      <li>
        <strong>Bust:</strong> over 21. You lose your bet automatically, no
        matter what the dealer does.
      </li>
      <li>
        <strong>Blackjack:</strong> 21 on the deal (Ace + 10-value). Pays 3:2
        (or 2:1) unless the dealer also has one.
      </li>
      <li>
        Dealer flips the hole card after everyone stands, then hits until 17+.
      </li>
      <li>
        <strong>Loser drinks their bet.</strong> Winner gives it out at the
        table.
      </li>
    </ul>
  </>
);

export function BlackjackGame({ settings, onMenuRestart }: Props) {
  const [state, setState] = useState<BlackjackState>(() => initBlackjack(settings));
  const [showLastResults, setShowLastResults] = useState(true);

  const settingsPane = (
    <BlackjackSettingsPane
      minBet={state.minBet}
      maxBet={state.maxBet}
      allowDouble={state.allowDouble}
      payoutMultiplier={state.blackjackPayoutMultiplier}
      onMinBet={(n) => setState((p) => ({ ...p, minBet: n }))}
      onMaxBet={(n) => setState((p) => ({ ...p, maxBet: n }))}
      onAllowDouble={(v) => setState((p) => ({ ...p, allowDouble: v }))}
      onPayoutMultiplier={(n) => setState((p) => ({ ...p, blackjackPayoutMultiplier: n }))}
    />
  );

  const menu = (
    <GameMenu
      gameTitle="Blackjack"
      rules={BLACKJACK_RULES}
      onRestart={onMenuRestart}
      settings={settingsPane}
    />
  );

  // ============== Phase renderers ==============

  if (state.phase === "ready") {
    return (
      <>
        {menu}
        <div className="screen">
          <div className="screen-header">
            <h1>Blackjack</h1>
            <p>Hand {state.handsPlayed + 1}</p>
          </div>

          {state.results && showLastResults ? (
            <LastResultsBanner state={state} onDismiss={() => setShowLastResults(false)} />
          ) : null}

          <div className="stack" style={{ flex: 1 }}>
            <ScoreBoard state={state} />
          </div>

          <div className="spacer" />

          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              setShowLastResults(true);
              setState((p) => dealHand(p));
            }}
          >
            Deal hand
          </button>
        </div>
      </>
    );
  }

  if (state.phase === "pass") {
    const activeName = state.players[state.activePlayerIdx].name;
    const activeHand = state.playerHands[state.activePlayerIdx];
    return (
      <>
        {menu}
        <div className="screen">
          <div className="screen-header">
            <h1>{activeName}'s turn</h1>
            <p>Set your bet, then tap to see your hand</p>
          </div>

          <div className="stack" style={{ flex: 1, justifyContent: "center" }}>
            <div className="card-panel text-center" style={{ padding: 24 }}>
              <div className="text-dim" style={{ fontSize: "0.85rem", marginBottom: 8 }}>
                YOUR BET
              </div>
              <div
                className="row"
                style={{ justifyContent: "center", alignItems: "center", gap: 20 }}
              >
                <button
                  className="btn"
                  style={{ minHeight: 52, minWidth: 52, fontSize: "1.4rem" }}
                  onClick={() => setState((p) => setBet(p, activeHand.bet - 1))}
                  disabled={activeHand.bet <= state.minBet}
                >
                  −
                </button>
                <div style={{ fontSize: "2.4rem", fontWeight: 800, minWidth: 60 }}>
                  {activeHand.bet}
                </div>
                <button
                  className="btn"
                  style={{ minHeight: 52, minWidth: 52, fontSize: "1.4rem" }}
                  onClick={() => setState((p) => setBet(p, activeHand.bet + 1))}
                  disabled={activeHand.bet >= state.maxBet}
                >
                  +
                </button>
              </div>
              <div className="text-dim" style={{ fontSize: "0.8rem", marginTop: 6 }}>
                drinks
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-block"
            onClick={() => setState((p) => beginPlayerTurn(p))}
          >
            Deal me in
          </button>
        </div>
      </>
    );
  }

  if (state.phase === "playing") {
    const activeName = state.players[state.activePlayerIdx].name;
    const activeHand = state.playerHands[state.activePlayerIdx];
    const { total, soft } = handTotal(activeHand.cards);
    const canHit = activeHand.status === "playing" && total < 21;
    const canDouble =
      state.allowDouble && activeHand.status === "playing" && activeHand.cards.length === 2;
    return (
      <>
        {menu}
        <div className="screen" style={{ padding: "8px 12px" }}>
          <div className="screen-header" style={{ marginBottom: 6 }}>
            <div className="text-dim" style={{ fontSize: "0.8rem", letterSpacing: 2 }}>
              DEALER
            </div>
          </div>

          <DealerHandView cards={state.dealerHand} revealed={false} />

          <div className="text-dim text-center" style={{ margin: "16px 0 8px" }}>
            {activeName} · bet {activeHand.bet}
          </div>

          <PlayerHandView hand={activeHand} />

          <div
            className="text-center"
            style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 6 }}
          >
            {total}
            {soft && total <= 21 ? " (soft)" : ""}
          </div>

          <div className="spacer" />

          <div className="stack">
            <div className="row" style={{ gap: 8 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => setState((p) => playerHit(p))}
                disabled={!canHit}
              >
                Hit
              </button>
              <button
                className="btn"
                style={{ flex: 1, background: "var(--accent-2)", borderColor: "var(--accent-2)", color: "#04211d", fontWeight: 700 }}
                onClick={() => setState((p) => playerStand(p))}
              >
                Stand
              </button>
            </div>
            {state.allowDouble && (
              <button
                className="btn btn-block"
                onClick={() => setState((p) => playerDouble(p))}
                disabled={!canDouble}
                style={{
                  background: canDouble ? "var(--gold)" : undefined,
                  borderColor: canDouble ? "var(--gold)" : undefined,
                  color: canDouble ? "#3a2c00" : undefined,
                  fontWeight: 700,
                }}
              >
                Double ({activeHand.bet * 2})
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  if (state.phase === "dealerReveal") {
    return (
      <>
        {menu}
        <div className="screen">
          <div className="screen-header">
            <h1>All hands in</h1>
            <p>Tap to reveal the dealer</p>
          </div>

          <div className="stack" style={{ flex: 1, justifyContent: "center" }}>
            <DealerHandView cards={state.dealerHand} revealed={false} />
          </div>

          <button
            className="btn btn-primary btn-block"
            onClick={() => setState((p) => dealerPlay(p))}
          >
            Flip
          </button>
        </div>
      </>
    );
  }

  // Results
  const dealerTotal = handTotal(state.dealerHand).total;
  return (
    <>
      {menu}
      <div className="screen" style={{ padding: "8px 12px" }}>
        <div className="screen-header" style={{ marginBottom: 6 }}>
          <div className="text-dim" style={{ fontSize: "0.8rem", letterSpacing: 2 }}>
            DEALER · {dealerTotal}
            {dealerTotal > 21 ? " (BUST)" : ""}
          </div>
        </div>

        <DealerHandView cards={state.dealerHand} revealed={true} />

        <div className="stack" style={{ marginTop: 16, flex: 1 }}>
          {state.playerHands.map((hand, idx) => (
            <PlayerResultRow
              key={idx}
              name={state.players[idx].name}
              hand={hand}
              outcome={state.results?.[idx].outcome ?? "push"}
              drinksDrunk={state.results?.[idx].drinksDrunk ?? 0}
              drinksGiven={state.results?.[idx].drinksGiven ?? 0}
            />
          ))}
        </div>

        <div className="spacer" />

        <button
          className="btn btn-primary btn-block"
          onClick={() => setState((p) => readyForNextHand(p))}
        >
          Next hand
        </button>
      </div>
    </>
  );
}

// ============== Sub-components ==============

function DealerHandView({ cards, revealed }: { cards: Card[]; revealed: boolean }) {
  if (cards.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        <PlayingCard faceDown size="md" />
        <PlayingCard faceDown size="md" />
      </div>
    );
  }
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
      {cards.map((c, i) => (
        <PlayingCard
          key={c.id}
          card={c}
          faceDown={!revealed && i === 1}
          size="md"
        />
      ))}
    </div>
  );
}

function PlayerHandView({ hand }: { hand: PlayerHand }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
      {hand.cards.map((c) => (
        <PlayingCard key={c.id} card={c} size="md" />
      ))}
    </div>
  );
}

function PlayerResultRow({
  name,
  hand,
  outcome,
  drinksDrunk,
  drinksGiven,
}: {
  name: string;
  hand: PlayerHand;
  outcome: "win" | "lose" | "push" | "blackjack";
  drinksDrunk: number;
  drinksGiven: number;
}) {
  const { total } = handTotal(hand.cards);
  const badge = outcomeBadge(outcome, hand.status);
  return (
    <div
      className="card-panel"
      style={{
        borderColor:
          outcome === "win" || outcome === "blackjack"
            ? "var(--correct)"
            : outcome === "lose"
            ? "var(--take)"
            : "var(--border)",
      }}
    >
      <div
        className="row"
        style={{ alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}
      >
        <strong>{name}</strong>
        <span style={{ color: badge.color, fontWeight: 700, fontSize: "0.85rem" }}>
          {badge.label}
        </span>
      </div>
      <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
        {hand.cards.map((c) => (
          <PlayingCard key={c.id} card={c} size="sm" />
        ))}
        <div
          style={{
            fontSize: "1.2rem",
            fontWeight: 700,
            marginLeft: "auto",
            alignSelf: "center",
          }}
        >
          {total}
          {hand.status === "busted" ? " · BUST" : ""}
        </div>
      </div>
      <div
        className="row"
        style={{ marginTop: 8, gap: 12, fontSize: "0.85rem", justifyContent: "flex-end" }}
      >
        {drinksDrunk > 0 && (
          <span style={{ color: "var(--take)" }}>🍺 drink {drinksDrunk}</span>
        )}
        {drinksGiven > 0 && (
          <span style={{ color: "var(--give)" }}>💧 give {drinksGiven}</span>
        )}
        {drinksDrunk === 0 && drinksGiven === 0 && (
          <span className="text-dim">push</span>
        )}
      </div>
    </div>
  );
}

function outcomeBadge(
  outcome: "win" | "lose" | "push" | "blackjack",
  status: PlayerHand["status"]
): { label: string; color: string } {
  if (outcome === "blackjack") return { label: "BLACKJACK", color: "var(--gold)" };
  if (outcome === "win") return { label: "WIN", color: "var(--correct)" };
  if (outcome === "lose") {
    return {
      label: status === "busted" ? "BUST" : "LOSE",
      color: "var(--take)",
    };
  }
  return { label: "PUSH", color: "var(--text-dim)" };
}

function LastResultsBanner({
  state,
  onDismiss,
}: {
  state: BlackjackState;
  onDismiss: () => void;
}) {
  if (!state.results) return null;
  return (
    <div
      className="card-panel"
      style={{ borderColor: "var(--gold)", marginBottom: 8 }}
      onClick={onDismiss}
    >
      <div className="text-dim" style={{ fontSize: "0.75rem", letterSpacing: 2 }}>
        LAST HAND
      </div>
      <div style={{ marginTop: 4, fontSize: "0.9rem" }}>
        {state.results
          .map((r) => {
            const label =
              r.outcome === "blackjack"
                ? "BJ"
                : r.outcome === "win"
                ? "W"
                : r.outcome === "lose"
                ? "L"
                : "P";
            return `${state.players[r.playerIdx].name} ${label}`;
          })
          .join(" · ")}
      </div>
    </div>
  );
}

function ScoreBoard({ state }: { state: BlackjackState }) {
  return (
    <div className="stack">
      {state.players.map((p, idx) => (
        <div key={idx} className="card-panel row" style={{ justifyContent: "space-between" }}>
          <strong>{p.name}</strong>
          <div className="row" style={{ gap: 12, fontSize: "0.9rem" }}>
            <span style={{ color: "var(--take)" }}>🍺 {state.drinksDrunk[idx]}</span>
            <span style={{ color: "var(--give)" }}>💧 {state.drinksGiven[idx]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function BlackjackSettingsPane({
  minBet,
  maxBet,
  allowDouble,
  payoutMultiplier,
  onMinBet,
  onMaxBet,
  onAllowDouble,
  onPayoutMultiplier,
}: {
  minBet: number;
  maxBet: number;
  allowDouble: boolean;
  payoutMultiplier: number;
  onMinBet: (n: number) => void;
  onMaxBet: (n: number) => void;
  onAllowDouble: (v: boolean) => void;
  onPayoutMultiplier: (n: number) => void;
}) {
  return (
    <div className="stack">
      <MiniStepper
        label="Min bet"
        value={minBet}
        setValue={(v) => onMinBet(Math.min(v, maxBet))}
        min={1}
        max={10}
      />
      <MiniStepper
        label="Max bet"
        value={maxBet}
        setValue={(v) => onMaxBet(Math.max(v, minBet))}
        min={1}
        max={10}
      />
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <strong style={{ fontSize: "0.9rem" }}>Blackjack payout</strong>
        <div className="row" style={{ gap: 6 }}>
          <button
            className="btn"
            onClick={() => onPayoutMultiplier(1.5)}
            style={pillStyle(payoutMultiplier === 1.5)}
          >
            3 : 2
          </button>
          <button
            className="btn"
            onClick={() => onPayoutMultiplier(2)}
            style={pillStyle(payoutMultiplier === 2)}
          >
            2 : 1
          </button>
        </div>
      </div>
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <strong style={{ fontSize: "0.9rem" }}>Doubling down</strong>
        <button
          className="btn"
          onClick={() => onAllowDouble(!allowDouble)}
          style={pillStyle(allowDouble)}
        >
          {allowDouble ? "On" : "Off"}
        </button>
      </div>
      <div className="text-dim" style={{ fontSize: "0.75rem" }}>
        Changes apply to the next hand.
      </div>
    </div>
  );
}

function MiniStepper({
  label,
  value,
  setValue,
  min,
  max,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
      <strong style={{ fontSize: "0.9rem" }}>{label}</strong>
      <div className="row" style={{ gap: 8 }}>
        <button
          className="btn"
          style={{ minHeight: 36, padding: "6px 12px" }}
          onClick={() => setValue(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          −
        </button>
        <span style={{ minWidth: 24, textAlign: "center", fontWeight: 700 }}>{value}</span>
        <button
          className="btn"
          style={{ minHeight: 36, padding: "6px 12px" }}
          onClick={() => setValue(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    minHeight: 36,
    padding: "6px 12px",
    background: active ? "var(--accent)" : "var(--panel)",
    borderColor: active ? "var(--accent)" : "var(--border)",
    color: active ? "#fff" : "var(--text)",
    fontWeight: 700,
  };
}

// Local shim so TypeScript is happy without a full import chain in this file.
type Card = import("../../lib/deck").Card;
