import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAccess } from "../lib/useAccess";

export function CheckoutSuccess() {
  const navigate = useNavigate();
  const { hasAccess, refresh } = useAccess();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // Stripe fires the webhook to our backend which writes the grant. Give it
    // a beat, then start polling in case the webhook lands a moment after us.
    let cancelled = false;
    const poll = async () => {
      for (let i = 0; i < 8 && !cancelled; i += 1) {
        await refresh();
        setAttempts(i + 1);
        if (hasAccess) return;
        await new Promise((r) => setTimeout(r, 1500));
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasAccess) {
      const t = setTimeout(() => navigate("/", { replace: true }), 800);
      return () => clearTimeout(t);
    }
  }, [hasAccess, navigate]);

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>🎉 Thanks!</h1>
        <p>Your payment went through.</p>
      </div>

      <div className="stack" style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
        <div className="card-panel text-center" style={{ maxWidth: 360 }}>
          {hasAccess ? (
            <>
              <strong style={{ color: "var(--correct)" }}>Access activated!</strong>
              <div className="text-dim">Taking you to the games...</div>
            </>
          ) : (
            <>
              <strong>Activating your account...</strong>
              <div className="text-dim">
                Confirming with Stripe (attempt {attempts}/8). This usually
                takes a couple seconds.
              </div>
            </>
          )}
        </div>
        {!hasAccess && attempts >= 8 && (
          <Link to="/" className="btn btn-primary btn-block">
            Continue anyway
          </Link>
        )}
      </div>
    </div>
  );
}
