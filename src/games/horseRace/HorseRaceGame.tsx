import { useState } from "react";
import { GameMenu } from "../../components/GameMenu";
import { PlayingCard } from "../../components/PlayingCard";
import { suitSymbol, type Card, type Suit } from "../../lib/deck";
import { activeSuits, findSoleLast, initHorseRace } from "./engine";
import type { HrSettings, HrState } from "./types";

interface Props {
  settings: HrSettings;
  onMenuRestart: () => void;
}

const HR_RULES = (
  <>
    <p style={{ marginTop: 0 }}>
      Each player picks a suit. That suit's ace is their horse. Cards flip
      from the deck one at a time — a card of your suit advances your horse
      one space.
    </p>
    <ul style={{ paddingLeft: 20 }}>
      <li>
        <strong>Solo last place</strong> — any time a new horse falls into
        sole last place, that player drinks 1.
      </li>
      <li>
        <strong>Winning</strong> — first horse across the finish line wins.
        That player gives out 5 drinks.
      </li>
      <li>
        Deck only includes the suits that are being played, so 2 players =
        24-card deck, 4 players = 48-card deck.
      </li>
    </ul>
  </>
);

const SUIT_COLOR: Record<Suit, string> = {
  hearts: "#c1121f",
  diamonds: "#c1121f",
  clubs: "#14151a",
  spades: "#14151a",
};

function VerticalTrack({
  state,
  suit,
  playerName,
}: {
  state: HrState;
  suit: Suit;
  playerName: string;
}) {
  const pos = state.positions[suit] ?? 0;
  const cells: React.ReactNode[] = [];
  // Top row is the finish line, bottom row is the start. Iterate high → low.
  for (let i = state.raceLength; i >= 0; i -= 1) {
    const isHere = i === pos;
    const isFinish = i === state.raceLength;
    cells.push(
      <div
        key={i}
        style={{
          flex: 1,
          minHeight: 30,
          border: "1px dashed var(--border)",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isHere
            ? "#f5f2ea"
            : isFinish
            ? "rgba(255, 209, 102, 0.10)"
            : "transparent",
          color: isHere ? SUIT_COLOR[suit] : "var(--text-dim)",
          fontWeight: 700,
          fontSize: isHere ? "0.95rem" : "0.8rem",
          transition: "background 0.15s ease, transform 0.15s ease",
        }}
      >
        {isHere ? `A${suitSymbol(suit)}` : isFinish ? "🏁" : ""}
      </div>
    );
  }
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          marginBottom: 6,
        }}
      >
        {cells}
      </div>
      <div
        style={{
          textAlign: "center",
          fontSize: "0.8rem",
          fontWeight: 600,
          lineHeight: 1.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            color: SUIT_COLOR[suit] === "#c1121f" ? "var(--wrong)" : "var(--text)",
            marginRight: 3,
          }}
        >
          {suitSymbol(suit)}
        </span>
        {playerName}
      </div>
      <div
        className="text-dim"
        style={{ textAlign: "center", fontSize: "0.7rem" }}
      >
        {pos}/{state.raceLength}
      </div>
    </div>
  );
}

