import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/authContext";
import "./admin.css";

const NAV: { label: string; to: string; icon: string }[] = [
  { label: "Users", to: "/admin/users", icon: "👥" },
  { label: "License Keys", to: "/admin/keys", icon: "🔑" },
  { label: "Free Weekend", to: "/admin/free-weekend", icon: "🎉" },
];

export function AdminLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          🛡️ <strong>Admin</strong>
        </div>
        <nav className="admin-nav">
          {NAV.map((item) => {
            const active =
              location.pathname === item.to ||
              (item.to === "/admin/users" && location.pathname === "/admin");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`admin-nav__item ${active ? "admin-nav__item--active" : ""}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar__footer">
          <div className="text-dim" style={{ fontSize: "0.75rem", marginBottom: 6 }}>
            SIGNED IN
          </div>
          <div style={{ fontSize: "0.85rem", wordBreak: "break-all", marginBottom: 12 }}>
            {profile?.email}
          </div>
          <Link to="/" className="btn btn-block" style={{ marginBottom: 8 }}>
            ← Back to app
          </Link>
          <button
            className="btn btn-block"
            style={{ borderColor: "var(--wrong)", color: "var(--wrong)" }}
            onClick={signOut}
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
