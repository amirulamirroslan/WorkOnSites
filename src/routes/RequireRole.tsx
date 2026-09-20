import { Navigate, Outlet } from "react-router-dom";
import { useAuth, type Role } from "../context/AuthContext";
import { LoadingScreen } from "../components/Loading";

// Wraps a group of routes so they actually require being signed in (and,
// optionally, a specific role) — without this, /worker, /lead, and /owner
// were reachable by anyone regardless of auth state, and signing out never
// visibly did anything since nothing was watching `session` to redirect
// away from whatever protected page you were already on.
export default function RequireRole({ allow }: { allow?: Role[] }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/splash" replace />;
  // Signed in with an admin-issued temporary password: must choose their own first.
  if (session.user.user_metadata?.must_change_password) return <Navigate to="/set-password" replace />;
  if (allow && profile && !allow.includes(profile.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
