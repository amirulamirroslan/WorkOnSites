"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n-provider";

type Announcement = {
  id: string;
  message: string;
  created_at: string;
  sites: { name: string } | null;
};

export default function AnnouncementsPage() {
  const supabase = createClient();
  const { t } = useI18n();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("announcements")
      .select("id, message, created_at, sites(name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as unknown as Announcement[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="px-6 py-8">
      <h1 className="font-display text-2xl font-semibold">{t("announcements")}</h1>

      {!loading && items.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-paper/10 bg-paper/5 px-4 py-4 text-sm text-paper/60">
          {t("noAnnouncementsYet")}
        </p>
      ) : (
        <div className="mt-6 space-y-2.5">
          {items.map((a) => (
            <div key={a.id} className="flex gap-3 rounded-2xl border border-paper/10 bg-paper/5 px-4 py-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber/15 text-amber">
                <Megaphone size={15} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm text-paper">{a.message}</p>
                <p className="mt-1.5 text-xs text-paper/45">
                  {a.sites?.name ?? t("allSites")} ·{" "}
                  {new Date(a.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
