import { useState } from "react";
import { PlayingCard } from "../../components/PlayingCard";
import { initKingsCup } from "./engine";
import { KING_RULE_PRESETS, RANK_RULES } from "./rankRules";
import type { KcSettings, KcState } from "./types";

interface Props {
  settings: KcSettings;
  onRestart: () => void;
}

function StatusBanner({ state }: { state: KcState }) {
  const qm = state.questionMasterId != null ? state.players.find((p) => p.id === state.questionMasterId) : null;
  const nameOf = (id: number) => state.players.find((p) => p.id === id)?.name ?? "?";
  const matePairNames = state.matePairs.map(([a, b]) => `${nameOf(a)} & ${nameOf(b)}`);

  if (!state.activeRule && !qm && matePairNames.length === 0) return null;

  return (
    <div className="stack" style={{ width: "100%", marginBottom: 16 }}>
      {state.activeRule && (
        <div className="card-panel" style={{ borderColor: "var(--gold)" }}>
          <div className="text-dim" style={{ fontSize: "0.75rem", letterSpacing: 1 }}>
            👑 ACTIVE RULE
          </div>
          <strong>{state.activeRule}</strong>
        </div>
      )}
      {qm && (
        <div className="card-panel" style={{ borderColor: "var(--accent-2)" }}>
          <div className="text-dim" style={{ fontSize: "0.75rem", letterSpacing: 1 }}>
            ❓ QUESTION MASTER
          </div>
          <strong>{qm.name}</strong>
        </div>
      )}
      {matePairNames.length > 0 && (
        <div className="card-panel" style={{ borderColor: "var(--give)" }}>
          <div className="text-dim" style={{ fontSize: "0.75rem", letterSpacing: 1 }}>
            💞 MATES
          </div>
          <div className="stack" style={{ gap: 4 }}>
            {matePairNames.map((pair, i) => (
              <strong key={i}>{pair}</strong>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function KingsCupGame({ settings, onRestart }: Props) {
  const [state, setState] = useState<KcState>(() => initKingsCup(settings));
  const [targetIds, setTargetIds] = useState<number[]>([]);
  const [textInput, setTextInput] = useState("");
  const [kingRuleDraft, setKingRuleDraft] = useState<string | null>(null);
  const [kingCustomText, setKingCustomText] = useState("");

  function drawCard() {
    setState((prev) => {
      if (prev.deck.length === 0) return { ...prev, phase: "gameover" };
      const [card, ...rest] = prev.deck;
      return { ...prev, deck: rest, currentCard: card, phase: "resolve" };
    });
    setTargetIds([]);
    setTextInput("");
    setKingRuleDraft(null);
    setKingCustomText("");
  }

  function continueTurn() {
    setState((prev) => {
      const isKing = prev.currentCard?.rank === "K";
      const isJack = prev.currentCard?.rank === "J";
      const isQueen = prev.currentCard?.rank === "Q";
      const kingsDrawn = isKing ? prev.kingsDrawn + 1 : prev.kingsDrawn;

      let players = prev.players;
      if (isJack) {
        players = players.map((p) => (p.fingers <= 0 ? { ...p, fingers: 3 } : p));
      }

      const patch: Partial<KcState> = { players, kingsDrawn };
      if (isQueen && targetIds.length === 1) patch.questionMasterId = targetIds[0];
      if (prev.currentCard?.rank === "8" && targetIds.length === 2) {
        patch.matePairs = [...prev.matePairs, [targetIds[0], targetIds[1]]];
      }

      const gameOver = prev.deck.length === 0;
      return {
        ...prev,
        ...patch,
        currentCard: null,
        phase: gameOver ? "gameover" : "draw",
      };
    });
  }

  function togglePick(id: number, max: number) {
    setTargetIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= max) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  function adjustFingers(playerId: number, delta: number) {
    setState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === playerId ? { ...p, fingers: Math.max(0, Math.min(3, p.fingers + delta)) } : p
      ),
    }));
  }

  function applyKingRule(rule: string) {
    setKingRuleDraft(rule);
    setState((prev) => ({ ...prev, activeRule: rule }));
  }

  if (state.phase === "gameover") {
    return (
      <div className="screen">
        <div className="screen-header">
          <h1>Kings Cup Over</h1>
          <p>Deck empty. Cheers!</p>
        </div>
        <div className="spacer" />
        <button className="btn btn-primary btn-block" onClick={onRestart}>
          Play Again
        </button>
      </div>
    );
  }

  if (state.phase === "draw") {
    return (
      <div className="screen">
        <div className="screen-header">
          <h1>Draw a Card</h1>
          <p>
            {state.deck.length} cards left &middot; {state.kingsDrawn}/4 Kings &middot; {state.matePairs.length}/4 Mates
          </p>
        </div>
        <div className="stack" style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
          <StatusBanner state={state} />
          <div onClick={drawCard} style={{ cursor: "pointer" }}>
            <PlayingCard faceDown size="lg" />
          </div>
          <button className="btn btn-primary btn-block" onClick={drawCard}>
            Draw Card
          </button>
        </div>
      </div>
    );
  }

  const card = state.currentCard!;
  const rule = RANK_RULES[card.rank];
  const guys = state.players.filter((p) => p.gender === "guy");
  const girls = state.players.filter((p) => p.gender === "girl");

  function playerButton(id: number, opts: { max: number; color?: string }) {
    const p = state.players.find((pl) => pl.id === id)!;
    const picked = targetIds.includes(id);
    return (
      <button
        key={id}
        className="btn"
        style={{
          background: picked ? opts.color || "var(--take)" : "var(--bg-elevated)",
          color: picked ? "#3a0000" : "var(--text)",
        }}
        onClick={() => togglePick(id, opts.max)}
      >
        {p.name}
      </button>
    );
  }

  function renderResolution() {
    switch (card.rank) {
      case "2": {
        return (
          <div className="stack" style={{ width: "100%" }}>
            <div className="text-dim text-center">Who drinks?</div>
            <div className="row wrap" style={{ justifyContent: "center" }}>
              {state.players.map((p) => playerButton(p.id, { max: 1 }))}
            </div>
          </div>
        );
      }
      case "3":
        return (
          <div className="card-panel text-center" style={{ borderColor: "var(--take)" }}>
            <strong style={{ color: "var(--take)" }}>Whoever drew — drink!</strong>
          </div>
        );
      case "5":
        return (
          <div className="card-panel text-center" style={{ borderColor: "var(--take)" }}>
            <strong style={{ color: "var(--take)" }}>All guys drink!</strong>
            <div className="text-dim">{guys.map((p) => p.name).join(", ") || "No guys here"}</div>
          </div>
        );
      case "6":
        return girls.length > 0 ? (
          <div className="card-panel text-center" style={{ borderColor: "var(--take)" }}>
            <strong style={{ color: "var(--take)" }}>All chicks drink!</strong>
            <div className="text-dim">{girls.map((p) => p.name).join(", ")}</div>
          </div>
        ) : (
          <div className="card-panel text-center" style={{ borderColor: "var(--take)" }}>
            <strong style={{ color: "var(--take)" }}>No chicks here — Social! Everyone drinks!</strong>
          </div>
        );
      case "8":
        return (
          <div className="stack" style={{ width: "100%" }}>
            <div className="text-dim text-center">
              Pick two mates ({targetIds.length}/2)
            </div>
            <div className="row wrap" style={{ justifyContent: "center" }}>
              {state.players.map((p) => playerButton(p.id, { max: 2, color: "var(--give)" }))}
            </div>
          </div>
        );
      case "9":
      case "10": {
        const label = card.rank === "9" ? "Rhyming word" : "Category";
        return (
          <div className="stack" style={{ width: "100%" }}>
            <input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={label}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "12px 14px",
                color: "var(--text)",
                fontSize: "1rem",
                textAlign: "center",
              }}
            />
            {textInput.trim() && (
              <div className="card-panel text-center">
                <div className="text-dim" style={{ fontSize: "0.8rem" }}>{label}</div>
                <strong style={{ fontSize: "1.3rem" }}>{textInput}</strong>
              </div>
            )}
          </div>
        );
      }
      case "J":
        return (
          <div className="stack" style={{ width: "100%" }}>
            <div className="text-dim text-center">Tap a name each time they've done it</div>
            <div className="row wrap" style={{ justifyContent: "center" }}>
              {state.players.map((p) => (
                <button
                  key={p.id}
                  className="btn"
                  style={{
                    background: p.fingers === 0 ? "var(--take)" : "var(--bg-elevated)",
                    color: p.fingers === 0 ? "#3a0000" : "var(--text)",
                  }}
                  onClick={() => adjustFingers(p.id, -1)}
                  onDoubleClick={() => adjustFingers(p.id, 1)}
                >
                  {p.name} &middot; {p.fingers} 🖐️
                </button>
              ))}
            </div>
            <div className="text-dim text-center" style={{ fontSize: "0.8rem" }}>
              Hit 0 fingers? Drink. (Double-tap to undo a tap)
            </div>
          </div>
        );
      case "K":
        return (
          <div className="stack" style={{ width: "100%" }}>
            <div className="text-dim text-center">Pick a rule</div>
            <div className="row wrap" style={{ justifyContent: "center" }}>
              {KING_RULE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  className="btn"
                  style={{
                    background: kingRuleDraft === preset ? "var(--gold)" : "var(--bg-elevated)",
                    color: kingRuleDraft === preset ? "#3a2c00" : "var(--text)",
                  }}
                  onClick={() => applyKingRule(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
            <div className="row" style={{ gap: 8 }}>
              <input
                value={kingCustomText}
                onChange={(e) => setKingCustomText(e.target.value)}
                placeholder="Or write your own rule"
                style={{
                  flex: 1,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  color: "var(--text)",
                  fontSize: "1rem",
                  minWidth: 0,
                }}
              />
              <button
                className="btn"
                disabled={!kingCustomText.trim()}
                onClick={() => applyKingRule(kingCustomText.trim())}
              >
                Set
              </button>
            </div>
            {kingRuleDraft && (
              <div className="card-panel text-center" style={{ borderColor: "var(--gold)" }}>
                <div className="text-dim" style={{ fontSize: "0.8rem" }}>New Rule</div>
                <strong>{kingRuleDraft}</strong>
              </div>
            )}
          </div>
        );
      case "Q":
        return (
          <div className="stack" style={{ width: "100%" }}>
            <div className="text-dim text-center">Who is the new Question Master?</div>
            <div className="row wrap" style={{ justifyContent: "center" }}>
              {state.players.map((p) => playerButton(p.id, { max: 1, color: "var(--accent-2)" }))}
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  const canContinue = (() => {
    if (card.rank === "2") return targetIds.length === 1;
    if (card.rank === "8") return targetIds.length === 2;
    if (card.rank === "Q") return targetIds.length === 1;
    if (card.rank === "K") return !!kingRuleDraft;
    return true;
  })();

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>{rule?.title ?? card.rank}</h1>
        <p>{rule?.description}</p>
      </div>
      <div className="stack" style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
        <StatusBanner state={state} />
        <PlayingCard card={card} size="lg" />
        {renderResolution()}
        <button className="btn btn-primary btn-block" disabled={!canContinue} onClick={continueTurn}>
          Next Card
        </button>
      </div>
    </div>
  );
}
