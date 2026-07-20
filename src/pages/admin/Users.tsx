import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

interface ProfileRow {
  id: string;
  email: string;
  birth_year: number | null;
  agreed_to_terms_at: string | null;
  is_admin: boolean;
  created_at: string;
}

interface GrantRow {
  id: string;
  user_id: string;
  type: "day_pass" | "lifetime" | "license_key" | "admin";
  expires_at: string | null;
  source: string;
  stripe_payment_id: string | null;
  license_key_id: string | null;
  created_at: string;
}

interface UserSummary {
  profile: ProfileRow;
  grants: GrantRow[];
  bestGrant: GrantRow | null;
}

const GRANT_PRIORITY = ["admin", "lifetime", "license_key", "day_pass"] as const;

function pickBest(grants: GrantRow[]): GrantRow | null {
  const now = Date.now();
  const active = grants.filter(
    (g) => !g.expires_at || new Date(g.expires_at).getTime() > now
  );
  return (
    active.sort(
      (a, b) => GRANT_PRIORITY.indexOf(a.type) - GRANT_PRIORITY.indexOf(b.type)
    )[0] ?? null
  );
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const [profRes, grantRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, birth_year, agreed_to_terms_at, is_admin, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("grants")
        .select("id, user_id, type, expires_at, source, stripe_payment_id, license_key_id, created_at"),
    ]);

    if (profRes.error || grantRes.error) {
      setError((profRes.error ?? grantRes.error)?.message ?? "Load failed");
      setLoading(false);
      return;
    }

    const grantsByUser = new Map<string, GrantRow[]>();
    for (const g of (grantRes.data as GrantRow[]) ?? []) {
      const list = grantsByUser.get(g.user_id) ?? [];
      list.push(g);
      grantsByUser.set(g.user_id, list);
    }

    setUsers(
      ((profRes.data as ProfileRow[]) ?? []).map((p) => {
        const grants = grantsByUser.get(p.id) ?? [];
        return { profile: p, grants, bestGrant: pickBest(grants) };
      })
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.profile.email.toLowerCase().includes(q) ||
        u.profile.id.toLowerCase().includes(q)
    );
  }, [users, query]);

  async function grantLifetime(userId: string) {
    setBusyUserId(userId);
    const { error: e } = await supabase.from("grants").insert({
      user_id: userId,
      type: "lifetime",
      source: "admin",
    });
    if (e) alert(e.message);
    await load();
    setBusyUserId(null);
  }

  async function grantDayPass(userId: string) {
    setBusyUserId(userId);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error: e } = await supabase.from("grants").insert({
      user_id: userId,
      type: "day_pass",
      expires_at: expires,
      source: "admin",
    });
    if (e) alert(e.message);
    await load();
    setBusyUserId(null);
  }

  async function revokeAll(userId: string) {
    if (!confirm("Revoke ALL active grants for this user?")) return;
    setBusyUserId(userId);
    const { error: e } = await supabase
      .from("grants")
      .delete()
      .eq("user_id", userId);
    if (e) alert(e.message);
    await load();
    setBusyUserId(null);
  }

  async function toggleAdmin(userId: string, newValue: boolean) {
    setBusyUserId(userId);
    const { error: e } = await supabase
      .from("profiles")
      .update({ is_admin: newValue })
      .eq("id", userId);
    if (e) alert(e.message);
    await load();
    setBusyUserId(null);
  }

  return (
    <div>
      <h1 className="admin-page-title">Users</h1>
      <p className="admin-page-subtitle">
        {loading ? "Loading..." : `${users.length} total`}
      </p>

      <div className="admin-section">
        <input
          className="admin-input"
          placeholder="Search by email or user id"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="admin-section" style={{ borderColor: "var(--wrong)", color: "var(--wrong)" }}>
          {error}
        </div>
      )}

      <div className="admin-section" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Access</th>
              <th>Grants</th>
              <th>Signed up</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.profile.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{u.profile.email}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "monospace" }}>
                    {u.profile.id.slice(0, 8)}…
                  </div>
                </td>
                <td>
                  {u.profile.is_admin && (
                    <span className="admin-badge admin-badge--gold" style={{ marginRight: 4 }}>
                      Admin
                    </span>
                  )}
                  {u.bestGrant ? (
                    <span
                      className={`admin-badge ${
                        u.bestGrant.type === "lifetime"
                          ? "admin-badge--gold"
                          : u.bestGrant.type === "day_pass"
                          ? "admin-badge--blue"
                          : "admin-badge--green"
                      }`}
                    >
                      {u.bestGrant.type === "day_pass" ? "Day Pass" : u.bestGrant.type}
                    </span>
                  ) : (
                    !u.profile.is_admin && (
                      <span className="admin-badge admin-badge--dim">No access</span>
                    )
                  )}
                </td>
                <td>
                  <div style={{ fontSize: "0.85rem" }}>
                    {u.grants.length ? `${u.grants.length} total` : "—"}
                  </div>
                  {u.bestGrant?.expires_at && (
                    <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                      until {new Date(u.bestGrant.expires_at).toLocaleString()}
                    </div>
                  )}
                </td>
                <td style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
                  {new Date(u.profile.created_at).toLocaleDateString()}
                </td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <button
                      className="btn"
                      style={{ minHeight: 32, padding: "4px 10px", fontSize: "0.8rem" }}
                      onClick={() => grantDayPass(u.profile.id)}
                      disabled={busyUserId === u.profile.id}
                    >
                      + Day
                    </button>
                    <button
                      className="btn"
                      style={{ minHeight: 32, padding: "4px 10px", fontSize: "0.8rem" }}
                      onClick={() => grantLifetime(u.profile.id)}
                      disabled={busyUserId === u.profile.id}
                    >
                      + Lifetime
                    </button>
                    <button
                      className="btn"
                      style={{
                        minHeight: 32,
                        padding: "4px 10px",
                        fontSize: "0.8rem",
                        borderColor: "var(--wrong)",
                        color: "var(--wrong)",
                      }}
                      onClick={() => revokeAll(u.profile.id)}
                      disabled={busyUserId === u.profile.id || u.grants.length === 0}
                    >
                      Revoke
                    </button>
                    <button
                      className="btn"
                      style={{
                        minHeight: 32,
                        padding: "4px 10px",
                        fontSize: "0.8rem",
                      }}
                      onClick={() => toggleAdmin(u.profile.id, !u.profile.is_admin)}
                      disabled={busyUserId === u.profile.id}
                    >
                      {u.profile.is_admin ? "Un-admin" : "Make admin"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--text-dim)", padding: 20 }}>
                  No users match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
