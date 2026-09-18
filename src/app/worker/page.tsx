"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Clock, ChevronRight, ClipboardCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CameraCapture } from "@/components/camera-capture";
import { distanceMeters } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { queuePunch, getQueuedPunches, removeQueuedPunch, type QueuedPunch } from "@/lib/offline-queue";

type Site = { id: string; name: string; address: string | null; lat: number | null; lng: number | null; radius_meters: number };
type OpenShift = { id: string; site_id: string; clock_in_at: string; sites: { name: string } | null };
type ChecklistPreview = { total: number; done: number };

export default function WorkerHomePage() {
  const supabase = createClient();
  const { t } = useI18n();
  const [sites, setSites] = useState<Site[]>([]);
  const [openShift, setOpenShift] = useState<OpenShift | null>(null);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [showCamera, setShowCamera] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState(0);
  const [optimisticClockedIn, setOptimisticClockedIn] = useState<boolean | null>(null);
  const [now, setNow] = useState(new Date());
  const [checklistPreview, setChecklistPreview] = useState<ChecklistPreview | null>(null);
  const [showSitePicker, setShowSitePicker] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  async function uploadAndSubmit(punch: QueuedPunch) {
    const fileName = `${punch.userId}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("shift-photos")
      .upload(fileName, punch.photoBlob, { contentType: "image/jpeg" });
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("shift-photos").getPublicUrl(fileName);

    if (punch.kind === "clock_out" && punch.openShiftId) {
      const { error } = await supabase
        .from("shifts")
        .update({
          status: "closed",
          clock_out_at: punch.capturedAt,
          clock_out_lat: punch.lat,
          clock_out_lng: punch.lng,
          clock_out_accuracy: punch.accuracy,
          clock_out_photo_url: publicUrl,
          clock_out_within_geofence: punch.withinGeofence,
        })
        .eq("id", punch.openShiftId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("shifts").insert({
        organization_id: punch.organizationId,
        site_id: punch.siteId,
        user_id: punch.userId,
        clock_in_at: punch.capturedAt,
        clock_in_lat: punch.lat,
        clock_in_lng: punch.lng,
        clock_in_accuracy: punch.accuracy,
        clock_in_photo_url: publicUrl,
        clock_in_within_geofence: punch.withinGeofence,
      });
      if (error) throw error;
    }
  }

  async function flushQueue() {
    const queued = await getQueuedPunches();
    setPendingSync(queued.length);
    for (const punch of queued) {
      try {
        await uploadAndSubmit(punch);
        await removeQueuedPunch(punch.id);
      } catch {
        // Still offline or the request failed — leave it queued and retry
        // on the next "online" event or the next time this page loads.
        break;
      }
    }
    const remaining = await getQueuedPunches();
    setPendingSync(remaining.length);
    if (remaining.length < queued.length) loadState();
  }

  useEffect(() => {
    flushQueue();
    window.addEventListener("online", flushQueue);
    return () => window.removeEventListener("online", flushQueue);
  }, []);

  async function loadState() {
    // getSession() reads the token locally instead of round-tripping to
    // the Auth server like getUser() does — safe here since RLS on the
    // actual queries below is what enforces access, not this id lookup.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    const [profileRes, assignmentsRes, shiftRes] = await Promise.all([
      supabase.from("profiles").select("organization_id").eq("id", user.id).single(),
      supabase.from("site_assignments").select("sites(id, name, address, lat, lng, radius_meters)").eq("user_id", user.id),
      supabase
        .from("shifts")
        .select("id, site_id, clock_in_at, sites(name)")
        .eq("user_id", user.id)
        .eq("status", "open")
        .maybeSingle(),
    ]);

    setOrganizationId(profileRes.data?.organization_id ?? null);

    const assignedSites = (assignmentsRes.data ?? [])
      .map((a) => a.sites as unknown as Site)
      .filter(Boolean);
    setSites(assignedSites);
    if (assignedSites.length === 1) setSelectedSite(assignedSites[0].id);

    setOpenShift(shiftRes.data as unknown as OpenShift | null);
    setOptimisticClockedIn(null);
    setLoading(false);
  }

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    const activeSiteId = openShift?.site_id ?? selectedSite;
    if (!activeSiteId) {
      setChecklistPreview(null);
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("checklists")
      .select("id, checklist_items(status)")
      .eq("site_id", activeSiteId)
      .eq("checklist_date", today)
      .maybeSingle()
      .then(({ data }) => {
        const items = (data?.checklist_items as unknown as { status: string }[] | undefined) ?? [];
        if (items.length === 0) {
          setChecklistPreview(null);
          return;
        }
        setChecklistPreview({
          total: items.length,
          done: items.filter((i) => i.status === "done").length,
        });
      });
  }, [openShift, selectedSite]);

  useEffect(() => {
    if (!openShift) return;
    const tick = () => {
      const ms = Date.now() - new Date(openShift.clock_in_at).getTime();
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      setElapsed(`${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [openShift]);

  function startClockAction() {
    if (!openShift && !selectedSite) {
      setError(t("chooseASiteFirst"));
      return;
    }
    setError(null);
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocating(false);
        setShowCamera(true);
      },
      () => {
        setLocating(false);
        setError(t("turnOnLocation"));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handlePhoto(blob: Blob) {
    setShowCamera(false);
    setError(null);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { lat, lng, accuracy } = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      const site = sites.find((s) => s.id === (openShift ? openShift.site_id : selectedSite));
      const withinGeofence =
        site?.lat && site?.lng ? distanceMeters(lat, lng, site.lat, site.lng) <= site.radius_meters : null;

      const punch: QueuedPunch = {
        id: crypto.randomUUID(),
        kind: openShift ? "clock_out" : "clock_in",
        userId: user.id,
        organizationId,
        siteId: openShift ? openShift.site_id : selectedSite,
        openShiftId: openShift?.id,
        lat,
        lng,
        accuracy,
        withinGeofence,
        photoBlob: blob,
        capturedAt: new Date().toISOString(),
      };

      if (!navigator.onLine) {
        await queuePunch(punch);
        setPendingSync((n) => n + 1);
        setOptimisticClockedIn(punch.kind === "clock_in");
        return;
      }

      try {
        await uploadAndSubmit(punch);
        loadState();
      } catch {
        // The request itself failed — most likely a dropped connection
        // mid-upload. Queue it rather than losing the clock-in/out.
        await queuePunch(punch);
        setPendingSync((n) => n + 1);
        setOptimisticClockedIn(punch.kind === "clock_in");
      }
    });
  }

  if (loading) return null;

  const isClockedIn = optimisticClockedIn ?? !!openShift;
  const activeSite = sites.find((s) => s.id === (openShift?.site_id ?? selectedSite));
  const activeSiteName = openShift?.sites?.name ?? activeSite?.name;

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col px-6 py-8">
      <div>
        <p className="text-sm text-paper/50">{t("today")}</p>
        <div className="mt-1 flex items-baseline justify-between">
          <h1 className="font-display text-2xl font-semibold">
            {isClockedIn ? t("youreClockedIn") : t("readyToClockIn")}
          </h1>
          <span className="font-mono text-lg tabular text-paper/60">
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Site card — always visible, not just once clocked in */}
      {sites.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-paper/10 bg-paper/5 px-4 py-4 text-sm text-paper/60">
          {t("notAssigned")}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => sites.length > 1 && !isClockedIn && setShowSitePicker(true)}
          className={`mt-6 w-full rounded-3xl border p-6 text-left transition-colors ${
            isClockedIn ? "border-amber/20 bg-amber/10" : "border-paper/10 bg-paper/5"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm text-paper/80">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  isClockedIn ? "bg-amber/20 text-amber" : "bg-paper/10 text-paper/60"
                }`}
              >
                <MapPin size={15} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-base text-paper">{activeSiteName ?? t("chooseASite")}</p>
                {activeSite?.address && <p className="text-xs text-paper/45">{activeSite.address}</p>}
              </div>
            </div>
            {sites.length > 1 && !isClockedIn && <ChevronRight size={16} className="text-paper/30" />}
          </div>

          {openShift && (
            <div className="mt-5 flex items-baseline gap-2 border-t border-amber/15 pt-5">
              <Clock size={20} className="text-amber" />
              <span className="font-mono text-4xl font-semibold tabular text-paper">{elapsed}</span>
            </div>
          )}
        </button>
      )}

      {/* Checklist preview — gives the screen something to do besides wait */}
      {checklistPreview && (
        <Link
          href="/worker/checklist"
          className="mt-4 flex items-center gap-3 rounded-2xl border border-paper/10 bg-paper/5 px-4 py-3.5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine/15 text-pine">
            <ClipboardCheck size={15} strokeWidth={1.75} />
          </span>
          <span className="flex-1 text-sm text-paper/80">
            {checklistPreview.done} / {checklistPreview.total} {t("ofDone")}
          </span>
          <ChevronRight size={16} className="text-paper/30" />
        </Link>
      )}

      {error && <p className="mt-4 text-sm text-rust">{error}</p>}
      {pendingSync > 0 && (
        <p className="mt-4 inline-flex items-center rounded-full bg-amber/15 px-3 py-1.5 text-xs text-amber">
          {pendingSync} clock {pendingSync > 1 ? "punches" : "punch"} saved offline — will sync automatically.
        </p>
      )}

      <div className="flex-1" />

      <Button
        onClick={startClockAction}
        disabled={locating || sites.length === 0 || pendingSync > 0}
        className="w-full !rounded-2xl !bg-amber !border-amber !py-3.5 !text-ink"
      >
        {locating ? t("findingLocation") : isClockedIn ? t("clockOut") : t("clockIn")}
      </Button>

      {showCamera && (
        <CameraCapture onCapture={handlePhoto} onCancel={() => setShowCamera(false)} />
      )}

      {showSitePicker && (
        <div
          className="fixed inset-0 z-20 flex items-end bg-ink/70 backdrop-blur-sm sm:items-center sm:justify-center"
          onClick={() => setShowSitePicker(false)}
        >
          <div
            className="w-full rounded-t-3xl border border-paper/10 bg-ink p-6 pb-8 sm:max-w-sm sm:rounded-3xl sm:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-paper/15 sm:hidden" />
            <h2 className="font-display text-lg font-semibold">{t("chooseASite")}</h2>
            <div className="mt-4 space-y-2">
              {sites.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSite(s.id);
                    setShowSitePicker(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left ${
                    selectedSite === s.id
                      ? "border-amber/30 bg-amber/10 text-amber"
                      : "border-paper/10 bg-paper/5 text-paper"
                  }`}
                >
                  <MapPin size={15} strokeWidth={1.75} />
                  <span className="text-sm">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
