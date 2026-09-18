import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Sends a signed-in user to their role's home. Falls back to /worker while
// the profile is loading or if Supabase isn't connected yet (mock/demo mode).
export default function RoleRedirect() {
  const { session, profile, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;

  if (profile?.role === "owner") return <Navigate to="/owner" replace />;
  if (profile?.role === "team_leader") return <Navigate to="/lead" replace />;
  return <Navigate to="/worker" replace />;
}
