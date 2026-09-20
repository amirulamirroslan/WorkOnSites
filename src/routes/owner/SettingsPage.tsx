import { useAuth } from "../../context/AuthContext";

export default function SettingsPage() {
  const { profile, signOut } = useAuth();

  return (
    <div>
      <h1 className="font-display text-xl font-semibold mb-6">Settings</h1>

      <div className="bg-white rounded-card border border-cloud-100 shadow-soft p-5 mb-6 max-w-md">
        <p className="text-sm font-medium mb-1">Organization</p>
        <p className="text-xs text-ink-900/50 mb-4">Working hours, geofence defaults, task templates</p>
        <p className="text-sm font-medium mb-1">Account</p>
        <p className="text-xs text-ink-900/50">{profile?.full_name ?? "Signed in"}</p>
      </div>

      <button onClick={signOut} className="text-sm text-danger-500 underline">
        Sign out
      </button>
    </div>
  );
}
