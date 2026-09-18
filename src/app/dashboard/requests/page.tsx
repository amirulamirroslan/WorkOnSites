"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Leave = {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  profiles: { full_name: string } | null;
};
type Incident = {
  id: string;
  description: string;
  severity: string;
  status: string;
  created_at: string;
  profiles: { full_name: string } | null;
  sites: { name: string } | null;
};
type Supply = {
  id: string;
  item: string;
  quantity: number;
  status: string;
  profiles: { full_name: string } | null;
  sites: { name: string } | null;
};

const TABS = ["leave", "incidents", "supplies"] as const;

export default function RequestsPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<(typeof TABS)[number]>("leave");
  const [leave, setLeave] = useState<Leave[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    const [leaveRes, incidentRes, supplyRes] = await Promise.all([
      supabase
        .from("leave_requests")
        .select("id, start_date, end_date, reason, status, profiles(full_name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("incidents")
        .select("id, description, severity, status, created_at, profiles(full_name), sites(name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("supply_requests")
        .select("id, item, quantity, status, profiles(full_name), sites(name)")
        .order("created_at", { ascending: false }),
    ]);
    setLeave((leaveRes.data as unknown as Leave[]) ?? []);
    setIncidents((incidentRes.data as unknown as Incident[]) ?? []);
    setSupplies((supplyRes.data as unknown as Supply[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function decideLeave(id: string, status: "approved" | "denied") {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    await supabase
      .from("leave_requests")
      .update({ status, decided_by: session!.user.id, decided_at: new Date().toISOString() })
      .eq("id", id);
    loadAll();
  }

  async function resolveIncident(id: string) {
    await supabase.from("incidents").update({ status: "resolved" }).eq("id", id);
    loadAll();
  }

  async function fulfillSupply(id: string) {
    await supabase.from("supply_requests").update({ status: "fulfilled" }).eq("id", id);
    loadAll();
  }

  const pendingCounts = {
    leave: leave.filter((l) => l.status === "pending").length,
    incidents: incidents.filter((i) => i.status === "open").length,
    supplies: supplies.filter((s) => s.status === "pending").length,
  };

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">Requests</h1>
      <p className="mt-1 text-sm text-muted">Leave, incidents, and supplies from your crew.</p>

      <div className="mt-6 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm capitalize ${
              tab === t ? "border-b-2 border-ink text-ink" : "text-muted"
            }`}
          >
            {t} {pendingCounts[t] > 0 && `(${pendingCounts[t]})`}
          </button>
        ))}
      </div>

      {loading ? null : (
        <div className="mt-6">
          {tab === "leave" &&
            (leave.length === 0 ? (
              <Empty />
            ) : (
              <div className="divide-y divide-line rounded-2xl border border-line bg-paper shadow-sm">
                {leave.map((l) => (
                  <div key={l.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-ink">{l.profiles?.full_name}</p>
                      <p className="text-xs text-muted">
                        {l.start_date} → {l.end_date}
                        {l.reason ? ` · ${l.reason}` : ""}
                      </p>
                    </div>
                    {l.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => decideLeave(l.id, "denied")}>
                          Deny
                        </Button>
                        <Button onClick={() => decideLeave(l.id, "approved")}>Approve</Button>
                      </div>
                    ) : (
                      <StatusPill status={l.status} />
                    )}
                  </div>
                ))}
              </div>
            ))}

          {tab === "incidents" &&
            (incidents.length === 0 ? (
              <Empty />
            ) : (
              <div className="divide-y divide-line rounded-2xl border border-line bg-paper shadow-sm">
                {incidents.map((i) => (
                  <div key={i.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-ink">
                        {i.profiles?.full_name} · {i.sites?.name}
                      </p>
                      <p className="text-xs text-muted">
                        <span className="capitalize">{i.severity}</span> · {i.description}
                      </p>
                    </div>
                    {i.status === "open" ? (
                      <Button variant="secondary" onClick={() => resolveIncident(i.id)}>
                        Resolve
                      </Button>
                    ) : (
                      <StatusPill status={i.status} />
                    )}
                  </div>
                ))}
              </div>
            ))}

          {tab === "supplies" &&
            (supplies.length === 0 ? (
              <Empty />
            ) : (
              <div className="divide-y divide-line rounded-2xl border border-line bg-paper shadow-sm">
                {supplies.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-ink">
                        {s.quantity}× {s.item}
                      </p>
                      <p className="text-xs text-muted">
                        {s.profiles?.full_name} · {s.sites?.name}
                      </p>
                    </div>
                    {s.status === "pending" ? (
                      <Button variant="secondary" onClick={() => fulfillSupply(s.id)}>
                        Mark fulfilled
                      </Button>
                    ) : (
                      <StatusPill status={s.status} />
                    )}
                  </div>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted">Nothing here yet.</p>;
}

function StatusPill({ status }: { status: string }) {
  const color =
    status === "approved" || status === "resolved" || status === "fulfilled"
      ? "text-pine"
      : status === "denied"
      ? "text-rust"
      : "text-muted";
  return <span className={`text-xs capitalize ${color}`}>{status}</span>;
}
