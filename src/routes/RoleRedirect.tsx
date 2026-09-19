import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Sends a signed-in user to their role's home. An unauthenticated visitor
// sees the splash screen first — /login stays directly reachable (e.g. the
// "Log in" link on /register) without going through it again.
export default function RoleRedirect() {
  const { session, profile, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Navigate to="/splash" replace />;

  if (profile?.role === "owner") return <Navigate to="/owner" replace />;
  if (profile?.role === "team_leader") return <Navigate to="/lead" replace />;
  return <Navigate to="/worker" replace />;
}
