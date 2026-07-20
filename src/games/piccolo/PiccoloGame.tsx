import { useState } from "react";
import { GameMenu } from "../../components/GameMenu";
import { initPiccolo } from "./engine";
import type { PiccoloSettings, PiccoloState, PromptCategory } from "./types";

interface Props {
  settings: PiccoloSettings;
  onRestart: () => void;
  onMenuRestart: () => void;
}

const PICCOLO_RULES = (
  <>
    <p style={{ marginTop: 0 }}>
      Pass the phone around the circle. Whoever's holding it taps the deck and
      the card tells them what to do.
    </p>
    <strong>Card types</strong>
    <ul style={{ paddingLeft: 20 }}>
      <li>
        <strong>🍺 Drink</strong> — someone or everyone drinks
      </li>
      <li>
        <strong>🎭 Dare</strong> — do the challenge or drink to skip
      </li>
      <li>
        <strong>🤔 Truth</strong> — answer honestly or drink to skip
      </li>
      <li>
        <strong>👥 Group</strong> — everyone plays a mini round
      </li>
      <li>
        <strong>🏁 Race</strong> — last to do the thing drinks
      </li>
      <li>
        <strong>📜 Rule</strong> — a rule the whole table follows until a new
        rule card is drawn
      </li>
    </ul>
    <p>The game ends when the deck runs out.</p>
  </>
);

const CATEGORY_META: Record<
  PromptCategory,
  { label: string; emoji: string; color: string }
> = {
  drink: { label: "Drink", emoji: "🍺", color: "var(--take)" },
  dare: { label: "Dare", emoji: "🎭", color: "var(--gold)" },
  truth: { label: "Truth", emoji: "🤔", color: "var(--accent-2)" },
  group: { label: "Group", emoji: "👥", color: "var(--give)" },
  race: { label: "Race", emoji: "🏁", color: "var(--correct)" },
  chance: { label: "Chance", emoji: "🎲", color: "var(--accent)" },
  rule: { label: "New Rule", emoji: "📜", color: "var(--gold)" },
};

export function PiccoloGame({ settings, onMenuRestart }: Props) {
  const [state, setState] = useState<PiccoloState>(() => initPiccolo(settings));

  const menu = (
    <GameMenu gameTitle="Piccolo" rules={PICCOLO_RULES} onRestart={onMenuRestart} />
  );

  function drawCard() {
    setState((prev) => {
      if (prev.deck.length === 0) return { ...prev, phase: "gameover" };
      const [card, ...rest] = prev.deck;
      const activeRule = card.category === "rule" ? card.text : prev.activeRule;
      return {
        ...prev,
        deck: rest,
        currentPrompt: card,
        activeRule,
        drawnCount: prev.drawnCount + 1,
        phase: "prompt",
      };
    });
  }

  function nextTurn() {
    setState((prev) => ({
      ...prev,
      currentPrompt: null,
      phase: prev.deck.length === 0 ? "gameover" : "draw",
    }));
  }

  if (state.phase === "gameover") {
    return (
      <>
        {menu}
        <div className="screen">
          <div className="screen-header">
            <h1>Deck's Done</h1>
            <p>{state.drawnCount} cards played. Cheers!</p>
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn btn-primary btn-block" onClick={onMenuRestart}>
            Play Again
          </button>
        </div>
      </>
    );
  }

  if (state.phase === "draw") {
    return (
      <>
        {menu}
        <div className="screen">
          <div className="screen-header">
            <h1>Piccolo</h1>
            <p>
              {state.deck.length} cards left &middot; {state.drawnCount} drawn
            </p>
          </div>

          {state.activeRule && (
            <div
              className="card-panel"
              style={{ borderColor: "var(--gold)", marginBottom: 16 }}
            >
              <div
                className="text-dim"
                style={{ fontSize: "0.75rem", letterSpacing: 1 }}
              >
                📜 ACTIVE RULE
              </div>
              <strong>{state.activeRule}</strong>
            </div>
          )}

          <div
            className="stack"
            style={{ alignItems: "center", flex: 1, justifyContent: "center" }}
          >
            <div className="text-dim text-center">Tap the deck to draw</div>
            <div
              onClick={drawCard}
              style={{
                cursor: "pointer",
                width: 180,
                height: 252,
                borderRadius: 16,
                background:
                  "linear-gradient(135deg, #7b2ff7, #3a1d6e)",
                border: "2px solid #2c2f3a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  width: "78%",
                  height: "82%",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "3rem",
                }}
              >
                🎴
              </div>
            </div>
            <button className="btn btn-primary btn-block" onClick={drawCard}>
              Draw Card
            </button>
          </div>
        </div>
      </>
    );
  }

  const card = state.currentPrompt!;
  const meta = CATEGORY_META[card.category];

  return (
    <>
      {menu}
      <div className="screen">
        <div className="screen-header">
          <h1 style={{ color: meta.color }}>
            {meta.emoji} {meta.label}
          </h1>
        </div>

        {state.activeRule && card.category !== "rule" && (
          <div
            className="card-panel"
            style={{ borderColor: "var(--gold)", marginBottom: 12, fontSize: "0.85rem" }}
          >
            <div
              className="text-dim"
              style={{ fontSize: "0.7rem", letterSpacing: 1 }}
            >
              📜 ACTIVE RULE
            </div>
            {state.activeRule}
          </div>
        )}

        <div
          className="stack"
          style={{ alignItems: "center", flex: 1, justifyContent: "center" }}
        >
          <div
            className="card-panel"
            style={{
              borderColor: meta.color,
              borderWidth: 2,
              padding: "28px 22px",
              textAlign: "center",
              maxWidth: 420,
              width: "100%",
            }}
          >
            <div style={{ fontSize: "1.35rem", lineHeight: 1.4, fontWeight: 500 }}>
              {card.text}
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-block" onClick={nextTurn}>
          {state.deck.length === 0 ? "Finish" : "Next Card"}
        </button>
      </div>
    </>
  );
}
