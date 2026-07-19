import { Link } from "react-router-dom";

export function Terms() {
  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Terms of Service</h1>
        <p>Last updated: {new Date().toISOString().slice(0, 10)}</p>
      </div>

      <div className="stack" style={{ fontSize: "0.95rem", lineHeight: 1.5 }}>
        <section>
          <strong>1. Age requirement.</strong> You must be at least 21 years old to use
          Bar Games. By creating an account you affirm that you meet this requirement.
        </section>
        <section>
          <strong>2. Service description.</strong> Bar Games is an entertainment app
          providing drinking-game facilitation software. It does not provide,
          distribute, or serve alcohol. Users are solely responsible for their own
          consumption and behavior.
        </section>
        <section>
          <strong>3. Access &amp; billing.</strong> Access is granted via a paid 24-hour
          pass, a lifetime purchase, or an admin-issued license key. All fees are
          charged in USD via Stripe. 24-hour passes are non-refundable. Lifetime
          purchases may be refunded within 7 days of purchase by emailing us — after
          that, no refunds.
        </section>
        <section>
          <strong>4. Acceptable use.</strong> Do not use Bar Games in a way that harms
          others, promotes hazing, coerces people to drink, or violates any law. We may
          terminate accounts that violate these terms.
        </section>
        <section>
          <strong>5. No warranty.</strong> The service is provided "as is" without
          warranty of any kind. To the maximum extent permitted by law, we disclaim
          liability for any harm arising out of use of the service, including but not
          limited to injury, illness, or property damage arising from alcohol
          consumption.
        </section>
        <section>
          <strong>6. Changes.</strong> We may update these terms. Continued use after
          updates constitutes acceptance.
        </section>
        <section>
          <strong>7. Contact.</strong> Reach us at support@svidnet.com.
        </section>
      </div>

      <div className="spacer" />

      <Link to="/" className="btn btn-ghost btn-block text-center">
        Back
      </Link>
    </div>
  );
}
