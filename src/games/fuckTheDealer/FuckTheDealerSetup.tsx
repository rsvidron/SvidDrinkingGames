import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import type { SharedRoomStatus } from "../../lib/sharedRoom";

interface RoomProps {
  status: SharedRoomStatus;
  code: string | null;
  viewerCount: number;
  viewerUrl: string | null;
}

interface Props {
  room: RoomProps;
  onStart: () => void;
}

export function FuckTheDealerSetup({ room, onStart }: Props) {
  const { status, code, viewerCount, viewerUrl } = room;
  const canStart = status === "connected" && viewerCount > 0;

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Fuck the Dealer</h1>
        <p>Requires 2 devices — one for the dealer, one for the table.</p>
      </div>

      <div className="stack">
        <div
          className="card-panel"
          style={{ borderColor: status === "connected" ? "var(--correct)" : "var(--gold)" }}
        >
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <strong>Table Display</strong>
              <div className="text-dim" style={{ fontSize: "0.85rem" }}>
                {status === "connecting" && "Setting up room..."}
                {status === "waiting" && "Scan the QR on a second phone / tablet / TV"}
                {status === "connected" &&
                  `Connected (${viewerCount} viewer${viewerCount === 1 ? "" : "s"})`}
                {status === "error" && "Connection error"}
              </div>
            </div>
            {code && (
              <div style={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: 2 }}>{code}</div>
            )}
          </div>

          {code && viewerUrl && status !== "connected" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: 12,
                gap: 8,
              }}
            >
              <div style={{ background: "#fff", padding: 12, borderRadius: 12 }}>
                <QRCodeSVG value={viewerUrl} size={180} />
              </div>
              <div
                className="text-dim"
                style={{ fontSize: "0.75rem", textAlign: "center", wordBreak: "break-all" }}
              >
                {viewerUrl}
              </div>
            </div>
          )}

          {status === "connected" && (
            <div
              className="card-panel text-center"
              style={{ borderColor: "var(--correct)", marginTop: 12 }}
            >
              <strong style={{ color: "var(--correct)" }}>Ready to deal ✓</strong>
            </div>
          )}
        </div>

        <div className="card-panel text-dim" style={{ fontSize: "0.85rem" }}>
          <strong style={{ color: "var(--text)" }}>How it works</strong>
          <div style={{ marginTop: 6 }}>
            • Pass the phone around the circle — whoever's dealing peeks and taps the next
            player's guess
            <br />
            • Correct on 1st guess → dealer drinks <strong>10 sec</strong>
            <br />
            • Correct on 2nd guess → dealer drinks <strong>5 sec</strong>
            <br />
            • Miss both → guesser drinks the rank difference in seconds
            <br />• 3 fails in a row → deck passes (physically hand the phone to the next
            person)
          </div>
        </div>
      </div>

      <div className="spacer" />

      <div className="stack">
        <button className="btn btn-primary btn-block" disabled={!canStart} onClick={onStart}>
          {status === "connected" ? "Deal Me In" : "Waiting for table display..."}
        </button>
        <Link to="/" className="btn btn-ghost btn-block text-center">
          Back to games
        </Link>
      </div>
    </div>
  );
}
