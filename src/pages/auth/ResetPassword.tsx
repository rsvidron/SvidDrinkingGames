import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export function ResetPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="screen">
        <div className="screen-header">
          <h1>Check your email</h1>
          <p>If an account exists, we sent a reset link to {email}.</p>
        </div>
        <div className="spacer" />
        <Link to="/login" className="btn btn-ghost btn-block text-center">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Reset password</h1>
        <p>We'll email you a link to set a new one.</p>
      </div>
      <form onSubmit={handleSubmit} className="stack">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "14px 16px",
            color: "var(--text)",
            fontSize: "1rem",
          }}
        />
        {error && (
          <div
            className="card-panel text-center"
            style={{ borderColor: "var(--wrong)", color: "var(--wrong)" }}
          >
            {error}
          </div>
        )}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <div className="spacer" />
      <Link to="/login" className="btn btn-ghost btn-block text-center">
        Back to log in
      </Link>
    </div>
  );
}
