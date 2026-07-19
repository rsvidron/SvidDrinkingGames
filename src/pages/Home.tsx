import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GAMES } from "../games/registry";
import { FreeWeekendBanner } from "../components/FreeWeekendBanner";
import { useAuth } from "../lib/authContext";
import { useAccess } from "../lib/useAccess";
import { Splash } from "./Splash";
import { Paywall } from "./Paywall";
import "../components/GameMenu.css"; // reuse hamburger toggle styles

export function Home() {
  const navigate = useNavigate();
  const { session, profile, signOut, loading: authLoading } = useAuth();
  const { hasAccess, freeWeekend, freeWeekendUntil, loading: accessLoading } = useAccess();
  const [menuOpen, setMenuOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="screen">
        <div className="screen-header">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Splash />;
  }

  if (accessLoading) {
    return (
      <div className="screen">
        <div className="screen-header">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <Paywall />;
  }

  return (
    <>
      <button
        className="game-menu-toggle"
        onClick={() => setMenuOpen(true)}
        aria-label="Menu"
      >
        <span className="game-menu-toggle__bar" />
        <span className="game-menu-toggle__bar" />
        <span className="game-menu-toggle__bar" />
      </button>

      {menuOpen && (
        <div className="modal-backdrop" onClick={() => setMenuOpen(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ textAlign: "left" }}
          >
            <div
              className="text-dim"
              style={{ fontSize: "0.75rem", letterSpacing: 1 }}
            >
              SIGNED IN AS
            </div>
            <strong style={{ fontSize: "1rem", wordBreak: "break-all" }}>
              {profile?.email ?? session.user.email}
            </strong>
            <div className="stack" style={{ marginTop: 16 }}>
              {profile?.is_admin && (
                <button
                  className="btn btn-block"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/admin");
                  }}
                >
                  🛡️ Admin portal
                </button>
              )}
              <Link
                to="/terms"
                className="btn btn-block text-center"
                onClick={() => setMenuOpen(false)}
              >
                📄 Terms
              </Link>
              <Link
                to="/privacy"
                className="btn btn-block text-center"
                onClick={() => setMenuOpen(false)}
              >
                🔒 Privacy
              </Link>
              <button
                className="btn btn-block"
                style={{ borderColor: "var(--wrong)", color: "var(--wrong)" }}
                onClick={async () => {
                  setMenuOpen(false);
                  await signOut();
                }}
              >
                🚪 Log out
              </button>
              <button
                className="btn btn-ghost btn-block"
                onClick={() => setMenuOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="screen">
        <div className="screen-header">
          <h1>🍻 Bar Games</h1>
          <p>Pick a game, hand around the phone, drink responsibly.</p>
        </div>

        {freeWeekend && <FreeWeekendBanner until={freeWeekendUntil} />}

        <div className="stack">
          {GAMES.map((game) => (
            <Link
              key={game.id}
              to={game.available ? game.path : "#"}
              className={`btn btn-block card-panel ${
                game.available ? "" : "btn-ghost"
              }`}
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                opacity: game.available ? 1 : 0.5,
                pointerEvents: game.available ? "auto" : "none",
              }}
            >
              <strong style={{ fontSize: "1.1rem" }}>{game.name}</strong>
              <span className="text-dim">{game.tagline}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
