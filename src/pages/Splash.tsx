import { Link } from "react-router-dom";
import "./splash.css";

export function Splash() {
  return (
    <div className="splash">
      <div className="splash__container">
        {/* Top nav */}
        <div className="splash-nav">
          <div className="splash-nav__brand">🍻 Bar Games</div>
          <div className="splash-nav__actions">
            <Link to="/login" className="btn btn-ghost">
              Log in
            </Link>
            <Link to="/signup" className="btn btn-primary">
              Sign up
            </Link>
          </div>
        </div>

        {/* Hero */}
        <section className="splash-hero">
          <div className="splash-hero__eyebrow">21+ · Drink responsibly</div>
          <h1 className="splash-hero__title">
            The bar's card deck,{" "}
            <span className="splash-hero__title-accent">without the deck.</span>
          </h1>
          <p className="splash-hero__sub">
            A deck of drinking games that lives on your phone. Pass it around
            the circle, hit up the second-screen table display, and let the
            phone do the dealing.
          </p>
          <div className="splash-hero__ctas">
            <Link to="/signup" className="btn btn-primary splash-btn">
              Get started — $4.99
            </Link>
            <Link to="/login" className="btn splash-btn">
              I already have an account
            </Link>
          </div>
          <div className="splash-hero__hint">
            One-time purchase. No subscription. Nothing to cancel.
          </div>
        </section>

        {/* Feature bullets */}
        <section className="splash-section" style={{ paddingTop: 20 }}>
          <div className="splash-features">
            <div className="splash-feature">
              <div className="splash-feature__icon">📱</div>
              <div className="splash-feature__title">No app to download</div>
              <p className="splash-feature__text">
                Runs in your browser. Works on iPhone, Android, tablet,
                anything.
              </p>
            </div>
            <div className="splash-feature">
              <div className="splash-feature__icon">🎴</div>
              <div className="splash-feature__title">A full deck of games</div>
              <p className="splash-feature__text">
                Classic drinking cards, reimagined for a phone at a bar table.
              </p>
            </div>
            <div className="splash-feature">
              <div className="splash-feature__icon">📺</div>
              <div className="splash-feature__title">Table display mode</div>
              <p className="splash-feature__text">
                Fuck the Dealer uses a second phone or tablet as a shared card
                counter — scan a QR to connect.
              </p>
            </div>
            <div className="splash-feature">
              <div className="splash-feature__icon">🎉</div>
              <div className="splash-feature__title">Free weekends</div>
              <p className="splash-feature__text">
                We open the app up on random weekends. Sign up now and you'll
                know when.
              </p>
            </div>
          </div>
        </section>

        {/* Games */}
        <section className="splash-section" id="games">
          <h2 className="splash-section__title">A whole deck of games.</h2>
          <p className="splash-section__sub">
            Every game is tuned for a phone getting passed around a bar table.
            No score cards, no rulebooks — the phone runs the game.
          </p>

          <div className="splash-games">
            <div className="splash-game splash-game--river">
              <div className="splash-game__visual">
                <div style={{ display: "flex", gap: 8 }}>
                  <div className="mini-card mini-card--red">A♥</div>
                  <div className="mini-card">10♣</div>
                  <div className="mini-card mini-card--red">7♦</div>
                  <div className="mini-card">K♠</div>
                </div>
              </div>
              <h3 className="splash-game__title">Up the River, Down the River</h3>
              <p className="splash-game__desc">
                Each player takes a pyramid of 4 guesses (red/black,
                higher/lower, inside/outside, suit), then cards flip around an
                oval to settle the tally.
              </p>
              <div className="splash-game__meta">
                <span>👥 4–8 players</span>
                <span>📱 1 phone</span>
              </div>
            </div>

            <div className="splash-game splash-game--kings">
              <div className="splash-game__visual">
                <div
                  className="mini-card"
                  style={{ width: 76, height: 106, fontSize: "1.8rem" }}
                >
                  K
                </div>
              </div>
              <h3 className="splash-game__title">Kings Cup</h3>
              <p className="splash-game__desc">
                The classic. 13 ranks, 13 rules — Mates, Question Master, Make
                a Rule, Waterfall. The app tracks active rules and pairs so
                nobody argues.
              </p>
              <div className="splash-game__meta">
                <span>👥 3–12 players</span>
                <span>📱 1 phone</span>
              </div>
            </div>

            <div className="splash-game splash-game--dealer">
              <span className="splash-game__badge">2 devices</span>
              <div className="splash-game__visual">
                <div
                  style={{
                    width: 76,
                    height: 106,
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #7b2ff7, #14151a)",
                    border: "2px solid rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "72%",
                      height: "78%",
                      border: "2px solid rgba(255,255,255,0.28)",
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
              <h3 className="splash-game__title">Fuck the Dealer</h3>
              <p className="splash-game__desc">
                Guess the rank in two tries. A second phone / tablet / TV
                becomes a shared card counter so everyone can see what's been
                played.
              </p>
              <div className="splash-game__meta">
                <span>👥 3–10 players</span>
                <span>📱 2 devices required</span>
              </div>
            </div>

            <div className="splash-game splash-game--piccolo">
              <div className="splash-game__visual">
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 14,
                    background:
                      "linear-gradient(135deg, #7b2ff7, #3a1d6e)",
                    border: "2px solid rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2.2rem",
                  }}
                >
                  🎴
                </div>
              </div>
              <h3 className="splash-game__title">Piccolo</h3>
              <p className="splash-game__desc">
                Draw a prompt card and do what it says. Drinks, dares, truths,
                races, rules — 120+ prompts, and you can toggle categories on
                and off per game.
              </p>
              <div className="splash-game__meta">
                <span>👥 3+ players</span>
                <span>📱 1 phone</span>
              </div>
            </div>

            <div className="splash-game splash-game--war">
              <div className="splash-game__visual">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="mini-card mini-card--red">K♥</div>
                  <div style={{ fontSize: "1.4rem" }}>⚔</div>
                  <div className="mini-card">K♠</div>
                </div>
              </div>
              <h3 className="splash-game__title">War</h3>
              <p className="splash-game__desc">
                1 vs 1, one phone between you. High card wins the hand, loser
                drinks. Tied ranks trigger a WAR — burn three, flip one, higher
                takes the pot. Simple or Traditional deck.
              </p>
              <div className="splash-game__meta">
                <span>👥 2 players</span>
                <span>📱 1 phone</span>
              </div>
            </div>

            <div className="splash-game splash-game--more">
              <div className="splash-game__visual">
                <div style={{ fontSize: "2.2rem", opacity: 0.75 }}>…</div>
              </div>
              <h3 className="splash-game__title">& more games</h3>
              <p className="splash-game__desc">
                Horse Race, Ride the Bus, and whatever we ship next. Lifetime
                holders get every future game at no extra cost.
              </p>
              <div className="splash-game__meta">
                <span>🚧 Rotating lineup</span>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="splash-section">
          <h2 className="splash-section__title">Three steps to your first round</h2>
          <div className="splash-steps">
            <div className="splash-step">
              <h3 className="splash-step__title">Sign up</h3>
              <p className="splash-step__text">
                Email or Google. 21+ only. Buy a day pass or lifetime access, or
                enter a license key from a friend.
              </p>
            </div>
            <div className="splash-step">
              <h3 className="splash-step__title">Pick a game</h3>
              <p className="splash-step__text">
                Home screen shows the full deck. Tap in, set up your table
                (players, spiciness, whatever), and you're dealing.
              </p>
            </div>
            <div className="splash-step">
              <h3 className="splash-step__title">Pass the phone</h3>
              <p className="splash-step__text">
                The phone walks the group through the game. Whoever's holding
                it is up. When it's someone else's turn, hand it over.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="splash-section" id="pricing">
          <h2 className="splash-section__title">Simple pricing</h2>
          <p className="splash-section__sub">
            One-time purchases. No subscription. If you have a friend's license
            key, you can skip payment entirely.
          </p>

          <div className="splash-pricing">
            <div className="splash-price">
              <div className="splash-price__label">Day Pass</div>
              <div className="splash-price__amount">
                $4.99
                <span className="splash-price__amount-unit">/ 24 hours</span>
              </div>
              <ul className="splash-price__list">
                <li>The whole deck of games</li>
                <li>Everything unlocks for 24 hours</li>
                <li>Great for a single bar night</li>
              </ul>
              <Link to="/signup" className="btn btn-block">
                Sign up + buy
              </Link>
            </div>

            <div className="splash-price splash-price--featured">
              <div className="splash-price__badge">BEST VALUE</div>
              <div className="splash-price__label">Lifetime</div>
              <div className="splash-price__amount">
                $20
                <span className="splash-price__amount-unit">/ forever</span>
              </div>
              <ul className="splash-price__list">
                <li>The whole deck, forever</li>
                <li>Every future game we ship</li>
                <li>7-day refund window if it's not for you</li>
              </ul>
              <Link to="/signup" className="btn btn-primary btn-block">
                Sign up + buy
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="splash-section">
          <h2 className="splash-section__title">FAQ</h2>
          <div className="splash-faq">
            <details>
              <summary>Is this really an app, or is it a website?</summary>
              <p>
                It's a website that behaves like an app. You open it in your
                phone's browser, no App Store or Play Store needed. You can add
                it to your home screen if you want the app icon.
              </p>
            </details>
            <details>
              <summary>Do all my friends need accounts?</summary>
              <p>
                No — only the person hosting the game (whoever owns the phone
                you're playing on) needs an account and access. For Fuck the
                Dealer, the second "table display" device connects via a QR
                code and doesn't need an account either.
              </p>
            </details>
            <details>
              <summary>Can I get a refund?</summary>
              <p>
                Day passes are non-refundable — it's $4.99 for one night. The
                lifetime purchase has a 7-day refund window, no questions
                asked. Email us.
              </p>
            </details>
            <details>
              <summary>What's the license key thing?</summary>
              <p>
                Admin-issued codes that grant a friend either a day pass or
                lifetime access. Handy if you want to comp someone into a game
                night. Ask a lifetime holder if they can generate one for you.
              </p>
            </details>
            <details>
              <summary>Will there be more games?</summary>
              <p>
                Yes. Lifetime holders get every future game we build at no
                additional cost.
              </p>
            </details>
            <details>
              <summary>Do I need to be drinking to play?</summary>
              <p>
                Nope. Every prompt is optional. Substitute a sip of anything
                you're drinking, do a pushup instead, or just laugh at the
                dare. Just be 21+ and don't be dumb.
              </p>
            </details>
          </div>
        </section>

        {/* Final CTA */}
        <section className="splash-cta">
          <h2 className="splash-cta__title">Grab your table and go.</h2>
          <p className="splash-cta__sub">
            Sign up in 30 seconds, then pass the phone.
          </p>
          <div className="splash-hero__ctas">
            <Link to="/signup" className="btn btn-primary splash-btn">
              Sign up
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="splash-footer">
          <div>© Bar Games. 21+ only. Drink responsibly.</div>
          <div className="splash-footer__links">
            <Link to="/login">Log in</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
