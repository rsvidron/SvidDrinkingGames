import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MILD_PROMPTS, SPICY_PROMPTS } from "./prompts";
import { ALL_CATEGORIES, defaultCategories } from "./types";
import type { PiccoloSettings, PromptCategory } from "./types";

interface Props {
  onStart: (settings: PiccoloSettings) => void;
}

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
  rule: { label: "Rule", emoji: "📜", color: "var(--gold)" },
};

export function PiccoloSetup({ onStart }: Props) {
  const [spicy, setSpicy] = useState(true);
  const [categories, setCategories] = useState(defaultCategories);

  // How many prompts will end up in the deck given the current settings.
  const deckSize = useMemo(() => {
    const pool = spicy ? [...MILD_PROMPTS, ...SPICY_PROMPTS] : [...MILD_PROMPTS];
    return pool.filter((p) => categories[p.category] !== false).length;
  }, [spicy, categories]);

  const enabledCount = ALL_CATEGORIES.filter((c) => categories[c]).length;
  const canStart = deckSize > 0;

  function toggle(c: PromptCategory) {
    setCategories((prev) => ({ ...prev, [c]: !prev[c] }));
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Piccolo</h1>
        <p>Pass the phone around. Do what the card says.</p>
      </div>

      <div className="stack">
        <div className="card-panel">
          <div
            className="row"
            style={{ alignItems: "center", justifyContent: "space-between" }}
          >
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

        <div className="card-panel">
          <div
            className="row"
            style={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <div>
              <strong>Card types</strong>
              <div className="text-dim" style={{ fontSize: "0.85rem" }}>
                Tap to include or exclude each type ({enabledCount}/{ALL_CATEGORIES.length} on)
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 12,
            }}
          >
            {ALL_CATEGORIES.map((cat) => {
              const on = categories[cat];
              const meta = CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  className="btn"
                  style={{
                    minHeight: 40,
                    padding: "8px 14px",
                    background: on ? meta.color : "var(--bg-elevated)",
                    borderColor: on ? meta.color : "var(--border)",
                    color: on ? "var(--bg)" : "var(--text-dim)",
                    opacity: on ? 1 : 0.7,
                    fontWeight: on ? 700 : 500,
                  }}
                  onClick={() => toggle(cat)}
                >
                  {meta.emoji} {meta.label}
                </button>
              );
            })}
          </div>
          <div
            className="text-dim"
            style={{ fontSize: "0.85rem", marginTop: 12 }}
          >
            Deck size: <strong style={{ color: canStart ? "var(--text)" : "var(--wrong)" }}>{deckSize}</strong> cards
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
          disabled={!canStart}
          onClick={() => onStart({ spicy, categories })}
        >
          {canStart ? "Deal Me In" : "Turn on at least one card type"}
        </button>
        <Link to="/" className="btn btn-ghost btn-block text-center">
          Back to games
        </Link>
      </div>
    </div>
  );
}
