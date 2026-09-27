import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DoorClosed, Wrench, FlaskConical, ShieldAlert, MoreHorizontal, type LucideIcon } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import MobileScreen, { ScreenTitle } from "../../components/MobileScreen";
import { ReportIssueArt } from "../../components/Illustrations";
import { getMyAssignedSite, type AssignedSite } from "../../lib/attendance";

const categories: { id: string; label: string; Icon: LucideIcon; tint: string }[] = [
  { id: "access_problem", label: "Access Problem", Icon: DoorClosed, tint: "bg-brand" },
  { id: "equipment_damage", label: "Equipment Damage", Icon: Wrench, tint: "bg-aurora-cyan" },
  { id: "chemical_unavailable", label: "Chemical Unavailable", Icon: FlaskConical, tint: "bg-aurora-pink" },
  { id: "safety_issue", label: "Safety Issue", Icon: ShieldAlert, tint: "bg-danger-500" },
  { id: "other", label: "Other", Icon: MoreHorizontal, tint: "bg-aurora-amber" },
];

export default function ReportIssue() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [site, setSite] = useState<AssignedSite | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) getMyAssignedSite(profile.id).then(setSite);
  }, [profile]);

  async function handleSubmit() {
    if (!profile || !category || !description) return;
    setSubmitting(true);
    setError(null);

    if (!site) {
      setSubmitting(false);
      setError("You need to be assigned to a site before reporting an issue.");
      return;
    }

    const { error: insertErr } = await supabase.from("issues").insert({
      organization_id: profile.organization_id,
      site_id: site.id,
      reported_by: profile.id,
      category,
      description,
    });

    setSubmitting(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    navigate(-1);
  }

  return (
    <MobileScreen
      header={
        <div className="flex items-center justify-between">
          <ScreenTitle title="Report Issue" />
          <ReportIssueArt className="w-24 h-auto -mt-2 -mr-1 shrink-0" />
        </div>
      }
    >
      <p className="font-display font-semibold mb-3">What's the problem?</p>
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`flex items-center gap-2.5 rounded-2xl px-3 py-3.5 text-sm font-medium text-left border transition-colors ${
              category === c.id
                ? "bg-brand text-white border-brand shadow-glow"
                : "glass text-ink-900/70"
            }`}
          >
            <span className={`icon-badge ${category === c.id ? "bg-white/20" : c.tint}`}>
              <c.Icon size={18} strokeWidth={2.2} />
            </span>
            {c.label}
          </button>
        ))}
      </div>

      <p className="font-display font-semibold mb-2">Description</p>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        placeholder="Describe the issue…"
        className="w-full rounded-2xl glass p-4 text-sm text-ink-900 placeholder-ink-900/30 mb-4 resize-none outline-none focus:border-brand"
      />

      {error && <p className="text-danger-500 text-xs mb-4">{error}</p>}

      <button
        className="action-band disabled:opacity-40 disabled:shadow-none"
        disabled={!category || !description || submitting}
        onClick={handleSubmit}
      >
        {submitting ? "Submitting…" : "Submit Report"}
      </button>
    </MobileScreen>
  );
}
