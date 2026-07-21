import { useEffect, useRef, useState } from "react";
import { GameMenu } from "../../components/GameMenu";
import { PlayingCard } from "../../components/PlayingCard";
import {
  canDeclareWar,
  canDeclareWarTraditional,
  canFlip,
  canFlipTraditional,
  compareRanks,
  initWar,
  shuffleForPile,
} from "./engine";
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
  const [pendingTaps, setPendingTaps] = useState<[boolean, boolean]>([false, false]);

  // Fit the card to whatever vertical space is left in the card slot.
  // Both halves have identical layouts, so we measure one and use its
  // dimensions for both cards.
  const cardSlotRef = useRef<HTMLDivElement>(null);
  // Start small so the first paint never overflows; ResizeObserver grows it.
  const [cardHeight, setCardHeight] = useState(80);
  useEffect(() => {
    const el = cardSlotRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.clientHeight - 12; // leave breathing room for the border
      const w = el.clientWidth - 12;
      const heightFromWidth = w * (196 / 140); // enforce 5:7 ratio
      const fitted = Math.min(h, heightFromWidth);
      setCardHeight(Math.max(60, fitted));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const settingsPane = (
    <WarSettingsPane
      tapMode={state.tapMode}
      regularDrinks={state.regularDrinks}
      warDrinks={state.warDrinks}
      onTapMode={(mode) => setState((prev) => ({ ...prev, tapMode: mode }))}
      onRegularDrinks={(n) => setState((prev) => ({ ...prev, regularDrinks: n }))}
      onWarDrinks={(n) => setState((prev) => ({ ...prev, warDrinks: n }))}
    />
  );
  const menu = (
    <GameMenu
      gameTitle="War"
      rules={WAR_RULES}
      onRestart={onMenuRestart}
      settings={settingsPane}
    />
  );

  // Clear any pending taps whenever the game phase changes — a new phase
  // means a new action is on offer, so old commitments shouldn't carry over.
  // Also clear if tapMode changes (switching to "either" makes them moot).
  useEffect(() => {
    setPendingTaps([false, false]);
  }, [state.phase, state.tapMode]);

  // Wrap an action so it only fires when the tap requirement is met.
  // In "either" mode a single tap fires immediately.
  // In "both" mode we mark the tapping player as ready and only fire the
  // action once both players have tapped for the current phase.
  function tap(playerIdx: 0 | 1, action: () => void) {
    if (state.tapMode === "either") {
      action();
      return;
    }
    setPendingTaps((prev) => {
      const next: [boolean, boolean] = [prev[0], prev[1]];
      next[playerIdx] = true;
      if (next[0] && next[1]) {
        // Fire on next microtask so the state update above lands cleanly,
        // and the phase-change effect above resets pendingTaps to [false, false].
        queueMicrotask(action);
      }
      return next;
    });
  }

  function flipInitial() {
    setState((prev) => {
      if (prev.mode === "traditional") {
        if (!canFlipTraditional(prev.p1Pile, prev.p2Pile)) {
          return { ...prev, phase: "gameover" };
        }
        const [c1, ...p1Rest] = prev.p1Pile;
        const [c2, ...p2Rest] = prev.p2Pile;
        const nextPot = [...prev.pot, c1, c2];
        const cmp = compareRanks(c1, c2);
        if (cmp === -1) {
          return {
            ...prev,
            p1Pile: p1Rest,
            p2Pile: p2Rest,
            pot: nextPot,
            p1Card: c1,
            p2Card: c2,
            warBurn: 0,
            handsPlayed: prev.handsPlayed + 1,
            warsHad: prev.warsHad + 1,
            lastResult: null,
            phase: "war",
          };
        }
        const winner = cmp;
        const loser = (1 - cmp) as 0 | 1;
        const drinksLost = prev.regularDrinks;
        const nextDrinks: [number, number] = [...prev.drinks];
        nextDrinks[loser] += drinksLost;
        return {
          ...prev,
          p1Pile: p1Rest,
          p2Pile: p2Rest,
          pot: nextPot,
          p1Card: c1,
          p2Card: c2,
          warBurn: 0,
          handsPlayed: prev.handsPlayed + 1,
          drinks: nextDrinks,
          lastResult: { winner, loser, drinksLost, wasWar: false, warDepth: 0 },
          phase: "revealed",
        };
      }
      // simple mode
      if (!canFlip(prev.deck)) return { ...prev, phase: "gameover" };
      const [c1, c2, ...rest] = prev.deck;
      const cmp = compareRanks(c1, c2);
      if (cmp === -1) {
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
      const winner = cmp;
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
        lastResult: { winner, loser, drinksLost, wasWar: false, warDepth: 0 },
        phase: "revealed",
      };
    });
  }

  function declareWar() {
    setState((prev) => {
      if (prev.mode === "traditional") {
        if (!canDeclareWarTraditional(prev.p1Pile, prev.p2Pile)) {
          // Whoever still has cards claims the pot and takes the win.
          const winner: 0 | 1 = prev.p1Pile.length > 0 ? 0 : 1;
          const loser = (1 - winner) as 0 | 1;
          const nextDrinks: [number, number] = [...prev.drinks];
          nextDrinks[loser] += prev.warDrinks;
          const winnerPile =
            winner === 0
              ? [...prev.p1Pile, ...shuffleForPile(prev.pot)]
              : [...prev.p2Pile, ...shuffleForPile(prev.pot)];
          return {
            ...prev,
            p1Pile: winner === 0 ? winnerPile : prev.p1Pile,
            p2Pile: winner === 1 ? winnerPile : prev.p2Pile,
            pot: [],
            drinks: nextDrinks,
            lastResult: {
              winner,
              loser,
              drinksLost: prev.warDrinks,
              wasWar: true,
              warDepth: Math.floor(prev.warBurn / 6) + 1,
            },
            // Show the result banner; Next Hand will find loser's pile empty
            // and roll to gameover.
            phase: "revealed",
          };
        }
        // Burn min(3, pileLen - 1) then flip 1 per side. Short piles play
        // whatever they've got.
        const p1Burns = Math.min(3, Math.max(0, prev.p1Pile.length - 1));
        const p2Burns = Math.min(3, Math.max(0, prev.p2Pile.length - 1));
        const p1Take = p1Burns + 1;
        const p2Take = p2Burns + 1;
        const p1Cards = prev.p1Pile.slice(0, p1Take);
        const p2Cards = prev.p2Pile.slice(0, p2Take);
        const c1 = p1Cards[p1Cards.length - 1];
        const c2 = p2Cards[p2Cards.length - 1];
        const nextPot = [...prev.pot, ...p1Cards, ...p2Cards];
        const newBurn = prev.warBurn + p1Burns + p2Burns;
        const cmp = compareRanks(c1, c2);
        if (cmp === -1) {
          return {
            ...prev,
            p1Pile: prev.p1Pile.slice(p1Take),
            p2Pile: prev.p2Pile.slice(p2Take),
            pot: nextPot,
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
        const nextDrinks: [number, number] = [...prev.drinks];
        nextDrinks[loser] += prev.warDrinks;
        return {
          ...prev,
          p1Pile: prev.p1Pile.slice(p1Take),
          p2Pile: prev.p2Pile.slice(p2Take),
          pot: nextPot,
          p1Card: c1,
          p2Card: c2,
          warBurn: newBurn,
          drinks: nextDrinks,
          lastResult: {
            winner,
            loser,
            drinksLost: prev.warDrinks,
            wasWar: true,
            warDepth: Math.floor(newBurn / 6) + 1,
          },
          phase: "revealed",
        };
      }
      // simple mode
      if (!canDeclareWar(prev.deck)) {
        return { ...prev, phase: "gameover" };
      }
      const rest = prev.deck.slice(6);
      const c1 = rest[0];
      const c2 = rest[1];
      const afterFlip = rest.slice(2);
      const newBurn = prev.warBurn + 6;
      const cmp = compareRanks(c1, c2);
      if (cmp === -1) {
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
      const nextDrinks: [number, number] = [...prev.drinks];
      nextDrinks[loser] += prev.warDrinks;
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
          drinksLost: prev.warDrinks,
          wasWar: true,
          warDepth: Math.floor(newBurn / 6),
        },
        phase: "revealed",
      };
    });
  }

  function nextHand() {
    setState((prev) => {
      if (prev.mode === "traditional") {
        // Winner claims the pot. Shuffled so deterministic loops can't form.
        const winnerIdx = prev.lastResult?.winner ?? null;
        let nextP1 = prev.p1Pile;
        let nextP2 = prev.p2Pile;
        if (prev.pot.length > 0 && winnerIdx !== null) {
          const claimed = shuffleForPile(prev.pot);
          if (winnerIdx === 0) nextP1 = [...prev.p1Pile, ...claimed];
          else nextP2 = [...prev.p2Pile, ...claimed];
        }
        const gameOver = nextP1.length === 0 || nextP2.length === 0;
        return {
          ...prev,
          p1Pile: nextP1,
          p2Pile: nextP2,
          pot: [],
          p1Card: null,
          p2Card: null,
          warBurn: 0,
          lastResult: null,
          phase: gameOver ? "gameover" : "ready",
        };
      }
      // simple mode
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

  // Mode-aware helpers used by the button + status strip.
  const isTraditional = state.mode === "traditional";
  const flipReady = isTraditional
    ? canFlipTraditional(state.p1Pile, state.p2Pile)
    : canFlip(state.deck);
  const warReady = isTraditional
    ? canDeclareWarTraditional(state.p1Pile, state.p2Pile)
    : canDeclareWar(state.deck);

  if (state.phase === "gameover") {
    const [d1, d2] = state.drinks;
    // Traditional mode: loser is whoever ran out of cards. Simple mode:
    // whoever drank the most.
    const overallLoser: 0 | 1 | null = isTraditional
      ? state.p1Pile.length === 0 && state.p2Pile.length === 0
        ? null
        : state.p1Pile.length === 0
        ? 0
        : 1
      : d1 === d2
      ? null
      : d1 > d2
      ? 0
      : 1;
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

  function highlightFor(playerIdx: 0 | 1): "win" | "lose" | null {
    if (!revealed || !state.lastResult) return null;
    if (state.lastResult.winner === playerIdx) return "win";
    if (state.lastResult.loser === playerIdx) return "lose";
    return null;
  }

  function actionButton(playerIdx: 0 | 1) {
    const iTapped = pendingTaps[playerIdx];
    const otherTapped = pendingTaps[playerIdx === 0 ? 1 : 0];
    const bothMode = state.tapMode === "both";
    // In "both" mode: show a waiting state for the player who already tapped.
    const waitingLabel = bothMode && iTapped && !otherTapped ? (
      <>Waiting for {state.players[playerIdx === 0 ? 1 : 0].name}…</>
    ) : null;

    if (state.phase === "ready") {
      const disabled = !flipReady || iTapped;
      return (
        <button
          className="btn btn-primary btn-block"
          onClick={() => tap(playerIdx, flipInitial)}
          disabled={disabled}
        >
          {waitingLabel ?? "Flip Cards"}
        </button>
      );
    }
    if (state.phase === "war") {
      const disabled = !warReady || iTapped;
      return (
        <button
          className="btn btn-block"
          style={{
            background: "var(--gold)",
            borderColor: "var(--gold)",
            color: "#3a2c00",
          }}
          onClick={() => tap(playerIdx, declareWar)}
          disabled={disabled}
        >
          {waitingLabel ?? (warReady ? "⚔ Declare War" : "Not enough cards left")}
        </button>
      );
    }
    // revealed — Next Hand is just an acknowledgment; either player
    // can advance even in "both must tap" mode so the game doesn't stall.
    // In traditional mode, "canFlip" here doesn't account for the pot that's
    // about to be awarded — always allow advancing so the winner can claim.
    const canAdvance = isTraditional ? true : flipReady;
    return (
      <button
        className="btn btn-primary btn-block"
        onClick={nextHand}
        disabled={!canAdvance}
      >
        {canAdvance ? "Next Hand" : "Finish"}
      </button>
    );
  }

  function resultBanner() {
    if (!revealed || !state.lastResult) return null;
    return (
      <div
        className="card-panel text-center"
        style={{
          borderColor: state.lastResult.wasWar ? "var(--gold)" : "var(--take)",
        }}
      >
        <strong
          style={{
            color: state.lastResult.wasWar ? "var(--gold)" : "var(--take)",
            fontSize: "1.1rem",
          }}
        >
          {state.lastResult.wasWar ? "⚔ War won by " : ""}
          {state.players[state.lastResult.winner].name}
        </strong>
        <div style={{ marginTop: 4, fontSize: "0.9rem" }}>
          {state.players[state.lastResult.loser].name} drinks{" "}
          {state.lastResult.drinksLost}
        </div>
      </div>
    );
  }

  // Each half is stacked DOM top-to-bottom as:
  //   card (flex:1, sticks to DOM top) → name label → result banner → button
  // For the top half we apply rotate(180). Because of the rotation, the
  // element at DOM top ends up nearest the screen center (near the divider),
  // and the element at DOM bottom ends up nearest the phone's outer edge
  // (right at the top player's fingertips).
  const half = (playerIdx: 0 | 1) => {
    const showCard = revealed || inWar;
    const playerCard = playerIdx === 0 ? state.p1Card : state.p2Card;
    const highlight = highlightFor(playerIdx);
    const borderColor =
      highlight === "win"
        ? "var(--correct)"
        : highlight === "lose"
        ? "var(--take)"
        : "transparent";
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "6px 0",
          minHeight: 0,
        }}
      >
        {/* Card fills the space closest to the center divider */}
        <div
          ref={playerIdx === 1 ? cardSlotRef : undefined}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            minHeight: 0,
          }}
        >
          <div
            style={{
              padding: 4,
              borderRadius: 14,
              border: `3px solid ${borderColor}`,
              transition: "border-color 0.15s ease",
            }}
          >
            <PlayingCard
              card={showCard && playerCard ? playerCard : undefined}
              faceDown={!showCard || !playerCard}
              pixelHeight={cardHeight}
            />
          </div>
        </div>

        {/* Name + drink count — small, right below the card */}
        <div style={{ textAlign: "center", fontSize: "0.95rem" }}>
          <strong>{state.players[playerIdx].name}</strong>
          <span className="text-dim" style={{ marginLeft: 10 }}>
            🍺 {state.drinks[playerIdx]}
          </span>
        </div>

        {resultBanner()}

        {actionButton(playerIdx)}
      </div>
    );
  };

  return (
    <>
      {menu}
      <div
        className="screen"
        style={{
          padding: "8px 12px",
          height: "100dvh",
          maxHeight: "100dvh",
          overflow: "hidden",
        }}
      >
        {/* Top half — rotated 180 for the player at the far end */}
        <div style={{ transform: "rotate(180deg)", flex: 1, display: "flex", minHeight: 0 }}>
          {half(0)}
        </div>

        {/* Center strip — game status shared by both */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            padding: "10px 0",
            textAlign: "center",
          }}
        >
          <div style={{ fontWeight: 700, letterSpacing: 2 }}>
            {inWar ? "⚔ TIED ⚔" : "VS"}
          </div>
          <div className="text-dim" style={{ fontSize: "0.7rem", marginTop: 2 }}>
            {isTraditional
              ? `${state.players[0].name}: ${state.p1Pile.length} · ${state.players[1].name}: ${state.p2Pile.length}`
              : `${state.deck.length} left`}
            {" · hand "}
            {state.handsPlayed + (state.phase === "ready" ? 1 : 0)}
            {state.warBurn > 0 && ` · 🔥 ${state.warBurn} burned`}
            {isTraditional && state.pot.length > 0 && ` · 🏆 ${state.pot.length} in pot`}
          </div>
        </div>

        {/* Bottom half — normal orientation for the player closest to the phone's bottom */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>{half(1)}</div>
      </div>
    </>
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

function WarSettingsPane({
  tapMode,
  regularDrinks,
  warDrinks,
  onTapMode,
  onRegularDrinks,
  onWarDrinks,
}: {
  tapMode: import("./types").WarTapMode;
  regularDrinks: number;
  warDrinks: number;
  onTapMode: (m: import("./types").WarTapMode) => void;
  onRegularDrinks: (n: number) => void;
  onWarDrinks: (n: number) => void;
}) {
  return (
    <div className="stack">
      <div>
        <div style={{ fontSize: "0.85rem", marginBottom: 8 }}>
          <strong>Who flips?</strong>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button
            className="btn"
            onClick={() => onTapMode("either")}
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
            onClick={() => onTapMode("both")}
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

      <MiniStepper
        label="Drinks per hand"
        value={regularDrinks}
        setValue={onRegularDrinks}
        min={1}
        max={5}
      />
      <MiniStepper
        label="Drinks per WAR"
        value={warDrinks}
        setValue={onWarDrinks}
        min={1}
        max={10}
      />
      <div className="text-dim" style={{ fontSize: "0.75rem" }}>
        Changes apply to the next hand — running drink totals stay.
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
        <span style={{ minWidth: 24, textAlign: "center", fontWeight: 700 }}>
          {value}
        </span>
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
