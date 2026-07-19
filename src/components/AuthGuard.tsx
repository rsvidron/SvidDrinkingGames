import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/authContext";
import { useAccess } from "../lib/useAccess";
import { Paywall } from "../pages/Paywall";

interface Props {
  children: React.ReactNode;
  requireAccess?: boolean;
}

export function AuthGuard({ children, requireAccess = true }: Props) {
  const { session, loading: authLoading } = useAuth();
  const { hasAccess, loading: accessLoading } = useAccess();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="screen">
        <div className="screen-header">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireAccess) {
    if (accessLoading) {
      return (
        <div className="screen">
          <div className="screen-header">
            <h1>Loading...</h1>
          </div>
        </div>
      );
    }
    if (!hasAccess) {
      return <Paywall />;
    }
  }

  return <>{children}</>;
}
