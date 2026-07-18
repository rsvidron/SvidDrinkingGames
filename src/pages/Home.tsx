import { Link } from "react-router-dom";
import { GAMES } from "../games/registry";

export function Home() {
  return (
    <div className="screen">
      <div className="screen-header">
        <h1>🍻 Bar Games</h1>
        <p>Pick a game, hand around the phone, drink responsibly.</p>
      </div>
      <div className="stack">
        {GAMES.map((game) => (
          <Link
            key={game.id}
            to={game.available ? game.path : "#"}
            className={`btn btn-block card-panel ${game.available ? "" : "btn-ghost"}`}
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
  );
}
