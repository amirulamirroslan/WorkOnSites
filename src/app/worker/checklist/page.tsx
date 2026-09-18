"use client";

import { useEffect, useState } from "react";
import { Camera, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CameraCapture } from "@/components/camera-capture";
import { useI18n } from "@/components/i18n-provider";

type Item = {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "done";
  after_photo_url: string | null;
};

export default function ChecklistPage() {
  const supabase = createClient();
  const { t } = useI18n();
  const [siteId, setSiteId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capturingFor, setCapturingFor] = useState<string | null>(null);

  async function load() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    const { data: assignment } = await supabase
      .from("site_assignments")
      .select("site_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!assignment) {
      setLoading(false);
      return;
    }
    setSiteId(assignment.site_id);

    const { data: checklistId, error: genError } = await supabase.rpc(
      "generate_todays_checklist",
      { target_site_id: assignment.site_id }
    );

    if (genError) {
      setError(genError.message);
      setLoading(false);
      return;
    }

    const { data: checklistItems } = await supabase
      .from("checklist_items")
      .select("id, label, status, after_photo_url")
      .eq("checklist_id", checklistId)
      .order("sort_order");

    setItems(checklistItems ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markDone(itemId: string, photoBlob?: Blob) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    let after_photo_url: string | undefined;
    if (photoBlob) {
      const fileName = `checklist/${itemId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("shift-photos")
        .upload(fileName, photoBlob, { contentType: "image/jpeg" });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("shift-photos").getPublicUrl(fileName);
      after_photo_url = publicUrl;
    }

    await supabase
      .from("checklist_items")
      .update({
        status: "done",
        completed_by: user!.id,
        completed_at: new Date().toISOString(),
        ...(after_photo_url ? { after_photo_url } : {}),
      })
      .eq("id", itemId);

    setCapturingFor(null);
    load();
  }

  if (loading) return null;

  const doneCount = items.filter((i) => i.status === "done").length;
  const progressPct = items.length > 0 ? (doneCount / items.length) * 100 : 0;

  return (
    <div className="px-6 py-8">
      <p className="text-sm text-paper/50">{t("todaysChecklist")}</p>
      <h1 className="mt-1 font-display text-2xl font-semibold">
        {doneCount} of {items.length} {t("ofDone")}
      </h1>

      {items.length > 0 && (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper/10">
          <div
            className="h-full rounded-full bg-pine transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {error && <p className="mt-4 text-sm text-rust">{error}</p>}

      {!siteId ? (
        <p className="mt-6 rounded-2xl border border-paper/10 bg-paper/5 px-4 py-4 text-sm text-paper/60">
          {t("notAssigned")}
        </p>
      ) : items.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-paper/10 bg-paper/5 px-4 py-4 text-sm text-paper/60">
          {t("noChecklistTemplate")}
        </p>
      ) : (
        <div className="mt-6 space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${
                item.status === "done" ? "border-pine/20 bg-pine/5" : "border-paper/10 bg-paper/5"
              }`}
            >
              <span
                className={`flex-1 text-sm ${
                  item.status === "done" ? "text-paper/40 line-through" : "text-paper"
                }`}
              >
                {item.label}
              </span>
              {item.status === "done" ? (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pine/15 text-pine">
                  <Check size={15} strokeWidth={2} />
                </span>
              ) : (
                <button
                  onClick={() => setCapturingFor(item.id)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-paper/20 px-3.5 py-1.5 text-xs text-paper/80"
                >
                  <Camera size={13} />
                  {t("markDone")}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {capturingFor && (
        <CameraCapture
          onCapture={(blob) => markDone(capturingFor, blob)}
          onCancel={() => setCapturingFor(null)}
        />
      )}
    </div>
  );
}
