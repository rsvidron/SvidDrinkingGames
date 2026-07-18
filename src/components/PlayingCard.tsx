import type { Card } from "../lib/deck";
import { suitColor, suitSymbol } from "../lib/deck";
import "./PlayingCard.css";

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
  highlight?: boolean;
}

export function PlayingCard({ card, faceDown, size = "md", highlight }: PlayingCardProps) {
  const classes = ["playing-card", `playing-card--${size}`];
  if (highlight) classes.push("playing-card--highlight");

  if (faceDown || !card) {
    return (
      <div className={[...classes, "playing-card--back"].join(" ")}>
        <div className="playing-card__back-pattern" />
      </div>
    );
  }

  const color = suitColor(card.suit);
  classes.push(`playing-card--${color}`);

  return (
    <div className={classes.join(" ")}>
      <span className="playing-card__rank playing-card__rank--top">{card.rank}</span>
      <span className="playing-card__suit">{suitSymbol(card.suit)}</span>
      <span className="playing-card__rank playing-card__rank--bottom">{card.rank}</span>
    </div>
  );
}
