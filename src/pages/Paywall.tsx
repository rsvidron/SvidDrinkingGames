import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { PricingCards } from "../components/PricingCards";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/authContext";
import { useAccess } from "../lib/useAccess";

export function Paywall() {
  const { signOut } = useAuth();
  const { refresh } = useAccess();
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function redeem(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setRedeeming(true);
    const { data, error: rpcError } = await supabase.rpc("redeem_license_key", {
      code_input: code.trim().toUpperCase(),
    });
    setRedeeming(false);
    if (rpcError) {
      setError(rpcError.message.replace(/^.*?:\s*/, ""));
      return;
    }
    setSuccess(
      `Redeemed! ${
        data?.[0]?.grant_type === "lifetime" ? "Lifetime access" : "Day pass"
      } activated.`
    );
    setCode("");
    await refresh();
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Get access</h1>
        <p>Pick a plan or redeem a license key.</p>
      </div>

      <div className="stack" style={{ gap: 16 }}>
        <PricingCards disabled />
        <p
          className="text-dim text-center"
          style={{ fontSize: "0.85rem", margin: "-4px 0 4px" }}
        >
          (Stripe checkout is being finalized — hang tight.)
        </p>

        <div className="card-panel">
          <strong>Have a license key?</strong>
          <form onSubmit={redeem} className="stack" style={{ marginTop: 10, gap: 8 }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "12px 14px",
                color: "var(--text)",
                fontSize: "1rem",
                letterSpacing: 2,
                fontFamily: "ui-monospace, Menlo, Consolas, monospace",
                textTransform: "uppercase",
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
            {success && (
              <div
                className="card-panel text-center"
                style={{ borderColor: "var(--correct)", color: "var(--correct)" }}
              >
                {success}
              </div>
            )}
            <button
              className="btn btn-primary btn-block"
              disabled={redeeming || !code.trim()}
            >
              {redeeming ? "Redeeming..." : "Redeem"}
            </button>
          </form>
        </div>
      </div>

      <div className="spacer" />

      <div
        className="text-center text-dim"
        style={{ fontSize: "0.9rem", marginTop: 20 }}
      >
        <button
          onClick={signOut}
          className="btn btn-ghost btn-block"
          style={{ marginBottom: 8 }}
        >
          Log out
        </button>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <Link to="/terms" style={{ color: "var(--text-dim)" }}>
            Terms
          </Link>
          <Link to="/privacy" style={{ color: "var(--text-dim)" }}>
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}