export function HorseRaceGame({ settings, onMenuRestart }: Props) {
  const [state, setState] = useState<HrState>(() => initHorseRace(settings));

  const menu = <GameMenu gameTitle="Horse Race" rules={HR_RULES} onRestart={onMenuRestart} />;

  function playersOf(suit: Suit) {
    return state.players.filter((p) => p.suit === suit);
  }

  function drawCard() {
    setState((prev) => {
      if (prev.phase !== "playing") return prev;
      if (prev.deck.length === 0) return prev;

      const [card, ...rest] = prev.deck;
      const newPositions = {
        ...prev.positions,
        [card.suit]: (prev.positions[card.suit] ?? 0) + 1,
      };

      // Winner?
      const finish = prev.raceLength;
      const winnerSuit = newPositions[card.suit] >= finish ? card.suit : null;

      // New sole-last suit?
      const prevSoleLast = prev.soleLastSuit;
      const newSoleLast = findSoleLast(newPositions);
      const newDrinkerSuit =
        newSoleLast && newSoleLast !== prevSoleLast ? newSoleLast : null;

      return {
        ...prev,
        deck: rest,
        positions: newPositions,
        lastCard: card,
        lastMovedSuit: card.suit,
        soleLastSuit: newSoleLast,
        drinkerSuit: newDrinkerSuit,
        winnerSuit,
        phase: winnerSuit ? "gameover" : "playing",
      };
    });
  }

  function dismissDrinker() {
    setState((prev) => ({ ...prev, drinkerSuit: null }));
  }

  function nameList(suit: Suit): string {
    const names = playersOf(suit).map((p) => p.name);
    if (names.length <= 1) return names[0] ?? "";
    if (names.length === 2) return `${names[0]} & ${names[1]}`;
    return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
  }

  if (state.phase === "gameover") {
    const winnerSuit = state.winnerSuit!;
    const winners = playersOf(winnerSuit);
    return (
      <>
        {menu}
        <div className="screen">
          <div className="screen-header">
            <h1>
              🏆 {nameList(winnerSuit)} win{winners.length === 1 ? "s" : ""}!
            </h1>
            <p>
              {suitSymbol(winnerSuit)} crossed the finish line first — give
              out 5 drinks{winners.length > 1 ? " (split it however)" : ""}.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              marginTop: 12,
              flex: 1,
              minHeight: 300,
            }}
          >
            {activeSuits({ players: state.players, raceLength: state.raceLength }).map(
              (suit) => (
                <VerticalTrack
                  key={suit}
                  state={state}
                  suit={suit}
                  playerName={nameList(suit)}
                />
              )
            )}
          </div>
          <button className="btn btn-primary btn-block" onClick={onMenuRestart}>
            Race Again
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {menu}
      <div className="screen">
        <div className="screen-header">
          <h1>Horse Race</h1>
          <p>
            {state.deck.length} cards left &middot; First to {state.raceLength}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 4,
            flex: 1,
            minHeight: 0,
          }}
        >
          {activeSuits({ players: state.players, raceLength: state.raceLength }).map(
            (suit) => (
              <VerticalTrack
                key={suit}
                state={state}
                suit={suit}
                playerName={nameList(suit)}
              />
            )
          )}
        </div>

        <div
          className="stack"
          style={{ alignItems: "center", gap: 10, marginTop: 12 }}
        >
          <LastCardOrBack card={state.lastCard} />
          <button
            className="btn btn-primary btn-block"
            onClick={drawCard}
            disabled={state.deck.length === 0}
          >
            {state.deck.length === 0 ? "Deck empty" : "Draw Card"}
          </button>
        </div>

        {state.drinkerSuit && (
          <div className="modal-backdrop" onClick={dismissDrinker}>
            <div
              className="modal-card"
              style={{ borderColor: "var(--take)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🥴</div>
              <strong style={{ fontSize: "2rem", color: "var(--take)" }}>
                {nameList(state.drinkerSuit)}
              </strong>
              <div style={{ marginTop: 8 }}>
                {suitSymbol(state.drinkerSuit)} just fell into last — drink 1
                {playersOf(state.drinkerSuit).length > 1 ? " each" : ""}!
              </div>
              <button
                className="btn btn-primary btn-block"
                style={{ marginTop: 16 }}
                onClick={dismissDrinker}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function LastCardOrBack({ card }: { card: Card | null }) {
  if (!card) {
    return (
      <div className="text-dim text-center" style={{ fontSize: "0.85rem" }}>
        Tap Draw Card to start the race
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div className="text-dim" style={{ fontSize: "0.75rem", letterSpacing: 1 }}>
        LAST DRAWN
      </div>
      <PlayingCard card={card} size="md" />
    </div>
  );
}
