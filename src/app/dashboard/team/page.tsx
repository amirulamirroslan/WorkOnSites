"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/card";
import { X, MapPin } from "lucide-react";

type Worker = {
  id: string;
  full_name: string;
  username: string | null;
  role: string;
  is_active: boolean;
};
type Site = { id: string; name: string };

export default function TeamPage() {
  const supabase = createClient();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [assigningWorker, setAssigningWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(
    null
  );

  async function loadWorkers() {
    const [workersRes, sitesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, username, role, is_active").order("full_name"),
      supabase.from("sites").select("id, name").order("name"),
    ]);
    setWorkers(workersRes.data ?? []);
    setSites(sitesRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadWorkers();
  }, []);

  async function toggleActive(worker: Worker) {
    await supabase.from("profiles").update({ is_active: !worker.is_active }).eq("id", worker.id);
    loadWorkers();
  }

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Team</h1>
          <p className="mt-1 text-sm text-muted">Janitors and team leaders in your org.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>Add worker</Button>
      </div>

      {credentials && (
        <div className="mt-6 rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm">
          <p className="text-ink">
            Account created for <strong>{credentials.username}</strong>. Share this
            temporary password — they should change it after their first login.
          </p>
          <p className="mt-1.5 font-mono text-ink">{credentials.password}</p>
        </div>
      )}

      {!loading && workers.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          No workers yet. Add your first janitor or team leader to get started.
        </p>
      ) : (
        <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-paper shadow-sm">
          {workers.map((w) => (
            <div key={w.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm text-ink">{w.full_name}</p>
                <p className="text-xs text-muted">
                  {w.username ?? "—"} · {w.role.replace("_", " ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAssigningWorker(w)}
                  className="flex items-center gap-1 text-xs text-ink underline"
                >
                  <MapPin size={12} />
                  Sites
                </button>
                <button
                  onClick={() => toggleActive(w)}
                  className={`text-xs underline ${w.is_active ? "text-pine" : "text-muted"}`}
                >
                  {w.is_active ? "Active" : "Inactive"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AddWorkerModal
          onClose={() => setShowForm(false)}
          onCreated={(creds) => {
            setCredentials(creds);
            setShowForm(false);
            loadWorkers();
          }}
        />
      )}

      {assigningWorker && (
        <AssignSitesModal
          worker={assigningWorker}
          sites={sites}
          onClose={() => setAssigningWorker(null)}
        />
      )}
    </div>
  );
}

function AssignSitesModal({
  worker,
  sites,
  onClose,
}: {
  worker: Worker;
  sites: Site[];
  onClose: () => void;
}) {
  const supabase = createClient();
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("site_assignments")
      .select("site_id")
      .eq("user_id", worker.id)
      .then(({ data }) => {
        setAssignedIds(new Set((data ?? []).map((r) => r.site_id)));
        setLoading(false);
      });
  }, [worker.id]);

  function toggle(siteId: string) {
    setAssignedIds((prev) => {
      const next = new Set(prev);
      if (next.has(siteId)) next.delete(siteId);
      else next.add(siteId);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);

    const { data: current } = await supabase
      .from("site_assignments")
      .select("id, site_id")
      .eq("user_id", worker.id);

    const currentIds = new Set((current ?? []).map((r) => r.site_id));
    const toAdd = [...assignedIds].filter((id) => !currentIds.has(id));
    const toRemoveRows = (current ?? []).filter((r) => !assignedIds.has(r.site_id));

    if (toAdd.length > 0) {
      const { error: insertError } = await supabase
        .from("site_assignments")
        .insert(toAdd.map((site_id) => ({ site_id, user_id: worker.id })));
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    if (toRemoveRows.length > 0) {
      const { error: deleteError } = await supabase
        .from("site_assignments")
        .delete()
        .in("id", toRemoveRows.map((r) => r.id));
      if (deleteError) {
        setError(deleteError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Assign sites</h2>
            <p className="text-xs text-muted">{worker.full_name}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {loading ? null : sites.length === 0 ? (
          <p className="mt-5 text-sm text-muted">Add a site first, from the Sites page.</p>
        ) : (
          <div className="mt-5 space-y-2">
            {sites.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={assignedIds.has(s.id)}
                  onChange={() => toggle(s.id)}
                />
                {s.name}
              </label>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-rust/30 bg-rust/5 px-3 py-2 text-sm text-rust">
            {error}
          </p>
        )}

        <Button onClick={save} disabled={saving || sites.length === 0} className="mt-5 w-full">
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

function AddWorkerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: { username: string; password: string }) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"janitor" | "team_leader">("janitor");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username, role }),
      });

      let body: { error?: string; username?: string; temporaryPassword?: string };
      try {
        body = await res.json();
      } catch {
        throw new Error(`Server returned an unexpected response (status ${res.status}).`);
      }

      if (!res.ok) {
        setError(body.error ?? "Something went wrong.");
        return;
      }

      onCreated({ username: body.username!, password: body.temporaryPassword! });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Add worker</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="Full name">
            <input
              required
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Field>
          <Field label="Username (for login)">
            <input
              required
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              autoCapitalize="none"
            />
          </Field>
          <Field label="Role">
            <select
              className={inputClass}
              value={role}
              onChange={(e) => setRole(e.target.value as "janitor" | "team_leader")}
            >
              <option value="janitor">Janitor</option>
              <option value="team_leader">Team leader</option>
            </select>
          </Field>

          {error && (
            <p className="rounded-xl border border-rust/30 bg-rust/5 px-3 py-2 text-sm text-rust">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Creating…" : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
