"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Megaphone, ChevronRight, Globe, CalendarOff, AlertTriangle, PackagePlus, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { LANGUAGE_LABELS, type Language } from "@/lib/i18n";

type Panel = "leave" | "incident" | "supply" | null;

export default function MorePage() {
  const [panel, setPanel] = useState<Panel>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="px-6 py-8">
      <h1 className="font-display text-2xl font-semibold">{t("more")}</h1>

      {confirmation && (
        <p className="mt-4 rounded-2xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-paper">
          {confirmation}
        </p>
      )}

      <div className="mt-6 divide-y divide-paper/10 overflow-hidden rounded-2xl border border-paper/10 bg-paper/5">
        <Link href="/worker/announcements" className="flex items-center gap-3 px-4 py-3.5">
          <IconChip icon={Megaphone} />
          <span className="flex-1 text-sm">{t("announcements")}</span>
          <ChevronRight size={16} className="text-paper/30" />
        </Link>
        <RowButton icon={CalendarOff} label={t("requestLeave")} onClick={() => setPanel("leave")} />
        <RowButton icon={AlertTriangle} label={t("reportIncident")} onClick={() => setPanel("incident")} />
        <RowButton icon={PackagePlus} label={t("requestSupplies")} onClick={() => setPanel("supply")} />
      </div>

      <div className="mt-4 rounded-2xl border border-paper/10 bg-paper/5 px-4 py-4">
        <span className="flex items-center gap-3 text-sm text-paper/80">
          <IconChip icon={Globe} />
          {t("language")}
        </span>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(LANGUAGE_LABELS) as Language[]).map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                lang === code ? "border-amber bg-amber/15 text-amber" : "border-paper/15 text-paper/60"
              }`}
            >
              {LANGUAGE_LABELS[code]}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-paper/10 bg-paper/5 px-4 py-3.5 text-sm text-paper/70"
      >
        <IconChip icon={LogOut} accent="rust" />
        {t("signOut")}
      </button>

      {panel === "leave" && (
        <LeaveForm
          onDone={() => {
            setPanel(null);
            setConfirmation(t("leaveSubmitted"));
          }}
          onCancel={() => setPanel(null)}
        />
      )}
      {panel === "incident" && (
        <IncidentForm
          onDone={() => {
            setPanel(null);
            setConfirmation(t("incidentSubmitted"));
          }}
          onCancel={() => setPanel(null)}
        />
      )}
      {panel === "supply" && (
        <SupplyForm
          onDone={() => {
            setPanel(null);
            setConfirmation(t("supplySubmitted"));
          }}
          onCancel={() => setPanel(null)}
        />
      )}
    </div>
  );
}

function IconChip({
  icon: Icon,
  accent = "amber",
}: {
  icon: React.ElementType;
  accent?: "amber" | "rust";
}) {
  const chipClass = accent === "rust" ? "bg-rust/15 text-rust" : "bg-amber/15 text-amber";
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${chipClass}`}>
      <Icon size={15} strokeWidth={1.75} />
    </span>
  );
}

function RowButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
      <IconChip icon={icon} />
      <span className="flex-1 text-sm">{label}</span>
      <ChevronRight size={16} className="text-paper/30" />
    </button>
  );
}

function Sheet({ title, children, onCancel }: { title: string; children: React.ReactNode; onCancel: () => void }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-20 flex items-end bg-ink/70 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="w-full rounded-t-3xl border border-paper/10 bg-ink p-6 pb-8 sm:max-w-sm sm:rounded-3xl sm:pb-6">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-paper/15 sm:hidden" />
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onCancel} className="text-sm text-paper/60">
            {t("cancel")}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const fieldClass =
  "w-full rounded-xl border border-paper/15 bg-paper/5 px-3.5 py-2.5 text-paper placeholder:text-paper/40 focus:border-amber focus:outline-none";

async function getUserContext(supabase: ReturnType<typeof createClient>) {
  // getSession() reads the token locally (no network round-trip) unlike
  // getUser(), which always revalidates against the Auth server — safe
  // here since RLS on the actual queries is the real enforcement layer.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session!.user.id;

  const [assignmentRes, profileRes] = await Promise.all([
    supabase.from("site_assignments").select("site_id").eq("user_id", userId).limit(1).maybeSingle(),
    supabase.from("profiles").select("organization_id").eq("id", userId).single(),
  ]);

  return {
    userId,
    siteId: assignmentRes.data?.site_id as string | undefined,
    organizationId: profileRes.data?.organization_id as string | undefined,
  };
}

function LeaveForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const supabase = createClient();
  const { t } = useI18n();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { userId, organizationId } = await getUserContext(supabase);

    const { error: insertError } = await supabase.from("leave_requests").insert({
      organization_id: organizationId,
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      reason,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }
    onDone();
  }

  return (
    <Sheet title={t("requestLeave")} onCancel={onCancel}>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="flex gap-3">
          <input required type="date" className={fieldClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input required type="date" className={fieldClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <textarea
          className={fieldClass}
          placeholder={t("reasonOptional")}
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {error && <p className="text-sm text-rust">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full !rounded-xl !bg-amber !border-amber !text-ink">
          {submitting ? t("submitting") : t("submitRequest")}
        </Button>
      </form>
    </Sheet>
  );
}

function IncidentForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const supabase = createClient();
  const { t } = useI18n();
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("low");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { userId, siteId, organizationId } = await getUserContext(supabase);
    if (!siteId) {
      setError(t("notAssignedShort"));
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("incidents").insert({
      organization_id: organizationId,
      site_id: siteId,
      reported_by: userId,
      severity,
      description,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }
    onDone();
  }

  return (
    <Sheet title={t("reportIncident")} onCancel={onCancel}>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <select className={fieldClass} value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="low" className="text-ink">{t("severityLow")}</option>
          <option value="medium" className="text-ink">{t("severityMedium")}</option>
          <option value="high" className="text-ink">{t("severityHigh")}</option>
        </select>
        <textarea
          required
          className={fieldClass}
          placeholder={t("whatHappened")}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error && <p className="text-sm text-rust">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full !rounded-xl !bg-amber !border-amber !text-ink">
          {submitting ? t("submitting") : t("submitReport")}
        </Button>
      </form>
    </Sheet>
  );
}

function SupplyForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const supabase = createClient();
  const { t } = useI18n();
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { userId, siteId, organizationId } = await getUserContext(supabase);
    if (!siteId) {
      setError(t("notAssignedShort"));
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("supply_requests").insert({
      organization_id: organizationId,
      site_id: siteId,
      requested_by: userId,
      item,
      quantity,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }
    onDone();
  }

  return (
    <Sheet title={t("requestSupplies")} onCancel={onCancel}>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <input required className={fieldClass} placeholder={t("item")} value={item} onChange={(e) => setItem(e.target.value)} />
        <input
          required
          type="number"
          min={1}
          className={fieldClass}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        {error && <p className="text-sm text-rust">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full !rounded-xl !bg-amber !border-amber !text-ink">
          {submitting ? t("submitting") : t("submitRequest")}
        </Button>
      </form>
    </Sheet>
  );
}
