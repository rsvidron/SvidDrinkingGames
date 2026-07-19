import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { WebSocketServer } from "ws";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// --- Optional Stripe + Supabase server clients ---------------------------
// If the env vars aren't set, /api/checkout/* and /webhooks/stripe just
// return 503 so local dev without Stripe still works for game testing.
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const supabaseAdmin =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

const STRIPE_PRICE_DAY_PASS = process.env.STRIPE_PRICE_DAY_PASS;
const STRIPE_PRICE_LIFETIME = process.env.STRIPE_PRICE_LIFETIME;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function jsonResponse(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function readJsonBody(req) {
  const buf = await readRawBody(req);
  if (buf.length === 0) return {};
  return JSON.parse(buf.toString("utf-8"));
}

async function requireAuthUser(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ") || !supabaseAdmin) return null;
  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function handleCheckoutCreate(req, res) {
  if (!stripe || !supabaseAdmin || !STRIPE_PRICE_DAY_PASS || !STRIPE_PRICE_LIFETIME) {
    return jsonResponse(res, 503, { error: "stripe_not_configured" });
  }
  const user = await requireAuthUser(req);
  if (!user) return jsonResponse(res, 401, { error: "unauthorized" });

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return jsonResponse(res, 400, { error: "bad_json" });
  }

  const plan = body.plan;
  let priceId;
  if (plan === "day_pass") priceId = STRIPE_PRICE_DAY_PASS;
  else if (plan === "lifetime") priceId = STRIPE_PRICE_LIFETIME;
  else return jsonResponse(res, 400, { error: "invalid_plan" });

  const origin =
    req.headers.origin ||
    (req.headers.host ? `https://${req.headers.host}` : "https://drinking.svidnet.com");

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: { user_id: user.id, plan },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
    });
    jsonResponse(res, 200, { url: session.url });
  } catch (err) {
    console.error("[stripe] checkout.session.create failed", err);
    jsonResponse(res, 500, { error: "stripe_error" });
  }
}

async function handleStripeWebhook(req, res) {
  if (!stripe || !supabaseAdmin || !STRIPE_WEBHOOK_SECRET) {
    return jsonResponse(res, 503, { error: "stripe_not_configured" });
  }
  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch {
    return jsonResponse(res, 400, { error: "bad_body" });
  }

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe] signature verification failed", err.message);
    return jsonResponse(res, 400, { error: "bad_signature" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan;
    const paymentId = session.payment_intent || session.id;

    if (!userId || !plan) {
      console.error("[stripe] missing metadata on session", session.id);
      return jsonResponse(res, 200, { received: true });
    }

    const type = plan === "day_pass" ? "day_pass" : "lifetime";
    const expiresAt =
      plan === "day_pass" ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

    const { error: insertErr } = await supabaseAdmin.from("grants").insert({
      user_id: userId,
      type,
      expires_at: expiresAt,
      source: "stripe",
      stripe_payment_id: paymentId,
    });
    if (insertErr) {
      console.error("[stripe] grant insert failed", insertErr);
      return jsonResponse(res, 500, { error: "grant_insert_failed" });
    }
    console.log(`[stripe] granted ${type} to user ${userId}`);
  }

  jsonResponse(res, 200, { received: true });
}

const PORT = process.env.PORT || 3000;
const DIST = path.resolve("dist");
const ROOM_TTL_MS = 60 * 60 * 1000; // 1 hour idle
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
const ROOM_CODE_LEN = 4;
const HEARTBEAT_INTERVAL_MS = 25_000; // under typical proxy idle limits (~30–100s)
const HOST_GRACE_MS = 60_000; // keep room alive this long after host disconnect for reconnect

/** @type {Map<string, { hostWs: import('ws').WebSocket | null, viewerWss: Set<import('ws').WebSocket>, lastState: unknown, gameId: string, updatedAt: number }>} */
const rooms = new Map();

