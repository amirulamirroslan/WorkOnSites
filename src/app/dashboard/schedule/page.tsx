"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/card";
import { AlertTriangle, X } from "lucide-react";

type ScheduleRow = {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  profiles: { full_name: string } | null;
  sites: { name: string } | null;
};
type NoShow = {
  schedule_id: string;
  scheduled_date: string;
  start_time: string;
};

export default function SchedulePage() {
  const supabase = createClient();
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [noShows, setNoShows] = useState<NoShow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const today = new Date().toISOString().slice(0, 10);
    const [scheduleRes, noShowRes] = await Promise.all([
      supabase
        .from("shift_schedules")
        .select("id, scheduled_date, start_time, end_time, profiles(full_name), sites(name)")
        .gte("scheduled_date", today)
        .order("scheduled_date")
        .limit(100),
      supabase.from("no_show_alerts").select("schedule_id, scheduled_date, start_time"),
    ]);
    setRows((scheduleRes.data as unknown as ScheduleRow[]) ?? []);
    setNoShows((noShowRes.data as unknown as NoShow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const noShowIds = new Set(noShows.map((n) => n.schedule_id));

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Schedule</h1>
          <p className="mt-1 text-sm text-muted">Upcoming shifts, from today.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>Add shifts</Button>
      </div>

      {noShows.length > 0 && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-rust/30 bg-rust/5 px-4 py-3 text-sm text-rust">
          <AlertTriangle size={16} />
          {noShows.length} scheduled shift{noShows.length > 1 ? "s" : ""} with no clock-in yet
        </div>
      )}

      {!loading && rows.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No shifts scheduled yet.</p>
      ) : (
        <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-paper shadow-sm">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm text-ink">{r.profiles?.full_name}</p>
                <p className="text-xs text-muted">
                  {r.sites?.name} · {r.scheduled_date} · {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}
                </p>
              </div>
              {noShowIds.has(r.id) && (
                <span className="flex items-center gap-1 text-xs text-rust">
                  <AlertTriangle size={13} />
                  No-show
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AddShiftsModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function AddShiftsModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const supabase = createClient();
  const [workers, setWorkers] = useState<{ id: string; full_name: string }[]>([]);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [userId, setUserId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("id, full_name").eq("role", "janitor").then(({ data }) => setWorkers(data ?? []));
    supabase.from("sites").select("id, name").then(({ data }) => setSites(data ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session!.user;
    const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();

    const dates: string[] = [];
    const cursor = new Date(startDate + "T00:00:00");
    const last = new Date(endDate + "T00:00:00");
    while (cursor <= last) {
      const dayCode = DAY_CODES[cursor.getDay()];
      const isWeekend = dayCode === "SU" || dayCode === "SA";
      if (!weekdaysOnly || !isWeekend) {
        dates.push(cursor.toISOString().slice(0, 10));
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const rows = dates.map((d) => ({
      organization_id: profile!.organization_id,
      site_id: siteId,
      user_id: userId,
      scheduled_date: d,
      start_time: startTime,
      end_time: endTime,
    }));

    const { error: insertError } = await supabase.from("shift_schedules").upsert(rows, {
      onConflict: "user_id,scheduled_date",
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Add shifts</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="Worker">
            <select required className={inputClass} value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Choose a worker</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Site">
            <select required className={inputClass} value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              <option value="">Choose a site</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex gap-3">
            <Field label="From">
              <input required type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="To">
              <input required type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>
          <div className="flex gap-3">
            <Field label="Start time">
              <input required type="time" className={inputClass} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </Field>
            <Field label="End time">
              <input required type="time" className={inputClass} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={weekdaysOnly} onChange={(e) => setWeekdaysOnly(e.target.checked)} />
            Weekdays only
          </label>

          {error && (
            <p className="rounded-xl border border-rust/30 bg-rust/5 px-3 py-2 text-sm text-rust">{error}</p>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Saving…" : "Save shifts"}
          </Button>
        </form>
      </div>
    </div>
  );
}
