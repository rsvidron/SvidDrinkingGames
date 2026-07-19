import { Link } from "react-router-dom";
import { PricingCards } from "../components/PricingCards";

export function Splash() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "24px 16px",
      }}
    >
      {/* Hero */}
      <section
        style={{
          textAlign: "center",
          padding: "40px 0 32px",
        }}
      >
        <div style={{ fontSize: "3.2rem", marginBottom: 12 }}>🍻</div>
        <h1
          style={{
            fontSize: "2.25rem",
            margin: "0 0 12px",
            letterSpacing: -0.5,
            lineHeight: 1.1,
          }}
        >
          Bar Games
        </h1>
        <p
          className="text-dim"
          style={{
            fontSize: "1.1rem",
            margin: "0 auto 24px",
            maxWidth: 480,
            lineHeight: 1.5,
          }}
        >
          Drinking card games for your phone. Pass it around the circle, hit up
          the second-screen table display, and let the deck do the work.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/signup" className="btn btn-primary" style={{ padding: "14px 28px" }}>
            Sign up
          </Link>
          <Link to="/login" className="btn" style={{ padding: "14px 28px" }}>
            Log in
          </Link>
        </div>
      </section>

      {/* Games */}
      <section style={{ padding: "24px 0" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Three games. More on the way.
        </h2>
        <div className="stack" style={{ gap: 12 }}>
          <div className="card-panel">
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", letterSpacing: 1 }}>
              GAME 1
            </div>
            <strong style={{ fontSize: "1.15rem" }}>Up the River, Down the River</strong>
            <div className="text-dim" style={{ marginTop: 6, fontSize: "0.95rem" }}>
              Everyone takes a pyramid of guesses (red/black, higher/lower,
              inside/outside, suit), then cards flip around an oval to settle the
              tally. Great for 4–8 people at a table.
            </div>
          </div>
          <div className="card-panel">
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", letterSpacing: 1 }}>
              GAME 2
            </div>
            <strong style={{ fontSize: "1.15rem" }}>Kings Cup</strong>
            <div className="text-dim" style={{ marginTop: 6, fontSize: "0.95rem" }}>
              The classic. Every rank does something — Mates, Question Master,
              Make a Rule, Waterfall — and the app keeps track of active rules and
              pairs for the rest of the game.
            </div>
          </div>
          <div className="card-panel">
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", letterSpacing: 1 }}>
              GAME 3
            </div>
            <strong style={{ fontSize: "1.15rem" }}>Fuck the Dealer</strong>
            <div className="text-dim" style={{ marginTop: 6, fontSize: "0.95rem" }}>
              Guess the rank in two tries. Uses a second phone as a "table
              display" so everyone can see what's been played — perfect for the
              guesser strategizing across the table.
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: "24px 0" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Pricing
        </h2>
        <p
          className="text-dim text-center"
          style={{ margin: "0 auto 20px", maxWidth: 400 }}
        >
          One-time purchase. No subscription. Nothing to cancel.
        </p>
        <PricingCards disabled />
        <p
          className="text-dim text-center"
          style={{ marginTop: 12, fontSize: "0.85rem" }}
        >
          Sign up first, then buy from the paywall.
        </p>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "32px 0 16px",
          textAlign: "center",
          fontSize: "0.85rem",
          color: "var(--text-dim)",
          borderTop: "1px solid var(--border)",
          marginTop: 24,
        }}
      >
        <div style={{ marginBottom: 8 }}>21+ only. Drink responsibly.</div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <Link to="/terms" style={{ color: "var(--text-dim)" }}>
            Terms
          </Link>
          <Link to="/privacy" style={{ color: "var(--text-dim)" }}>
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}
