import { Link } from "react-router-dom";

export function Privacy() {
  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toISOString().slice(0, 10)}</p>
      </div>

      <div className="stack" style={{ fontSize: "0.95rem", lineHeight: 1.5 }}>
        <section>
          <strong>What we collect.</strong> Your email address, your birth year (for
          age verification), and a record of any purchases or license-key redemptions.
          If you sign in with Google, we receive your Google account email and profile
          info. Session and game state (including cards played during a session) live
          on your device and are not stored on our servers beyond what's needed for the
          shared table display feature.
        </section>
        <section>
          <strong>What we don't collect.</strong> We don't collect payment card details
          — Stripe handles that. We don't sell your data. We don't use ad networks.
        </section>
        <section>
          <strong>Where it lives.</strong> Account data is stored in Supabase
          (PostgreSQL). Payment records are stored at Stripe. Transactional email is
          sent via Resend.
        </section>
        <section>
          <strong>How we use it.</strong> To authenticate you, gate access to paid
          content, send purchase receipts and account emails, and respond to support
          requests.
        </section>
        <section>
          <strong>Your rights.</strong> You may request deletion of your account and
          data at any time by emailing us. Deletion is permanent.
        </section>
        <section>
          <strong>Cookies.</strong> We use only the cookies required to keep you logged
          in. No tracking cookies.
        </section>
        <section>
          <strong>Contact.</strong> support@svidnet.com.
        </section>
      </div>

      <div className="spacer" />

      <Link to="/" className="btn btn-ghost btn-block text-center">
        Back
      </Link>
    </div>
  );
}
