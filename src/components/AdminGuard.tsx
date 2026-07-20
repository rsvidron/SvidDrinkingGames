import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/authContext";

interface Props {
  children: React.ReactNode;
}

export function AdminGuard({ children }: Props) {
  const { session, profile, loading } = useAuth();

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
    return <Navigate to="/login" replace />;
  }

  if (!profile?.is_admin) {
    return (
      <div className="screen">
        <div className="screen-header">
          <h1>Not authorized</h1>
          <p>You need to be an admin to view this page.</p>
        </div>
        <Navigate to="/" replace />
      </div>
    );
  }

  return <>{children}</>;
}
