import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
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
    <div className="surface-dark min-h-screen flex flex-col px-6 pt-10 pb-8">
      <h1 className="display text-lg font-semibold mb-6">Report Issue</h1>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-card px-3 py-4 text-xs text-center ${
              category === c.id ? "bg-brand text-white" : "bg-navy-800 text-white/60"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Description</p>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        placeholder="Describe the issue…"
        className="rounded-card bg-navy-800 p-4 text-sm text-white placeholder-white/30 mb-4 resize-none"
      />

      {error && <p className="text-danger-500 text-xs mb-4">{error}</p>}

      <button
        className="action-band disabled:opacity-40"
        disabled={!category || !description || submitting}
        onClick={handleSubmit}
      >
        {submitting ? "Submitting…" : "Submit Report"}
      </button>
    </div>
  );
}
