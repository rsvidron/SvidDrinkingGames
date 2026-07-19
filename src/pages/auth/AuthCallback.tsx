import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/authContext";

export function AuthCallback() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        if (!cancelled) setError(sessionError.message);
        return;
      }
      if (!data.session?.user) {
        // Not a fatal error — the redirect may have failed. Just send them to log in.
        if (!cancelled) navigate("/login", { replace: true });
        return;
      }

      // If this is a first-time Google signup where we stashed birth year + terms
      // in sessionStorage on the Signup page, apply them now.
      const pending = sessionStorage.getItem("pending_profile");
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          await supabase
            .from("profiles")
            .update({
              birth_year: parsed.birth_year,
              agreed_to_terms_at: parsed.agreed_to_terms_at,
            })
            .eq("id", data.session.user.id);
        } catch {
          // ignore
        }
        sessionStorage.removeItem("pending_profile");
      }

      await refreshProfile();
      if (!cancelled) navigate("/", { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, refreshProfile]);

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Signing you in...</h1>
        <p>Hold tight.</p>
      </div>
      {error && (
        <div
          className="card-panel text-center"
          style={{ borderColor: "var(--wrong)", color: "var(--wrong)" }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
