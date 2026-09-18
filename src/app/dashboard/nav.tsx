"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Users,
  MapPin,
  ClipboardList,
  Inbox,
  CalendarDays,
  LogOut,
  MoreHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const allLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/sites", label: "Sites", icon: MapPin },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/dashboard/requests", label: "Requests", icon: Inbox },
  { href: "/dashboard/reports", label: "Reports", icon: ClipboardList },
];

const primaryMobileLinks = allLinks.slice(0, 4);
const overflowMobileLinks = allLinks.slice(4);

export function DashboardNav({
  fullName,
  orgName,
}: {
  fullName: string;
  orgName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [showMore, setShowMore] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    async function loadPending() {
      const [leave, incidents, supplies] = await Promise.all([
        supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("incidents").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("supply_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      setPendingRequests((leave.count ?? 0) + (incidents.count ?? 0) + (supplies.count ?? 0));
    }
    loadPending();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const overflowActive = overflowMobileLinks.some((l) => l.href === pathname);
  const initial = fullName?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <>
      {/* Desktop dark sidebar */}
      <nav className="hidden w-64 shrink-0 flex-col bg-ink px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber text-sm font-semibold text-ink">
            {orgName?.charAt(0)?.toUpperCase() ?? "W"}
          </div>
          <p className="truncate font-display text-base font-semibold text-paper">{orgName}</p>
        </div>

        <div className="flex flex-1 flex-col gap-1">
          {allLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            const badge = href === "/dashboard/requests" ? pendingRequests : 0;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active ? "bg-amber/15 text-amber" : "text-paper/70 hover:bg-paper/5 hover:text-paper"
                }`}
              >
                <Icon size={17} strokeWidth={1.75} />
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span className="rounded-full bg-amber px-1.5 py-0.5 text-[10px] font-semibold text-ink">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-paper/5 px-3 py-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper/10 text-xs font-medium text-paper">
            {initial}
          </div>
          <p className="flex-1 truncate text-xs text-paper/70">{fullName}</p>
          <button onClick={handleSignOut} className="text-paper/50 hover:text-paper" aria-label="Sign out">
            <LogOut size={15} strokeWidth={1.75} />
          </button>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-paper md:hidden">
        {primaryMobileLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs ${
                active ? "text-ink" : "text-muted"
              }`}
            >
              <Icon size={19} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
        <button
          onClick={() => setShowMore(true)}
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs ${
            overflowActive ? "text-ink" : "text-muted"
          }`}
        >
          <MoreHorizontal size={19} strokeWidth={1.75} />
          More
        </button>
      </nav>

      {showMore && (
        <div className="fixed inset-0 z-20 flex items-end bg-ink/40 md:hidden" onClick={() => setShowMore(false)}>
          <div className="w-full rounded-t-2xl border border-line bg-paper p-2 pb-6" onClick={(e) => e.stopPropagation()}>
            {overflowMobileLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setShowMore(false)}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-ink"
              >
                <Icon size={18} strokeWidth={1.75} />
                {label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-muted"
            >
              <LogOut size={18} strokeWidth={1.75} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
