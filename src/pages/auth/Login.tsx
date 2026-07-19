import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleEmailLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate("/");
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Log in</h1>
        <p>Welcome back to Bar Games.</p>
      </div>

      <div className="stack">
        <button className="btn btn-block" onClick={handleGoogle}>
          Continue with Google
        </button>

        <div
          className="text-dim text-center"
          style={{ fontSize: "0.85rem", margin: "8px 0" }}
        >
          or
        </div>

        <form onSubmit={handleEmailLogin} className="stack">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            style={inputStyle}
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            style={inputStyle}
          />
          {error && (
            <div
              className="card-panel text-center"
              style={{ borderColor: "var(--wrong)", color: "var(--wrong)" }}
            >
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="text-center" style={{ fontSize: "0.9rem", marginTop: 12 }}>
          <Link to="/reset-password" className="text-dim">
            Forgot password?
          </Link>
        </div>
      </div>

      <div className="spacer" />

      <div className="text-center text-dim" style={{ fontSize: "0.9rem" }}>
        No account?{" "}
        <Link to="/signup" style={{ color: "var(--accent)", fontWeight: 600 }}>
          Sign up
        </Link>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "14px 16px",
  color: "var(--text)",
  fontSize: "1rem",
};