function newCode() {
  let code;
  do {
    code = "";
    for (let i = 0; i < ROOM_CODE_LEN; i += 1) {
      code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
    }
  } while (rooms.has(code));
  return code;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  fs.createReadStream(filePath)
    .on("error", () => {
      res.writeHead(500);
      res.end("Server error");
    })
    .on("open", () => {
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
    })
    .pipe(res);
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url || "/");
  let pathname = decodeURIComponent(parsed.pathname || "/");
  if (pathname.includes("..")) {
    res.writeHead(400);
    res.end("Bad request");
    return;
  }

  // API + webhook routes (need to run BEFORE the static-file / SPA fallback).
  if (req.method === "POST" && pathname === "/api/checkout/create") {
    return handleCheckoutCreate(req, res);
  }
  if (req.method === "POST" && pathname === "/webhooks/stripe") {
    return handleStripeWebhook(req, res);
  }

  if (pathname === "/") pathname = "/index.html";
  let filePath = path.join(DIST, pathname);
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // SPA fallback — serve index.html so client-side router handles it
      const indexPath = path.join(DIST, "index.html");
      fs.stat(indexPath, (indexErr) => {
        if (indexErr) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        serveFile(res, indexPath);
      });
      return;
    }
    serveFile(res, filePath);
  });
});

const wss = new WebSocketServer({ server, path: "/ws" });

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function touch(room) {
  room.updatedAt = Date.now();
}

function randomToken() {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
}

setInterval(() => {
  const cutoff = Date.now() - ROOM_TTL_MS;
  for (const [code, room] of rooms) {
    if (room.updatedAt < cutoff && !room.hostWs && room.viewerWss.size === 0) {
      rooms.delete(code);
    }
  }
}, 60_000);

// Heartbeat: server sends WS-level pings; if a client doesn't respond by the
// next tick, terminate. Keeps NAT/proxy idle timers happy.
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    try {
      ws.ping();
    } catch {
      // ignore
    }
  });
}, HEARTBEAT_INTERVAL_MS);

wss.on("close", () => clearInterval(heartbeat));

wss.on("connection", (ws) => {
  let role = null; // "host" | "viewer"
  let code = null;
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (raw) => {
    ws.isAlive = true; // any app message also counts
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg.type === "ping") {
      send(ws, { type: "pong" });
      return;
    }
    if (msg.type === "createRoom") {
      code = newCode();
      const token = randomToken();
      const room = {
        hostWs: ws,
        hostToken: token,
        hostGraceTimer: null,
        viewerWss: new Set(),
        lastState: null,
        gameId: msg.gameId || "unknown",
        updatedAt: Date.now(),
      };
      rooms.set(code, room);
      role = "host";
      send(ws, { type: "roomCreated", code, token, gameId: room.gameId });
      return;
    }
    if (msg.type === "reclaimRoom") {
      const c = String(msg.code || "").toUpperCase();
      const room = rooms.get(c);
      if (!room || room.hostToken !== msg.token) {
        send(ws, { type: "error", error: "reclaimFailed" });
        return;
      }
      if (room.hostGraceTimer) {
        clearTimeout(room.hostGraceTimer);
        room.hostGraceTimer = null;
      }
      code = c;
      role = "host";
      room.hostWs = ws;
      touch(room);
      send(ws, { type: "roomReclaimed", code, gameId: room.gameId, viewerCount: room.viewerWss.size });
      // Ask host to re-broadcast its latest state so viewers refresh
      return;
    }
    if (msg.type === "joinRoom") {
      const c = String(msg.code || "").toUpperCase();
      const room = rooms.get(c);
      if (!room) {
        send(ws, { type: "error", error: "roomNotFound" });
        return;
      }
      code = c;
      role = "viewer";
      room.viewerWss.add(ws);
      touch(room);
      send(ws, { type: "joined", code, gameId: room.gameId, state: room.lastState });
      if (room.hostWs) send(room.hostWs, { type: "viewerJoined", count: room.viewerWss.size });
      return;
    }
    if (msg.type === "publish" && role === "host" && code) {
      const room = rooms.get(code);
      if (!room) return;
      room.lastState = msg.state;
      touch(room);
      for (const v of room.viewerWss) send(v, { type: "state", state: msg.state });
      return;
    }
  });

  ws.on("close", () => {
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    if (role === "host") {
      room.hostWs = null;
      // Give the host a grace window to reconnect before telling viewers.
      room.hostGraceTimer = setTimeout(() => {
        if (!room.hostWs) {
          for (const v of room.viewerWss) send(v, { type: "hostLeft" });
        }
      }, HOST_GRACE_MS);
    } else if (role === "viewer") {
      room.viewerWss.delete(ws);
      if (room.hostWs) send(room.hostWs, { type: "viewerLeft", count: room.viewerWss.size });
    }
    touch(room);
  });
});

server.listen(PORT, () => {
  console.log(`server listening on ${PORT}`);
});
