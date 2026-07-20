import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/authContext";
import { AccessProvider } from "./lib/useAccess";
import { AuthGuard } from "./components/AuthGuard";
import { Home } from "./pages/Home";
import { Login } from "./pages/auth/Login";
import { Signup } from "./pages/auth/Signup";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { AuthCallback } from "./pages/auth/AuthCallback";
import { Terms } from "./pages/legal/Terms";
import { Privacy } from "./pages/legal/Privacy";
import { CheckoutSuccess } from "./pages/CheckoutSuccess";
import { CheckoutCancel } from "./pages/CheckoutCancel";
import { AdminGuard } from "./components/AdminGuard";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminUsers } from "./pages/admin/Users";
import { AdminLicenseKeys } from "./pages/admin/LicenseKeys";
import { AdminFreeWeekend } from "./pages/admin/FreeWeekend";
import { UpDownRiverPage } from "./games/upDownRiver/UpDownRiverPage";
import { KingsCupPage } from "./games/kingsCup/KingsCupPage";
import { FuckTheDealerPage } from "./games/fuckTheDealer/FuckTheDealerPage";
import { FuckTheDealerViewer } from "./games/fuckTheDealer/FuckTheDealerViewer";

function App() {
  return (
    <AuthProvider>
      <AccessProvider>
        <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          {/* Viewer stays public — anyone with the room code can watch */}
          <Route path="/view/:code" element={<FuckTheDealerViewer />} />

          {/* Stripe checkout return pages */}
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />

          {/* Home is public — it decides between splash / paywall / picker
              based on auth + access state internally. */}
          <Route path="/" element={<Home />} />
          <Route
            path="/games/up-down-river/setup"
            element={
              <AuthGuard>
                <UpDownRiverPage />
              </AuthGuard>
            }
          />
          <Route
            path="/games/kings-cup/setup"
            element={
              <AuthGuard>
                <KingsCupPage />
              </AuthGuard>
            }
          />
          <Route
            path="/games/fuck-the-dealer/setup"
            element={
              <AuthGuard>
                <FuckTheDealerPage />
              </AuthGuard>
            }
          />

          {/* Admin portal — nested routes share the sidebar layout */}
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            <Route index element={<AdminUsers />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="keys" element={<AdminLicenseKeys />} />
            <Route path="free-weekend" element={<AdminFreeWeekend />} />
          </Route>
          </Routes>
        </BrowserRouter>
      </AccessProvider>
    </AuthProvider>
  );
}

export default App;
