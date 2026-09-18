import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

type Member = {
  id: string;
  full_name: string;
  role: "owner" | "team_leader" | "worker";
  username: string | null;
  created_at: string;
};

const roleLabel: Record<string, string> = {
  owner: "Owner",
  team_leader: "Team Leader",
  worker: "Worker",
};

export default function WorkersPage() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ username: string; tempPassword: string } | null>(null);

  async function loadMembers() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, username, created_at")
      .order("created_at", { ascending: false });
    setMembers((data as Member[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl font-semibold">Workers</h1>
        {profile?.role === "owner" && (
          <button
            onClick={() => setShowAdd(true)}
            className="text-xs font-medium bg-brand text-white px-3 py-2 rounded-lg"
          >
            + Add team member
          </button>
        )}
      </div>

      <div className="bg-white rounded-card border border-black/5">
        {loading && <p className="text-sm text-ink-900/50 px-4 py-4">Loading…</p>}
        {!loading && members.length === 0 && (
          <p className="text-sm text-ink-900/50 px-4 py-4">No team members yet.</p>
        )}
        {members.map((m) => (
          <div key={m.id} className="list-row px-4">
            <div>
              <p className="font-medium text-sm">{m.full_name}</p>
              <p className="text-xs text-ink-900/50">
                {roleLabel[m.role]}
                {m.username ? ` · @${m.username}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <AddMemberModal
          onClose={() => setShowAdd(false)}
          onCreated={(creds) => {
            setCreatedCreds(creds);
            setShowAdd(false);
            loadMembers();
          }}
        />
      )}

      {createdCreds && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50">
          <div className="bg-white rounded-card p-6 max-w-xs w-full">
            <h2 className="font-display font-semibold mb-2">Account created</h2>
            <p className="text-xs text-ink-900/60 mb-4">
              Share these sign-in details directly — they aren't emailed or shown again.
            </p>
            <div className="bg-cloud-50 rounded-lg p-3 text-sm mb-4">
              <p>Username: <span className="font-mono">{createdCreds.username}</span></p>
              <p>Password: <span className="font-mono">{createdCreds.tempPassword}</span></p>
            </div>
            <button
              onClick={() => setCreatedCreds(null)}
              className="action-band w-full"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddMemberModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (creds: { username: string; tempPassword: string }) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"worker" | "team_leader">("worker");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: fnError } = await supabase.functions.invoke("create-team-member", {
      body: { fullName, username, role },
    });

    setSubmitting(false);
    if (fnError || data?.error) {
      setError(data?.error ?? fnError?.message ?? "Could not create account");
      return;
    }
    onCreated({ username: data.username, tempPassword: data.tempPassword });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50">
      <div className="bg-white rounded-card p-6 max-w-xs w-full">
        <h2 className="font-display font-semibold mb-4">Add team member</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
          <input
            placeholder="Username (for login)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            pattern="[a-z0-9._-]{3,32}"
            title="3-32 chars: lowercase letters, numbers, . _ -"
            className="rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "worker" | "team_leader")}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm"
          >
            <option value="worker">Worker</option>
            <option value="team_leader">Team Leader</option>
          </select>
          {error && <p className="text-danger-500 text-xs">{error}</p>}
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-black/10 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 action-band disabled:opacity-40 text-sm">
              {submitting ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
