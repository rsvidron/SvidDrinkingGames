interface Props {
  onBuyDayPass?: () => void;
  onBuyLifetime?: () => void;
  disabled?: boolean;
}

export function PricingCards({ onBuyDayPass, onBuyLifetime, disabled }: Props) {
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div
        className="card-panel"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="text-dim"
          style={{ fontSize: "0.75rem", letterSpacing: 1 }}
        >
          DAY PASS
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <strong style={{ fontSize: "1.6rem" }}>$4.99</strong>
          <span className="text-dim" style={{ fontSize: "0.85rem" }}>
            24 hours
          </span>
        </div>
        <div
          className="text-dim"
          style={{ marginTop: 8, fontSize: "0.9rem", lineHeight: 1.4 }}
        >
          One night of unlimited games. Perfect for a bar visit.
        </div>
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 12 }}
          disabled={disabled}
          onClick={onBuyDayPass}
        >
          Get 24-hour pass
        </button>
      </div>

      <div
        className="card-panel"
        style={{
          borderColor: "var(--gold)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -10,
            right: 12,
            background: "var(--gold)",
            color: "#3a2c00",
            padding: "2px 10px",
            borderRadius: 20,
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          BEST VALUE
        </div>
        <div
          className="text-dim"
          style={{ fontSize: "0.75rem", letterSpacing: 1 }}
        >
          LIFETIME
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <strong style={{ fontSize: "1.6rem" }}>$20</strong>
          <span className="text-dim" style={{ fontSize: "0.85rem" }}>
            Forever
          </span>
        </div>
        <div
          className="text-dim"
          style={{ marginTop: 8, fontSize: "0.9rem", lineHeight: 1.4 }}
        >
          Every game, every night, no expiration. Plus every new game we ship.
        </div>
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 12 }}
          disabled={disabled}
          onClick={onBuyLifetime}
        >
          Get lifetime access
        </button>
      </div>
    </div>
  );
}
