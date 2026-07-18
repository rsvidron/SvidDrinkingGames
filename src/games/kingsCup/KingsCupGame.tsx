import { useState } from "react";
import { PlayingCard } from "../../components/PlayingCard";
import { initKingsCup, mateOf } from "./engine";
import { KING_RULE_PRESETS, RANK_RULES } from "./rankRules";
import type { KcSettings, KcState } from "./types";

interface Props {
  settings: KcSettings;
  onRestart: () => void;
}

function StatusBanner({ state }: { state: KcState }) {
  const qm = state.questionMasterId != null ? state.players.find((p) => p.id === state.questionMasterId) : null;
  const mates = state.matePair
    ? state.matePair.map((id) => state.players.find((p) => p.id === id)?.name).filter(Boolean)
    : null;

  if (!state.activeRule && !qm && !mates) return null;

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
      {mates && (
        <div className="card-panel" style={{ borderColor: "var(--give)" }}>
          <div className="text-dim" style={{ fontSize: "0.75rem", letterSpacing: 1 }}>
            💞 MATES
          </div>
          <strong>{mates.join(" & ")}</strong>
        </div>
      )}
    </div>
  );
}

export function KingsCupGame({ settings, onRestart }: Props) {
  const [state, setState] = useState<KcState>(() => initKingsCup(settings));
  const [targetId, setTargetId] = useState<number | null>(null);
  const [textInput, setTextInput] = useState("");
  const [kingRuleDraft, setKingRuleDraft] = useState<string | null>(null);
  const [kingCustomText, setKingCustomText] = useState("");

  const drawer = state.players[state.currentPlayerIndex];

  function drawCard() {
    setState((prev) => {
      if (prev.deck.length === 0) return { ...prev, phase: "gameover" };
      const [card, ...rest] = prev.deck;
      const isQueen = card.rank === "Q";
      return {
        ...prev,
        deck: rest,
        currentCard: card,
        phase: "resolve",
        questionMasterId: isQueen ? prev.players[prev.currentPlayerIndex].id : prev.questionMasterId,
      };
    });
    setTargetId(null);
    setTextInput("");
    setKingRuleDraft(null);
    setKingCustomText("");
  }

  function continueTurn() {
    setState((prev) => {
      const isKing = prev.currentCard?.rank === "K";
      const isJack = prev.currentCard?.rank === "J";
      const kingsDrawn = isKing ? prev.kingsDrawn + 1 : prev.kingsDrawn;
      const players = isJack
        ? prev.players.map((p) => (p.fingers <= 0 ? { ...p, fingers: 3 } : p))
        : prev.players;
      const gameOver = kingsDrawn >= 4;
      return {
        ...prev,
        players,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
        currentCard: null,
        kingsDrawn,
        phase: gameOver ? "gameover" : "draw",
      };
    });
  }

  function pickYouTarget(id: number) {
    setTargetId(id);
  }

  function pickMate(id: number) {
    setTargetId(id);
    setState((prev) => ({ ...prev, matePair: [prev.players[prev.currentPlayerIndex].id, id] }));
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
          <p>All 4 Kings have been drawn. Cheers!</p>
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
          <h1>{drawer.name}'s Turn</h1>
          <p>
            {state.deck.length} cards left &middot; {state.kingsDrawn}/4 Kings drawn
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

  // resolve phase
  const card = state.currentCard!;
  const rule = RANK_RULES[card.rank];
  const guys = state.players.filter((p) => p.gender === "guy");
  const girls = state.players.filter((p) => p.gender === "girl");
  const otherPlayers = state.players.filter((p) => p.id !== drawer.id);

  function renderResolution() {
    switch (card.rank) {
      case "2": {
        const picked = targetId != null ? state.players.find((p) => p.id === targetId) : null;
        const pickedMate = targetId != null ? mateOf(state, targetId) : null;
        const mateName = pickedMate != null ? state.players.find((p) => p.id === pickedMate)?.name : null;
        return (
          <div className="stack" style={{ width: "100%" }}>
            {!picked ? (
              <>
                <div className="text-dim text-center">Who drinks?</div>
                <div className="row wrap" style={{ justifyContent: "center" }}>
                  {state.players.map((p) => (
                    <button key={p.id} className="btn" onClick={() => pickYouTarget(p.id)}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="card-panel text-center" style={{ borderColor: "var(--take)" }}>
                <strong style={{ color: "var(--take)" }}>{picked.name} drinks!</strong>
                {mateName && <div className="text-dim">Their mate {mateName} drinks too!</div>}
              </div>
            )}
          </div>
        );
      }
      case "3": {
        const drawerMate = mateOf(state, drawer.id);
        const mateName = drawerMate != null ? state.players.find((p) => p.id === drawerMate)?.name : null;
        return (
          <div className="card-panel text-center" style={{ borderColor: "var(--take)" }}>
            <strong style={{ color: "var(--take)" }}>{drawer.name} drinks!</strong>
            {mateName && <div className="text-dim">Their mate {mateName} drinks too!</div>}
          </div>
        );
      }
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
      case "8": {
        const mate = targetId != null ? state.players.find((p) => p.id === targetId) : null;
        return (
          <div className="stack" style={{ width: "100%" }}>
            {!mate ? (
              <>
                <div className="text-dim text-center">{drawer.name}, pick your mate</div>
                <div className="row wrap" style={{ justifyContent: "center" }}>
                  {otherPlayers.map((p) => (
                    <button key={p.id} className="btn" onClick={() => pickMate(p.id)}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="card-panel text-center" style={{ borderColor: "var(--give)" }}>
                <strong style={{ color: "var(--give)" }}>
                  {drawer.name} &amp; {mate.name} are mates!
                </strong>
                <div className="text-dim">Whenever either drinks, they both drink.</div>
              </div>
            )}
          </div>
        );
      }
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
      case "K": {
        return (
          <div className="stack" style={{ width: "100%" }}>
            <div className="text-dim text-center">{drawer.name}, pick a rule</div>
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
      }
      case "Q":
        return (
          <div className="card-panel text-center" style={{ borderColor: "var(--accent-2)" }}>
            <strong>{drawer.name} is the Question Master!</strong>
            <div className="text-dim">Answer their questions and you drink — reply with a question instead.</div>
          </div>
        );
      default:
        return null;
    }
  }

  const canContinue = (() => {
    if (card.rank === "2") return targetId != null;
    if (card.rank === "8") return targetId != null;
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
          Next Turn
        </button>
      </div>
    </div>
  );
}
