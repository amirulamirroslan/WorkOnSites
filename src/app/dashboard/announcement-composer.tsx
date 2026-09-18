"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function AnnouncementComposer() {
  const supabase = createClient();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [isOwner, setIsOwner] = useState(true);
  const [assignedSites, setAssignedSites] = useState<{ id: string; name: string }[]>([]);
  const [siteId, setSiteId] = useState("");

  useEffect(() => {
    async function loadRoleContext() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      const owner = profile?.role === "owner";
      setIsOwner(owner);

      // A team leader can only post to a site they're assigned to —
      // org-wide announcements are owner-only.
      if (!owner) {
        const { data: assignments } = await supabase
          .from("site_assignments")
          .select("sites(id, name)")
          .eq("user_id", user.id);
        const sites = (assignments ?? [])
          .map((a) => a.sites as unknown as { id: string; name: string })
          .filter(Boolean);
        setAssignedSites(sites);
        if (sites.length === 1) setSiteId(sites[0].id);
      }
    }
    loadRoleContext();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner && !siteId) return;
    setSubmitting(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session!.user;
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    await supabase.from("announcements").insert({
      organization_id: profile!.organization_id,
      posted_by: user.id,
      message,
      site_id: isOwner ? null : siteId,
    });

    // Best-effort — the route itself returns 501 until VAPID keys are
    // configured, which is fine to ignore here.
    fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New announcement", body: message }),
    }).catch(() => {});

    setMessage("");
    setSubmitting(false);
    setPosted(true);
    setTimeout(() => setPosted(false), 3000);
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      {!isOwner && assignedSites.length > 1 && (
        <select
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink"
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
        >
          <option value="">Choose a site</option>
          {assignedSites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}
      <input
        required
        className="min-w-[200px] flex-1 rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        placeholder={
          isOwner ? "Post an announcement to your whole team…" : "Post an announcement to your site…"
        }
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button
        type="submit"
        disabled={submitting || (!isOwner && !siteId)}
        variant="secondary"
      >
        {posted ? "Posted" : "Post"}
      </Button>
    </form>
  );
}
