import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/authContext";

interface KeyRow {
  id: string;
  code: string;
  grant_type: "day_pass" | "lifetime";
  duration_hours: number | null;
  max_redemptions: number;
  redemption_count: number;
  created_at: string;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I

function generateCode(prefix?: string): string {
  const part = () =>
    Array.from({ length: 4 }, () =>
      CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    ).join("");
  const parts = [part(), part(), part(), part()];
  if (prefix) parts.unshift(prefix.toUpperCase().slice(0, 8));
  return parts.join("-");
}

export function AdminLicenseKeys() {
  const { profile } = useAuth();
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [prefix, setPrefix] = useState("");
  const [grantType, setGrantType] = useState<"day_pass" | "lifetime">("lifetime");
  const [durationHours, setDurationHours] = useState(24);
  const [quantity, setQuantity] = useState(1);
  const [maxRedemptions, setMaxRedemptions] = useState(1);
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from("license_keys")
      .select("id, code, grant_type, duration_hours, max_redemptions, redemption_count, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (e) {
      setError(e.message);
    } else {
      setKeys((data as KeyRow[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setJustCreated([]);

    const codes = Array.from({ length: Math.max(1, Math.min(50, quantity)) }, () =>
      generateCode(prefix || undefined)
    );
    const rows = codes.map((code) => ({
      code,
      grant_type: grantType,
      duration_hours: grantType === "day_pass" ? durationHours : null,
      max_redemptions: Math.max(1, Math.min(1000, maxRedemptions)),
      created_by_admin_id: profile?.id ?? null,
    }));

    const { error: insertErr } = await supabase.from("license_keys").insert(rows);
    if (insertErr) {
      setError(insertErr.message);
    } else {
      setJustCreated(codes);
      await load();
    }
    setCreating(false);
  }

  const available = keys.filter((k) => k.redemption_count < k.max_redemptions);
  const exhausted = keys.filter((k) => k.redemption_count >= k.max_redemptions);

  return (
    <div>
      <h1 className="admin-page-title">License Keys</h1>
      <p className="admin-page-subtitle">
        {loading
          ? "Loading..."
          : `${available.length} available · ${exhausted.length} fully used · ${keys.length} total`}
      </p>

      <div className="admin-section">
        <div className="admin-section__title">Generate keys</div>
        <div className="admin-section__hint">
          Codes look like <code>PREFIX-XXXX-XXXX-XXXX-XXXX</code>. Set uses per
          key to give one code to a group of friends.
        </div>
        <form onSubmit={handleCreate}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <label>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: 4 }}>
                Prefix (optional)
              </div>
              <input
                className="admin-input"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="BOBBY"
                maxLength={8}
              />
            </label>
            <label>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: 4 }}>
                Grant type
              </div>
              <select
                className="admin-input"
                value={grantType}
                onChange={(e) => setGrantType(e.target.value as "day_pass" | "lifetime")}
              >
                <option value="lifetime">Lifetime</option>
                <option value="day_pass">Day pass</option>
              </select>
            </label>
            {grantType === "day_pass" && (
              <label>
                <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: 4 }}>
                  Duration (hours)
                </div>
                <input
                  className="admin-input"
                  type="number"
                  min={1}
                  max={720}
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseInt(e.target.value, 10) || 24)}
                />
              </label>
            )}
            <label>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: 4 }}>
                Uses per key
              </div>
              <input
                className="admin-input"
                type="number"
                min={1}
                max={1000}
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(parseInt(e.target.value, 10) || 1)}
              />
            </label>
            <label>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: 4 }}>
                Quantity (1–50)
              </div>
              <input
                className="admin-input"
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              />
            </label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating
              ? "Creating..."
              : `Create ${quantity} key${quantity === 1 ? "" : "s"}${
                  maxRedemptions > 1 ? ` × ${maxRedemptions} uses` : ""
                }`}
          </button>
        </form>

        {error && (
          <div
            className="card-panel text-center"
            style={{ borderColor: "var(--wrong)", color: "var(--wrong)", marginTop: 12 }}
          >
            {error}
          </div>
        )}

        {justCreated.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: "0.8rem", color: "var(--correct)", marginBottom: 6, fontWeight: 700 }}>
              ✓ Created {justCreated.length} key{justCreated.length === 1 ? "" : "s"} — copy them now:
            </div>
            <div
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 12,
                fontFamily: "ui-monospace, Menlo, Consolas, monospace",
                fontSize: "0.85rem",
                lineHeight: 1.6,
                userSelect: "all",
              }}
            >
              {justCreated.map((c) => (
                <div key={c}>{c}</div>
              ))}
            </div>
            <button
              className="btn"
              style={{ marginTop: 8, minHeight: 36 }}
              onClick={() => navigator.clipboard.writeText(justCreated.join("\n"))}
            >
              📋 Copy all
            </button>
          </div>
        )}
      </div>

      <div className="admin-section" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Uses</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => {
              const fullyUsed = k.redemption_count >= k.max_redemptions;
              const partial = k.redemption_count > 0 && !fullyUsed;
              return (
                <tr key={k.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{k.code}</td>
                  <td>
                    <span
                      className={`admin-badge ${
                        k.grant_type === "lifetime" ? "admin-badge--gold" : "admin-badge--blue"
                      }`}
                    >
                      {k.grant_type === "lifetime" ? "Lifetime" : `Day pass (${k.duration_hours}h)`}
                    </span>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
                    {k.redemption_count} / {k.max_redemptions}
                  </td>
                  <td>
                    {fullyUsed ? (
                      <span className="admin-badge admin-badge--dim">Fully used</span>
                    ) : partial ? (
                      <span className="admin-badge admin-badge--gold">Partial</span>
                    ) : (
                      <span className="admin-badge admin-badge--green">Available</span>
                    )}
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {!loading && keys.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--text-dim)", padding: 20 }}>
                  No keys yet. Generate some above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
