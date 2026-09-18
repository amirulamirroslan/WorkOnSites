import { worker } from "../../lib/mockData";

export default function WorkerProfile() {
  return (
    <div className="surface-dark min-h-screen pb-24 px-6 pt-10">
      <h1 className="display text-lg font-semibold mb-6">Profile</h1>
      <div className="rounded-card bg-navy-800 p-5">
        <p className="font-medium">{worker.name}</p>
        <p className="text-white/50 text-sm">Worker</p>
      </div>
      {/* Attendance report, settings, etc. land once Supabase auth is wired. */}
    </div>
  );
}
