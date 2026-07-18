import { PlayingCard } from "../../components/PlayingCard";
import type { RiverCardResult } from "./types";

interface Props {
  riverCards: RiverCardResult[];
  currentIndex: number;
  revealed: boolean;
}

const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 118;

function arcPoint(t: number, startDeg: number, endDeg: number) {
  const angle = startDeg + (endDeg - startDeg) * t;
  const rad = (angle * Math.PI) / 180;
  return {
    x: CENTER + RADIUS * Math.cos(rad),
    y: CENTER + RADIUS * Math.sin(rad),
  };
}

export function RiverCircle({ riverCards, currentIndex, revealed }: Props) {
  const upTotal = riverCards.filter((c) => c.direction === "up").length;
  const downTotal = riverCards.filter((c) => c.direction === "down").length;

  return (
    <div style={{ position: "relative", width: SIZE, height: SIZE, margin: "0 auto" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "1px dashed var(--border)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 6,
          left: "50%",
          transform: "translateX(-50%)",
          color: "var(--give)",
          fontWeight: 700,
          fontSize: "0.75rem",
          letterSpacing: 1,
        }}
      >
        GIVE
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 6,
          left: "50%",
          transform: "translateX(-50%)",
          color: "var(--take)",
          fontWeight: 700,
          fontSize: "0.75rem",
          letterSpacing: 1,
        }}
      >
        TAKE
      </div>

      {riverCards.map((rc, idx) => {
        const total = rc.direction === "up" ? upTotal : downTotal;
        const t = total === 1 ? 0.5 : rc.positionInHalf / (total - 1);
        const [startDeg, endDeg] = rc.direction === "up" ? [200, 340] : [20, 160];
        const { x, y } = arcPoint(t, startDeg, endDeg);
        const isCurrent = idx === currentIndex;
        const showFace = rc.resolved || (isCurrent && revealed);

        return (
          <div
            key={rc.card.id}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <PlayingCard
              card={showFace ? rc.card : undefined}
              faceDown={!showFace}
              size="sm"
              highlight={isCurrent}
            />
            <div
              style={{
                position: "absolute",
                bottom: -6,
                right: -6,
                background: rc.direction === "up" ? "var(--give)" : "var(--take)",
                color: rc.direction === "up" ? "#3a0000" : "#00203a",
                borderRadius: "50%",
                width: 18,
                height: 18,
                fontSize: "0.65rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {rc.drinkValue}
            </div>
          </div>
        );
      })}
    </div>
  );
}
