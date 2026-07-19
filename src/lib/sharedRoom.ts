import { useEffect, useRef, useState } from "react";

export type SharedRoomStatus =
  | "idle"
  | "connecting"
  | "waiting"
  | "connected"
  | "roomNotFound"
  | "hostLeft"
  | "error";

interface HostRoomResult<TState> {
  status: SharedRoomStatus;
  code: string | null;
  viewerCount: number;
  publish: (state: TState) => void;
  viewerUrl: string | null;
}

interface ViewerRoomResult<TState> {
  status: SharedRoomStatus;
  state: TState | null;
}

const RECONNECT_DELAY_MS = 1500;
const APP_PING_INTERVAL_MS = 25_000;

function buildWsUrl(): string {
  const { protocol, host } = window.location;
  const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${host}/ws`;
}

export function useHostRoom<TState>(gameId: string, enabled: boolean): HostRoomResult<TState> {
  const [status, setStatus] = useState<SharedRoomStatus>("idle");
  const [code, setCode] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const tokenRef = useRef<string | null>(null);
  const codeRef = useRef<string | null>(null);
  const lastStateRef = useRef<TState | null>(null);
  const closedByCleanupRef = useRef(false);
  const reconnectTimerRef = useRef<number | null>(null);
  const pingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    closedByCleanupRef.current = false;

    let cancelled = false;

    function scheduleReconnect() {
      if (cancelled) return;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = window.setTimeout(() => connect(), RECONNECT_DELAY_MS);
    }

    function connect() {
      if (cancelled) return;
      setStatus((prev) => (prev === "connected" || prev === "waiting" ? prev : "connecting"));
      const ws = new WebSocket(buildWsUrl());
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        if (cancelled) return;
        if (codeRef.current && tokenRef.current) {
          ws.send(
            JSON.stringify({
              type: "reclaimRoom",
              code: codeRef.current,
              token: tokenRef.current,
            })
          );
        } else {
          ws.send(JSON.stringify({ type: "createRoom", gameId }));
        }
        if (pingTimerRef.current) window.clearInterval(pingTimerRef.current);
        pingTimerRef.current = window.setInterval(() => {
          if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "ping" }));
        }, APP_PING_INTERVAL_MS);
      });

      ws.addEventListener("message", (evt) => {
        let msg: {
          type: string;
          code?: string;
          token?: string;
          count?: number;
          viewerCount?: number;
          error?: string;
        };
        try {
          msg = JSON.parse(evt.data);
        } catch {
          return;
        }
        if (msg.type === "roomCreated" && msg.code && msg.token) {
          codeRef.current = msg.code;
          tokenRef.current = msg.token;
          setCode(msg.code);
          setStatus("waiting");
          return;
        }
        if (msg.type === "roomReclaimed" && typeof msg.viewerCount === "number") {
          setViewerCount(msg.viewerCount);
          setStatus(msg.viewerCount > 0 ? "connected" : "waiting");
          // Re-broadcast last known state so viewers refresh.
          if (lastStateRef.current !== null) {
            ws.send(JSON.stringify({ type: "publish", state: lastStateRef.current }));
          }
          return;
        }
        if (msg.type === "viewerJoined" && typeof msg.count === "number") {
          setViewerCount(msg.count);
          setStatus("connected");
          return;
        }
        if (msg.type === "viewerLeft" && typeof msg.count === "number") {
          setViewerCount(msg.count);
          if (msg.count === 0) setStatus("waiting");
          return;
        }
        if (msg.type === "error" && msg.error === "reclaimFailed") {
          // Lost the room — start over.
          codeRef.current = null;
          tokenRef.current = null;
          setCode(null);
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: "createRoom", gameId }));
          }
        }
      });

      ws.addEventListener("close", () => {
        if (pingTimerRef.current) {
          window.clearInterval(pingTimerRef.current);
          pingTimerRef.current = null;
        }
        if (closedByCleanupRef.current || cancelled) return;
        // Try to reconnect.
        setStatus("connecting");
        scheduleReconnect();
      });
    }

    connect();

    return () => {
      cancelled = true;
      closedByCleanupRef.current = true;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      if (pingTimerRef.current) window.clearInterval(pingTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, gameId]);

  const publish = (state: TState) => {
    lastStateRef.current = state;
    const ws = wsRef.current;
    if (!ws || ws.readyState !== ws.OPEN) return;
    ws.send(JSON.stringify({ type: "publish", state }));
  };

  const viewerUrl = code ? `${window.location.origin}/view/${code}` : null;

  return { status, code, viewerCount, publish, viewerUrl };
}

export function useViewerRoom<TState>(code: string | null): ViewerRoomResult<TState> {
  const [status, setStatus] = useState<SharedRoomStatus>("idle");
  const [state, setState] = useState<TState | null>(null);
  const closedByCleanupRef = useRef(false);
  const reconnectTimerRef = useRef<number | null>(null);
  const pingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!code) return;
    closedByCleanupRef.current = false;
    let cancelled = false;

    function scheduleReconnect() {
      if (cancelled) return;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = window.setTimeout(() => connect(), RECONNECT_DELAY_MS);
    }

    function connect() {
      if (cancelled) return;
      setStatus((prev) => (prev === "connected" ? prev : "connecting"));
      const ws = new WebSocket(buildWsUrl());

      ws.addEventListener("open", () => {
        if (cancelled) return;
        ws.send(JSON.stringify({ type: "joinRoom", code }));
        if (pingTimerRef.current) window.clearInterval(pingTimerRef.current);
        pingTimerRef.current = window.setInterval(() => {
          if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "ping" }));
        }, APP_PING_INTERVAL_MS);
      });

      ws.addEventListener("message", (evt) => {
        let msg: {
          type: string;
          state?: TState;
          error?: string;
        };
        try {
          msg = JSON.parse(evt.data);
        } catch {
          return;
        }
        if (msg.type === "joined") {
          setStatus("connected");
          if (msg.state !== undefined) setState(msg.state ?? null);
          return;
        }
        if (msg.type === "state" && msg.state !== undefined) {
          setState(msg.state ?? null);
          return;
        }
        if (msg.type === "hostLeft") {
          setStatus("hostLeft");
          return;
        }
        if (msg.type === "error" && msg.error === "roomNotFound") {
          setStatus("roomNotFound");
          closedByCleanupRef.current = true; // don't reconnect
          ws.close();
        }
      });

      ws.addEventListener("close", () => {
        if (pingTimerRef.current) {
          window.clearInterval(pingTimerRef.current);
          pingTimerRef.current = null;
        }
        if (closedByCleanupRef.current || cancelled) return;
        setStatus((prev) => (prev === "hostLeft" || prev === "roomNotFound" ? prev : "connecting"));
        scheduleReconnect();
      });
    }

    connect();

    return () => {
      cancelled = true;
      closedByCleanupRef.current = true;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      if (pingTimerRef.current) window.clearInterval(pingTimerRef.current);
    };
  }, [code]);

  return { status, state };
}
