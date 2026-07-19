import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/authContext";

interface Props {
  children: React.ReactNode;
}

export function AuthGuard({ children }: Props) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
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

  return <>{children}</>;
}
