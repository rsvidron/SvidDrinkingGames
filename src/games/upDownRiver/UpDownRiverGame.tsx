import { useState } from "react";
import { PlayingCard } from "../../components/PlayingCard";
import { RiverCircle } from "./RiverCircle";
import { SUITS, suitSymbol, type Suit } from "../../lib/deck";
import {
  applyOutcome,
  handHasRank,
  initGame,
  resolveHighLow,
  resolveInsideOutside,
  resolveRedBlack,
  resolveSuit,
} from "./engine";
import { randomSaying } from "./sayings";
import type { GameSettings, GameState, PyramidOutcome } from "./types";

interface RiverResult {
  direction: "up" | "down";
  drinkValue: number;
  playerNames: string[];
  saying?: string;
}

function RiverResultModal({ result, onDismiss, buttonLabel }: {
  result: RiverResult;
  onDismiss: () => void;
  buttonLabel: string;
}) {
  const isUp = result.direction === "up";
  const color = isUp ? "var(--give)" : "var(--take)";
  const hasNames = result.playerNames.length > 0;
  const multi = result.playerNames.length > 1;
  const drinkWord = `drink${result.drinkValue > 1 ? "s" : ""}`;

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ borderColor: color }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>{isUp ? "🍻" : "🥴"}</div>
        {hasNames ? (
          <>
            <strong style={{ fontSize: "2.1rem", lineHeight: 1.2, color }}>
              {result.playerNames.join(", ")}
            </strong>
            <div style={{ fontSize: "1.1rem", marginTop: 8 }}>
              {isUp
                ? `give out ${result.drinkValue} ${drinkWord}${multi ? " each" : ""}!`
                : `drink ${result.drinkValue}${multi ? " each" : ""}!`}
            </div>
            {!isUp && result.saying && (
              <div className="text-dim" style={{ marginTop: 10, fontStyle: "italic" }}>
                "{result.saying}"
              </div>
            )}
          </>
        ) : (
          <strong style={{ fontSize: "1.2rem" }}>No matches — free round!</strong>
        )}
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 20 }}
          onClick={onDismiss}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

interface Props {
  settings: GameSettings;
  onRestart: () => void;
}

function OutcomeBanner({
  outcome,
  drinkValue,
  pushMeansDrink,
  saying,
}: {
  outcome: PyramidOutcome;
  drinkValue: number;
  pushMeansDrink: boolean;
  saying?: string;
}) {
  if (outcome === "push") {
    return (
      <div className="card-panel text-center" style={{ borderColor: "var(--gold)" }}>
        <strong>Push!</strong>
        <div className="text-dim">
          {pushMeansDrink
            ? `Same value — drink ${drinkValue} anyway.`
            : "Same value — no drinks this round."}
        </div>
        {pushMeansDrink && saying && (
          <div className="text-dim" style={{ marginTop: 10, fontStyle: "italic" }}>
            "{saying}"
          </div>
        )}
      </div>
    );
  }
  if (outcome === "correct") {
    return (
      <div className="card-panel text-center" style={{ borderColor: "var(--correct)" }}>
        <strong style={{ color: "var(--correct)" }}>Correct!</strong>
        <div>Give out {drinkValue} drink{drinkValue > 1 ? "s" : ""}</div>
      </div>
    );
  }
  return (
    <div className="card-panel text-center" style={{ borderColor: "var(--wrong)" }}>
      <strong style={{ color: "var(--wrong)" }}>Wrong!</strong>
      <div>Take {drinkValue} drink{drinkValue > 1 ? "s" : ""}</div>
      {saying && (
        <div className="text-dim" style={{ marginTop: 10, fontStyle: "italic" }}>
          "{saying}"
        </div>
      )}
    </div>
  );
}

