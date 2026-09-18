"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/card";
import { X, MapPin, Copy, ListChecks, Plus, Trash2 } from "lucide-react";

type Site = {
  id: string;
  name: string;
  address: string | null;
  radius_meters: number;
  public_share_token: string;
  client_verification_enabled: boolean;
};

export default function SitesPage() {
  const supabase = createClient();
  const [sites, setSites] = useState<Site[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplateFor, setEditingTemplateFor] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(true);

  async function loadSites() {
    const { data } = await supabase
      .from("sites")
      .select("id, name, address, radius_meters, public_share_token, client_verification_enabled")
      .order("name");
    setSites(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      setIsOwner(profile?.role === "owner");
    });
  }, []);

  async function toggleVerification(site: Site) {
    await supabase
      .from("sites")
      .update({ client_verification_enabled: !site.client_verification_enabled })
      .eq("id", site.id);
    loadSites();
  }

  useEffect(() => {
    loadSites();
  }, []);

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Sites</h1>
          <p className="mt-1 text-sm text-muted">Locations your crew clocks in at.</p>
        </div>
        {isOwner && <Button onClick={() => setShowForm(true)}>Add site</Button>}
      </div>

      {!loading && sites.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No sites yet. Add your first one.</p>
      ) : (
        <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-paper shadow-sm">
          {sites.map((s) => (
            <div key={s.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-amber" />
                  <div>
                    <p className="text-sm text-ink">{s.name}</p>
                    <p className="text-xs text-muted">{s.address}</p>
                  </div>
                </div>
                <span className="font-mono text-xs tabular text-muted">{s.radius_meters}m radius</span>
              </div>
              <div className="mt-2.5 flex items-center gap-3 pl-6">
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={s.client_verification_enabled}
                    onChange={() => toggleVerification(s)}
                  />
                  Client verification link
                </label>
                {s.client_verification_enabled && (
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${window.location.origin}/verify/${s.public_share_token}`
                      )
                    }
                    className="flex items-center gap-1 text-xs text-ink underline"
                  >
                    <Copy size={11} />
                    Copy link
                  </button>
                )}
                <button
                  onClick={() => setEditingTemplateFor(s)}
                  className="flex items-center gap-1 text-xs text-ink underline"
                >
                  <ListChecks size={11} />
                  Checklist template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AddSiteModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            loadSites();
          }}
        />
      )}

      {editingTemplateFor && (
        <TemplateEditorModal site={editingTemplateFor} onClose={() => setEditingTemplateFor(null)} />
      )}
    </div>
  );
}

type TemplateItem = { key: string; label: string };

function TemplateEditorModal({ site, onClose }: { site: Site; onClose: () => void }) {
  const supabase = createClient();
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: template } = await supabase
        .from("checklist_templates")
        .select("id")
        .eq("site_id", site.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!template) {
        setLoading(false);
        return;
      }
      setTemplateId(template.id);

      const { data: templateItems } = await supabase
        .from("checklist_template_items")
        .select("id, label")
        .eq("template_id", template.id)
        .order("sort_order");

      setItems((templateItems ?? []).map((i) => ({ key: i.id, label: i.label })));
      setLoading(false);
    }
    load();
  }, [site.id]);

  function addItem() {
    if (!newLabel.trim()) return;
    setItems((prev) => [...prev, { key: crypto.randomUUID(), label: newLabel.trim() }]);
    setNewLabel("");
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  async function save() {
    setSaving(true);
    setError(null);

    let currentTemplateId = templateId;

    if (!currentTemplateId) {
      const newId = crypto.randomUUID();
      const { error: templateError } = await supabase.from("checklist_templates").insert({
        id: newId,
        site_id: site.id,
        name: `${site.name} checklist`,
      });
      if (templateError) {
        setError(templateError.message);
        setSaving(false);
        return;
      }
      currentTemplateId = newId;
    } else {
      // Full replace is simplest and reliable for a short list like this —
      // clear existing items, then insert the current set fresh.
      const { error: deleteError } = await supabase
        .from("checklist_template_items")
        .delete()
        .eq("template_id", currentTemplateId);
      if (deleteError) {
        setError(deleteError.message);
        setSaving(false);
        return;
      }
    }

    if (items.length > 0) {
      const { error: insertError } = await supabase.from("checklist_template_items").insert(
        items.map((item, index) => ({
          template_id: currentTemplateId,
          label: item.label,
          sort_order: index,
        }))
      );
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Checklist template</h2>
            <p className="text-xs text-muted">{site.name}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <p className="mt-3 text-xs text-muted">
          A fresh checklist is generated from this template every day. Changes only apply to future days.
        </p>

        {loading ? null : (
          <>
            <div className="mt-4 space-y-2">
              {items.map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <span className="flex-1 rounded-xl border border-line px-3 py-2 text-sm text-ink">
                    {item.label}
                  </span>
                  <button onClick={() => removeItem(item.key)} className="text-muted hover:text-rust">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-muted">No items yet.</p>}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                className={inputClass}
                placeholder="e.g. Mop lobby floor"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem();
                  }
                }}
              />
              <button
                onClick={addItem}
                className="flex items-center justify-center rounded-xl border border-line px-3 text-ink hover:bg-canvas"
              >
                <Plus size={16} />
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-rust/30 bg-rust/5 px-3 py-2 text-sm text-rust">{error}</p>
        )}

        <Button onClick={save} disabled={saving} className="mt-5 w-full">
          {saving ? "Saving…" : "Save template"}
        </Button>
      </div>
    </div>
  );
}

function AddSiteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState(100);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function useCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("Couldn't get your location — enter it manually if needed.")
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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

    const { error: insertError } = await supabase.from("sites").insert({
      organization_id: profile!.organization_id,
      name,
      address,
      radius_meters: radius,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
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
          <h2 className="font-display text-lg font-semibold text-ink">Add site</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="Site name">
            <input required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Address">
            <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <Field label="Geofence radius (meters)">
            <input
              type="number"
              className={inputClass}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
          </Field>
          <div>
            <button
              type="button"
              onClick={useCurrentLocation}
              className="flex items-center gap-1.5 text-sm text-ink underline"
            >
              <MapPin size={14} />
              Use my current location
            </button>
            {coords && (
              <p className="mt-1.5 font-mono text-xs tabular text-muted">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-xl border border-rust/30 bg-rust/5 px-3 py-2 text-sm text-rust">{error}</p>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Saving…" : "Save site"}
          </Button>
        </form>
      </div>
    </div>
  );
}
