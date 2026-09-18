"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/card";

type Status = {
  site_name: string;
  checklist_date: string;
  total_items: number;
  completed_items: number;
  already_signed_off: boolean;
};

export default function VerifyPage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const [status, setStatus] = useState<Status | null | "not_found">(null);
  const [signerName, setSignerName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);

  async function load() {
    const { data } = await supabase.rpc("get_public_site_status", { token: params.token });
    const row = data?.[0] as Status | undefined;
    setStatus(row ?? "not_found");
  }

  useEffect(() => {
    load();
  }, []);

  async function submitSignoff(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { data: ok } = await supabase.rpc("submit_site_signoff", {
      token: params.token,
      signer_name: signerName || null,
      signer_note: note || null,
    });
    setSubmitting(false);
    if (ok) setSigned(true);
  }

  if (status === null) return null;

  if (status === "not_found") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-center">
        <p className="text-sm text-muted">This verification link isn't available.</p>
      </main>
    );
  }

  const allDone = status.total_items > 0 && status.completed_items === status.total_items;
  const progressPct = status.total_items > 0 ? (status.completed_items / status.total_items) * 100 : 0;

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-line bg-paper p-7 shadow-sm">
          <p className="text-sm text-muted">
            {new Date(status.checklist_date + "T00:00:00").toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{status.site_name}</h1>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-canvas/40 px-4 py-4">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                allDone ? "bg-pine/15 text-pine" : "bg-canvas text-muted"
              }`}
            >
              {allDone ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            </span>
            <div className="flex-1">
              <span className="text-sm text-ink">
                {status.completed_items} of {status.total_items} cleaning tasks completed today
              </span>
              {status.total_items > 0 && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
                  <div
                    className="h-full rounded-full bg-pine transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {status.already_signed_off || signed ? (
            <p className="mt-5 rounded-xl border border-pine/30 bg-pine/5 px-4 py-3 text-sm text-pine">
              Signed off for today — thank you.
            </p>
          ) : (
            <form onSubmit={submitSignoff} className="mt-5 space-y-3">
              <p className="text-sm text-muted">Sign off on today's cleaning (optional).</p>
              <input
                className={inputClass}
                placeholder="Your name (optional)"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Submitting…" : "Sign off"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