export function UpDownRiverGame({ settings, onRestart }: Props) {
  const [state, setState] = useState<GameState>(() => initGame(settings));
  const [riverResult, setRiverResult] = useState<RiverResult | null>(null);

  function resolveStage(guess: string, outcome: PyramidOutcome) {
    setState((prev) => {
      const player = prev.players[prev.currentPlayerIndex];
      const isDrinkOutcome = outcome === "wrong" || (outcome === "push" && prev.pushMeansDrink);
      const saying = isDrinkOutcome ? randomSaying() : undefined;
      const pyramid = player.pyramid.map((s, i) =>
        i === prev.currentStageIndex ? { ...s, guess, outcome, saying } : s
      );
      const stage = pyramid[prev.currentStageIndex];
      const players = applyOutcome(
        prev.players,
        player.id,
        outcome,
        stage.drinkValue,
        prev.pushMeansDrink
      ).map((p) => (p.id === player.id ? { ...p, pyramid } : p));
      return { ...prev, players };
    });
  }

  function nextStage() {
    setState((prev) => {
      const isLastPlayerInRound = prev.currentPlayerIndex === prev.players.length - 1;
      if (!isLastPlayerInRound) {
        return { ...prev, currentPlayerIndex: prev.currentPlayerIndex + 1 };
      }
      const isLastRound =
        prev.currentStageIndex === prev.players[0].pyramid.length - 1;
      if (isLastRound) {
        return { ...prev, phase: prev.riverCards.length > 0 ? "river" : "summary" };
      }
      return { ...prev, currentPlayerIndex: 0, currentStageIndex: prev.currentStageIndex + 1 };
    });
  }

  function revealRiverCard() {
    const idx = state.currentRiverIndex;
    const riverCard = state.riverCards[idx];
    const matched = state.players.filter((p) =>
      handHasRank(
        p.pyramid.map((s) => s.card),
        riverCard.card.rank
      )
    );
    const matchedIds = matched.map((p) => p.id);

    setState((prev) => {
      const players = prev.players.map((p) => {
        if (!matchedIds.includes(p.id)) return p;
        if (riverCard.direction === "up") {
          return { ...p, drinksGiven: p.drinksGiven + riverCard.drinkValue };
        }
        return { ...p, drinksTaken: p.drinksTaken + riverCard.drinkValue };
      });
      const riverCards = prev.riverCards.map((rc, i) =>
        i === idx ? { ...rc, matchedPlayerIds: matchedIds, resolved: true } : rc
      );
      return { ...prev, players, riverCards, riverRevealed: true };
    });

    setRiverResult({
      direction: riverCard.direction,
      drinkValue: riverCard.drinkValue,
      playerNames: matched.map((p) => p.name),
      saying: riverCard.direction === "down" && matched.length > 0 ? randomSaying() : undefined,
    });
  }

  function dismissRiverResult() {
    setState((prev) => {
      const idx = prev.currentRiverIndex;
      const isLast = idx === prev.riverCards.length - 1;
      return {
        ...prev,
        currentRiverIndex: isLast ? idx : idx + 1,
        riverRevealed: false,
        phase: isLast ? "summary" : "river",
      };
    });
    setRiverResult(null);
  }

  if (state.phase === "pyramid") {
    const player = state.players[state.currentPlayerIndex];
    const stage = player.pyramid[state.currentStageIndex];
    const resolved = !!stage.outcome;

    return (
      <div className="screen">
        <div className="screen-header">
          <h1>{stage.label}</h1>
          <p>
            Round {state.currentStageIndex + 1} of 4 &middot; {player.name}'s turn &middot; worth{" "}
            {stage.drinkValue} drink{stage.drinkValue > 1 ? "s" : ""}
          </p>
        </div>

        <div className="stack" style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
          {state.currentStageIndex > 0 && (
            <div className="row wrap" style={{ justifyContent: "center" }}>
              {player.pyramid.slice(0, state.currentStageIndex).map((s) => (
                <PlayingCard key={s.id} card={s.card} size="md" />
              ))}
            </div>
          )}

          <PlayingCard card={resolved ? stage.card : undefined} faceDown={!resolved} size="lg" />

          {!resolved && stage.id === "redBlack" && (
            <div className="grid-2" style={{ width: "100%" }}>
              <button
                className="btn btn-block"
                style={{ background: "#c1121f", borderColor: "#c1121f", color: "white" }}
                onClick={() => resolveStage("red", resolveRedBlack(stage.card, "red"))}
              >
                Red
              </button>
              <button
                className="btn btn-block"
                style={{ background: "#14151a", borderColor: "#14151a", color: "white" }}
                onClick={() => resolveStage("black", resolveRedBlack(stage.card, "black"))}
              >
                Black
              </button>
            </div>
          )}

          {!resolved && stage.id === "highLow" && (
            <div className="grid-2" style={{ width: "100%" }}>
              <button
                className="btn btn-block"
                onClick={() =>
                  resolveStage("higher", resolveHighLow(stage.card, player.pyramid[0].card, "higher"))
                }
              >
                Higher
              </button>
              <button
                className="btn btn-block"
                onClick={() =>
                  resolveStage("lower", resolveHighLow(stage.card, player.pyramid[0].card, "lower"))
                }
              >
                Lower
              </button>
            </div>
          )}

          {!resolved && stage.id === "insideOutside" && (
            <div className="grid-2" style={{ width: "100%" }}>
              <button
                className="btn btn-block"
                onClick={() =>
                  resolveStage(
                    "inside",
                    resolveInsideOutside(
                      stage.card,
                      player.pyramid[0].card,
                      player.pyramid[1].card,
                      "inside"
                    )
                  )
                }
              >
                Inside
              </button>
              <button
                className="btn btn-block"
                onClick={() =>
                  resolveStage(
                    "outside",
                    resolveInsideOutside(
                      stage.card,
                      player.pyramid[0].card,
                      player.pyramid[1].card,
                      "outside"
                    )
                  )
                }
              >
                Outside
              </button>
            </div>
          )}

          {!resolved && stage.id === "suit" && (
            <div className="grid-2" style={{ width: "100%" }}>
              {SUITS.map((suit: Suit) => (
                <button
                  key={suit}
                  className="btn btn-block"
                  onClick={() => resolveStage(suit, resolveSuit(stage.card, suit))}
                >
                  {suitSymbol(suit)} {suit}
                </button>
              ))}
            </div>
          )}

          {resolved && stage.outcome && (
            <>
              <OutcomeBanner
                outcome={stage.outcome}
                drinkValue={stage.drinkValue}
                pushMeansDrink={state.pushMeansDrink}
                saying={stage.saying}
              />
              <button className="btn btn-primary btn-block" onClick={nextStage}>
                {(() => {
                  const isLastPlayerInRound = state.currentPlayerIndex === state.players.length - 1;
                  const isLastRound = state.currentStageIndex === player.pyramid.length - 1;
                  if (!isLastPlayerInRound) {
                    return `Next up: ${state.players[state.currentPlayerIndex + 1].name}`;
                  }
                  if (isLastRound) return "Start the River";
                  return `Start Round ${state.currentStageIndex + 2}`;
                })()}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (state.phase === "river") {
    const idx = state.currentRiverIndex;
    const riverCard = state.riverCards[idx];
    const isUp = riverCard.direction === "up";
    const label = isUp ? "Up the River" : "Down the River";

    return (
      <div className="screen">
        <div className="screen-header">
          <h1>{label}</h1>
          <p>
            {isUp
              ? `Got this rank? Give out ${riverCard.drinkValue} drink${riverCard.drinkValue > 1 ? "s" : ""}.`
              : `Got this rank? Drink ${riverCard.drinkValue}.`}
          </p>
        </div>

        <div className="stack" style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
          <RiverCircle
            riverCards={state.riverCards}
            currentIndex={state.currentRiverIndex}
            revealed={state.riverRevealed}
            onFlip={revealRiverCard}
          />

          {!state.riverRevealed && (
            <button className="btn btn-primary btn-block" onClick={revealRiverCard}>
              Flip Card
            </button>
          )}
        </div>

        {riverResult && (
          <RiverResultModal
            result={riverResult}
            onDismiss={dismissRiverResult}
            buttonLabel={idx === state.riverCards.length - 1 ? "See Final Tally" : "Next Card"}
          />
        )}
      </div>
    );
  }

  const sorted = [...state.players].sort(
    (a, b) => b.drinksGiven - b.drinksTaken - (a.drinksGiven - a.drinksTaken)
  );

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Game Over</h1>
        <p>Final tally of the night</p>
      </div>
      <div className="stack">
        {sorted.map((p) => (
          <div key={p.id} className="card-panel row" style={{ justifyContent: "space-between" }}>
            <strong>{p.name}</strong>
            <span>
              <span style={{ color: "var(--give)" }}>gave {p.drinksGiven}</span>
              {" · "}
              <span style={{ color: "var(--take)" }}>drank {p.drinksTaken}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="spacer" />
      <button className="btn btn-primary btn-block" onClick={onRestart}>
        Play Again
      </button>
    </div>
  );
}
