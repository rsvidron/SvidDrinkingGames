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

  useEffect(() => {
    if (!enabled) return;
    setStatus("connecting");
    const ws = new WebSocket(buildWsUrl());
    wsRef.current = ws;

    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ type: "createRoom", gameId }));
    });

    ws.addEventListener("message", (evt) => {
      let msg: {
        type: string;
        code?: string;
        count?: number;
        error?: string;
      };
      try {
        msg = JSON.parse(evt.data);
      } catch {
        return;
      }
      if (msg.type === "roomCreated" && typeof msg.code === "string") {
        setCode(msg.code);
        setStatus("waiting");
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
      if (msg.type === "error") {
        setStatus("error");
      }
    });

    ws.addEventListener("close", () => {
      if (wsRef.current === ws) setStatus("error");
    });

    return () => {
      wsRef.current = null;
      ws.close();
    };
  }, [enabled, gameId]);

  const publish = (state: TState) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== ws.OPEN) return;
    ws.send(JSON.stringify({ type: "publish", state }));
  };

  const viewerUrl = code
    ? `${window.location.origin}/view/${code}`
    : null;

  return { status, code, viewerCount, publish, viewerUrl };
}

export function useViewerRoom<TState>(code: string | null): ViewerRoomResult<TState> {
  const [status, setStatus] = useState<SharedRoomStatus>("idle");
  const [state, setState] = useState<TState | null>(null);

  useEffect(() => {
    if (!code) return;
    setStatus("connecting");
    const ws = new WebSocket(buildWsUrl());

    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ type: "joinRoom", code }));
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
      }
    });

    ws.addEventListener("close", () => {
      setStatus((prev) => (prev === "hostLeft" || prev === "roomNotFound" ? prev : "error"));
    });

    return () => {
      ws.close();
    };
  }, [code]);

  return { status, state };
}
