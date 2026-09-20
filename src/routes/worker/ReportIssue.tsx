import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import MobileScreen, { ScreenTitle } from "../../components/MobileScreen";
import { Spinner } from "../../components/Loading";
import { getMyAssignedSite, type AssignedSite } from "../../lib/attendance";

const categories = [
  { id: "access_problem", label: "Access Problem" },
  { id: "equipment_damage", label: "Equipment Damage" },
  { id: "chemical_unavailable", label: "Chemical Unavailable" },
  { id: "safety_issue", label: "Safety Issue" },
  { id: "other", label: "Other" },
];

export default function ReportIssue() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [site, setSite] = useState<AssignedSite | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const leaveTimer = useRef<number>();

  useEffect(() => {
    if (profile) getMyAssignedSite(profile.id).then(setSite);
  }, [profile]);

  // Don't bounce the user back if they navigate away during the success beat.
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  async function handleSubmit() {
    if (submitting || sent || !profile || !category || !description) return;
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
    // Show the confirmation for a beat, then go back.
    setSent(true);
    leaveTimer.current = window.setTimeout(() => navigate(-1), 1100);
  }

  return (
    <MobileScreen header={<ScreenTitle title="Report Issue" />}>
      <p className="font-display font-semibold mb-3">What's the problem?</p>
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`press rounded-2xl px-3 py-4 text-sm font-medium text-center border transition-colors ${
              category === c.id
                ? "bg-brand text-white border-brand shadow-glow"
                : "bg-white text-ink-900/70 border-cloud-100 shadow-soft"
            }`}
          >
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
        className="w-full rounded-2xl bg-white border border-cloud-100 p-4 text-sm text-ink-900 placeholder-ink-900/30 mb-4 resize-none outline-none focus:border-brand shadow-soft"
      />

      {error && <p className="text-danger-500 text-xs mb-4">{error}</p>}

      <button
        className={`action-band transition-all duration-300 disabled:opacity-40 disabled:shadow-none ${
          sent ? "!bg-success-500 !shadow-[0_10px_30px_rgba(34,197,94,0.4)]" : ""
        }`}
        disabled={!category || !description}
        aria-busy={submitting}
        onClick={handleSubmit}
      >
        {sent ? (
          <span className="inline-flex items-center justify-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                className="check-draw"
                style={{ animationDelay: "0ms" }}
                d="M5 12.5l4.5 4.5L19 7.5"
                pathLength={1}
                stroke="white"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Report sent
          </span>
        ) : submitting ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Spinner size={18} />
            Submitting…
          </span>
        ) : (
          "Submit Report"
        )}
      </button>
    </MobileScreen>
  );
}
