import { PlayingCard } from "../../components/PlayingCard";
import type { RiverCardResult } from "./types";

interface Props {
  riverCards: RiverCardResult[];
  currentIndex: number;
  revealed: boolean;
}

function DrinkBadge({ rc }: { rc: RiverCardResult }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: -6,
        right: -6,
        background: rc.direction === "up" ? "var(--give)" : "var(--take)",
        color: rc.direction === "up" ? "#00203a" : "#3a0000",
        borderRadius: "50%",
        width: 24,
        height: 24,
        fontSize: "0.8rem",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {rc.drinkValue}
    </div>
  );
}

function RiverSlot({
  rc,
  isCurrent,
  revealed,
}: {
  rc: RiverCardResult;
  isCurrent: boolean;
  revealed: boolean;
}) {
  const showFace = rc.resolved || (isCurrent && revealed);

  return (
    <div style={{ position: "relative" }}>
      <PlayingCard
        card={showFace ? rc.card : undefined}
        faceDown={!showFace}
        size="md"
        highlight={isCurrent}
      />
      <DrinkBadge rc={rc} />
    </div>
  );
}

function HorizontalRiverSlot({
  rc,
  isCurrent,
  revealed,
}: {
  rc: RiverCardResult;
  isCurrent: boolean;
  revealed: boolean;
}) {
  const showFace = rc.resolved || (isCurrent && revealed);

  return (
    <div
      style={{
        position: "relative",
        width: 128,
        height: 92,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ transform: "rotate(90deg)" }}>
        <PlayingCard
          card={showFace ? rc.card : undefined}
          faceDown={!showFace}
          size="md"
          highlight={isCurrent}
        />
      </div>
      <DrinkBadge rc={rc} />
    </div>
  );
}

export function RiverCircle({ riverCards, currentIndex, revealed }: Props) {
  const upCards = riverCards.filter((c) => c.direction === "up");
  const downCards = riverCards.filter((c) => c.direction === "down");

  // Loop reads clockwise: top cap -> right column downward (give) ->
  // bottom cap -> left column upward (take) -> back to top cap.
  const topCap = upCards[0];
  const rightColumn = upCards.slice(1);
  const bottomCap = downCards[0];
  const leftColumn = [...downCards.slice(1)].reverse();

  const indexOf = (rc: RiverCardResult) => riverCards.indexOf(rc);

  return (
    <div
      style={{
        border: "1px dashed var(--border)",
        borderRadius: 200,
        width: "100%",
        maxWidth: 360,
        minHeight: 480,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 18px",
      }}
    >
      {topCap && (
        <HorizontalRiverSlot rc={topCap} isCurrent={indexOf(topCap) === currentIndex} revealed={revealed} />
      )}
      <div style={{ color: "var(--give)", fontWeight: 700, fontSize: "0.8rem", letterSpacing: 1 }}>
        GIVE
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          flex: 1,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20, justifyContent: "space-evenly" }}>
          {leftColumn.map((rc) => (
            <RiverSlot key={rc.card.id} rc={rc} isCurrent={indexOf(rc) === currentIndex} revealed={revealed} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, justifyContent: "space-evenly" }}>
          {rightColumn.map((rc) => (
            <RiverSlot key={rc.card.id} rc={rc} isCurrent={indexOf(rc) === currentIndex} revealed={revealed} />
          ))}
        </div>
      </div>

      <div style={{ color: "var(--take)", fontWeight: 700, fontSize: "0.8rem", letterSpacing: 1 }}>
        TAKE
      </div>
      {bottomCap && (
        <HorizontalRiverSlot
          rc={bottomCap}
          isCurrent={indexOf(bottomCap) === currentIndex}
          revealed={revealed}
        />
      )}
    </div>
  );
}
