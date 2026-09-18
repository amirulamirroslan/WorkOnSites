import Link from "next/link";
import { MapPin, Camera, CheckCircle2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-semibold text-paper">
            W
          </span>
          <span className="font-display text-lg font-semibold text-ink">WorkOnSite</span>
        </span>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-ink hover:underline">
            Log in
          </Link>
          <Link href="/register" className={buttonClasses("primary")}>
            Register your team
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-5xl gap-12 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Know your crew showed up. See it, not just trust it.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Every clock-in carries a location and a timestamped photo. Every
            site gets a checklist. You get a report you can hand to a client.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/register" className={buttonClasses("primary")}>
              Register your team
            </Link>
            <Link href="/login" className={buttonClasses("secondary")}>
              I have an account
            </Link>
          </div>
        </div>

        {/* The hero IS the product's core interaction, not decoration */}
        <div className="rounded-3xl border border-line bg-canvas p-6">
          <div className="rounded-2xl border border-line bg-paper p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Clocked in</span>
              <span className="font-mono text-sm tabular text-ink">07:58:12</span>
            </div>
            <div className="mt-4 flex gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-line bg-canvas text-muted">
                <Camera size={22} strokeWidth={1.5} />
              </div>
              <div className="flex flex-1 flex-col justify-center gap-1.5">
                <div className="flex items-center gap-1.5 text-sm text-ink">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber/15 text-amber">
                    <MapPin size={11} />
                  </span>
                  Jaya One — Block C
                </div>
                <div className="font-mono text-xs tabular text-muted">
                  3.1201° N, 101.6357° E · within site radius
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <div className="flex items-center gap-2 text-sm text-pine">
                <CheckCircle2 size={16} />
                Lobby floors, restrooms, trash — 5 of 6 done
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-16 md:grid-cols-3">
          <Feature
            title="Proof, not paperwork"
            body="GPS and a live-camera photo at clock-in and clock-out. Reviewable, not automated — no face recognition."
          />
          <Feature
            title="Checklists that generate themselves"
            body="Set a template once per site. A fresh checklist appears every morning, with before/after photos on each item."
          />
          <Feature
            title="One report, every question answered"
            body="Attendance, task completion, and geofence compliance in one export — or filtered down to a single worker."
          />
        </div>
      </section>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
