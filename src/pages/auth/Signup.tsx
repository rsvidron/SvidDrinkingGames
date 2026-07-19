import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;
const MAX_ALLOWED_YEAR = CURRENT_YEAR - 21;

export function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate(): string | null {
    const year = parseInt(birthYear, 10);
    if (!year || year < MIN_YEAR || year > CURRENT_YEAR) {
      return "Please enter a valid birth year.";
    }
    if (year > MAX_ALLOWED_YEAR) {
      return "You must be 21 or older to use this app.";
    }
    if (!agreed) {
      return "You must agree to the Terms and Privacy Policy.";
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setBusy(true);

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          birth_year: parseInt(birthYear, 10),
        },
      },
    });
    if (signupError) {
      setBusy(false);
      setError(signupError.message);
      return;
    }

    // If the user already has a session (e.g. autoconfirm on in Supabase for dev),
    // write their profile now. If they still need to verify email, we do this
    // again on first login via the callback page.
    if (data.user) {
      await supabase
        .from("profiles")
        .update({
          birth_year: parseInt(birthYear, 10),
          agreed_to_terms_at: new Date().toISOString(),
        })
        .eq("id", data.user.id);
    }

    setBusy(false);
    setSubmitted(true);
  }

  async function handleGoogle() {
    setError(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    // Stash birth year + terms so the AuthCallback can finish the profile
    // once Google redirects back.
    sessionStorage.setItem(
      "pending_profile",
      JSON.stringify({
        birth_year: parseInt(birthYear, 10),
        agreed_to_terms_at: new Date().toISOString(),
      })
    );
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) setError(oauthError.message);
  }

  if (submitted) {
    return (
      <div className="screen">
        <div className="screen-header">
          <h1>Check your email</h1>
          <p>We sent a verification link to {email}.</p>
        </div>
        <div className="stack">
          <div className="card-panel text-center">
            Click the link in the email to activate your account. It may take a minute
            to arrive — check your spam folder if you don't see it.
          </div>
          <button
            className="btn btn-ghost btn-block"
            onClick={() => navigate("/login")}
          >
            Back to log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Create account</h1>
        <p>Bar Games — 21+ only.</p>
      </div>

      <div className="stack">
        <form onSubmit={handleSubmit} className="stack">
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 chars)"
            autoComplete="new-password"
            style={inputStyle}
          />
          <input
            type="number"
            required
            min={MIN_YEAR}
            max={CURRENT_YEAR}
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            placeholder="Birth year (must be 21+)"
            inputMode="numeric"
            style={inputStyle}
          />

          <label
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              fontSize: "0.9rem",
              color: "var(--text-dim)",
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: 3, width: 18, height: 18 }}
            />
            <span>
              I confirm I am 21 or older and agree to the{" "}
              <Link to="/terms" style={{ color: "var(--accent)" }}>
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" style={{ color: "var(--accent)" }}>
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {error && (
            <div
              className="card-panel text-center"
              style={{ borderColor: "var(--wrong)", color: "var(--wrong)" }}
            >
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div
          className="text-dim text-center"
          style={{ fontSize: "0.85rem", margin: "8px 0" }}
        >
          or
        </div>

        <button className="btn btn-block" onClick={handleGoogle}>
          Continue with Google
        </button>
      </div>

      <div className="spacer" />

      <div className="text-center text-dim" style={{ fontSize: "0.9rem" }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>
          Log in
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
