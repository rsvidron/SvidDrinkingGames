import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GameMenu.css";

interface Props {
  gameTitle: string;
  rules: React.ReactNode;
  onRestart: () => void;
  /** Optional settings pane content — when provided, a "⚙ Settings" entry
   *  appears in the menu and clicking it opens this content in a modal. */
  settings?: React.ReactNode;
}

export function GameMenu({ gameTitle, rules, onRestart, settings }: Props) {
  const [open, setOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();

  function close() {
    setOpen(false);
    setRulesOpen(false);
    setSettingsOpen(false);
  }

  function handleRestart() {
    close();
    onRestart();
  }

  function handleBackToMenu() {
    close();
    navigate("/");
  }

  return (
    <>
      <button
        className="game-menu-toggle"
        onClick={() => setOpen(true)}
        aria-label="Menu"
      >
        <span className="game-menu-toggle__bar" />
        <span className="game-menu-toggle__bar" />
        <span className="game-menu-toggle__bar" />
      </button>

      {open && !rulesOpen && !settingsOpen && (
        <div className="modal-backdrop" onClick={close}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ textAlign: "left" }}
          >
            <div
              className="text-dim"
              style={{ fontSize: "0.75rem", letterSpacing: 1, marginBottom: 4 }}
            >
              {gameTitle.toUpperCase()}
            </div>
            <strong style={{ fontSize: "1.2rem" }}>Menu</strong>
            <div className="stack" style={{ marginTop: 16 }}>
              <button className="btn btn-block" onClick={() => setRulesOpen(true)}>
                📖 Rules
              </button>
              {settings && (
                <button className="btn btn-block" onClick={() => setSettingsOpen(true)}>
                  ⚙ Settings
                </button>
              )}
              <button className="btn btn-block" onClick={handleRestart}>
                🔄 Restart game
              </button>
              <button className="btn btn-block" onClick={handleBackToMenu}>
                🏠 Back to games
              </button>
              <button className="btn btn-ghost btn-block" onClick={close}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="modal-backdrop" onClick={close}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ textAlign: "left", maxHeight: "80vh", overflowY: "auto" }}
          >
            <div
              className="text-dim"
              style={{ fontSize: "0.75rem", letterSpacing: 1, marginBottom: 4 }}
            >
              SETTINGS
            </div>
            <strong style={{ fontSize: "1.2rem" }}>{gameTitle}</strong>
            <div style={{ marginTop: 12 }}>{settings}</div>
            <button
              className="btn btn-primary btn-block"
              style={{ marginTop: 16 }}
              onClick={() => setSettingsOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {rulesOpen && (
        <div className="modal-backdrop" onClick={close}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ textAlign: "left", maxHeight: "80vh", overflowY: "auto" }}
          >
            <div
              className="text-dim"
              style={{ fontSize: "0.75rem", letterSpacing: 1, marginBottom: 4 }}
            >
              RULES
            </div>
            <strong style={{ fontSize: "1.2rem" }}>{gameTitle}</strong>
            <div style={{ marginTop: 12, fontSize: "0.95rem", lineHeight: 1.5 }}>
              {rules}
            </div>
            <button
              className="btn btn-primary btn-block"
              style={{ marginTop: 16 }}
              onClick={() => setRulesOpen(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
