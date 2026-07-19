import { Link } from "react-router-dom";

export function CheckoutCancel() {
  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Checkout cancelled</h1>
        <p>No charge was made.</p>
      </div>

      <div className="stack" style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
        <div className="card-panel text-center" style={{ maxWidth: 360 }}>
          Changed your mind? No worries. Head back and try again anytime.
        </div>
        <Link to="/" className="btn btn-primary btn-block">
          Back to Bar Games
        </Link>
      </div>
    </div>
  );
}
