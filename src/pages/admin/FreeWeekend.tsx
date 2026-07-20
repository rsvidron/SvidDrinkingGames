import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface Settings {
  free_weekend_from: string | null;
  free_weekend_to: string | null;
  updated_at: string;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string): string | null {
  if (!v) return null;
  return new Date(v).toISOString();
}

export function AdminFreeWeekend() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error: e } = await supabase
      .from("app_settings")
      .select("free_weekend_from, free_weekend_to, updated_at")
      .eq("id", 1)
      .single();
    if (e) setError(e.message);
    else {
      setSettings(data as Settings);
      setFrom(toLocalInput(data.free_weekend_from));
      setTo(toLocalInput(data.free_weekend_to));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    const { error: e } = await supabase
      .from("app_settings")
      .update({
        free_weekend_from: fromLocalInput(from),
        free_weekend_to: fromLocalInput(to),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setSaving(false);
    if (e) setError(e.message);
    else {
      setMessage("Saved.");
      await load();
    }
  }

  function startNowFor(hours: number) {
    const now = new Date();
    const end = new Date(now.getTime() + hours * 60 * 60 * 1000);
    setFrom(toLocalInput(now.toISOString()));
    setTo(toLocalInput(end.toISOString()));
  }

  function clearWindow() {
    setFrom("");
    setTo("");
  }

  const now = Date.now();
  const active =
    settings?.free_weekend_from &&
    settings?.free_weekend_to &&
    new Date(settings.free_weekend_from).getTime() <= now &&
    new Date(settings.free_weekend_to).getTime() >= now;

  return (
    <div>
      <h1 className="admin-page-title">Free Weekend</h1>
      <p className="admin-page-subtitle">
        While the window is active, every signed-in user has full access —
        no purchase or license key required.
      </p>

      <div
        className="admin-section"
        style={{ borderColor: active ? "var(--correct)" : "var(--border)" }}
      >
        <div className="admin-section__title">
          Current status:{" "}
          {loading ? (
            "Loading..."
          ) : active ? (
            <span style={{ color: "var(--correct)" }}>🎉 ACTIVE</span>
          ) : (
            <span className="text-dim">Off</span>
          )}
        </div>
        {settings?.free_weekend_from && settings?.free_weekend_to && (
          <div className="admin-section__hint">
            {new Date(settings.free_weekend_from).toLocaleString()} →{" "}
            {new Date(settings.free_weekend_to).toLocaleString()}
          </div>
        )}
      </div>

      <div className="admin-section">
        <div className="admin-section__title">Quick set</div>
        <div className="admin-section__hint">
          Start the window right now, ending after the chosen duration.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" onClick={() => startNowFor(24)}>
            Now → 24h
          </button>
          <button className="btn" onClick={() => startNowFor(48)}>
            Now → 48h
          </button>
          <button className="btn" onClick={() => startNowFor(72)}>
            Now → 3 days (weekend)
          </button>
          <button className="btn" onClick={() => startNowFor(168)}>
            Now → 7 days
          </button>
          <button
            className="btn"
            style={{ borderColor: "var(--wrong)", color: "var(--wrong)" }}
            onClick={clearWindow}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section__title">Custom window</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <label>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: 4 }}>
              From
            </div>
            <input
              className="admin-input"
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: 4 }}>
              To
            </div>
            <input
              className="admin-input"
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        {message && (
          <div style={{ color: "var(--correct)", marginTop: 8, fontSize: "0.9rem" }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ color: "var(--wrong)", marginTop: 8, fontSize: "0.9rem" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
