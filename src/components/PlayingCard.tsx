import type { Card } from "../lib/deck";
import { suitColor, suitSymbol } from "../lib/deck";
import "./PlayingCard.css";

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
  /** When set, overrides the `size` preset — card renders at this pixel
   *  height with width auto (5:7 ratio) and font-size scaled proportionally.
   *  Use for viewport-fitting layouts where the fixed sm/md/lg sizes
   *  don't work. */
  pixelHeight?: number;
  highlight?: boolean;
}

export function PlayingCard({ card, faceDown, size = "md", pixelHeight, highlight }: PlayingCardProps) {
  const classes = ["playing-card"];
  if (!pixelHeight) classes.push(`playing-card--${size}`);
  if (highlight) classes.push("playing-card--highlight");

  // Card aspect ratio matches the lg preset (140:196 ≈ 5:7); font size at
  // that preset is 2.6rem for 196px height, i.e. ~21% of height in px.
  const style: React.CSSProperties | undefined = pixelHeight
    ? {
        width: Math.round(pixelHeight * (140 / 196)),
        height: Math.round(pixelHeight),
        fontSize: `${Math.round(pixelHeight * 0.21)}px`,
      }
    : undefined;

  if (faceDown || !card) {
    return (
      <div className={[...classes, "playing-card--back"].join(" ")} style={style}>
        <div className="playing-card__back-pattern" />
      </div>
    );
  }

  const color = suitColor(card.suit);
  classes.push(`playing-card--${color}`);

  return (
    <div className={classes.join(" ")} style={style}>
      <span className="playing-card__rank playing-card__rank--top">{card.rank}</span>
      <span className="playing-card__suit">{suitSymbol(card.suit)}</span>
      <span className="playing-card__rank playing-card__rank--bottom">{card.rank}</span>
    </div>
  );
}
