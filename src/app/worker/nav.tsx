"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardCheck, MoreHorizontal } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

export function WorkerNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const links = [
    { href: "/worker", label: t("home"), icon: Home },
    { href: "/worker/checklist", label: t("checklist"), icon: ClipboardCheck },
    { href: "/worker/more", label: t("more"), icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-paper/10 bg-ink/95 px-3 py-2 backdrop-blur">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 px-4 py-1.5 text-xs"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                active ? "bg-amber/15 text-amber" : "text-paper/50"
              }`}
            >
              <Icon size={19} strokeWidth={1.75} />
            </span>
            <span className={active ? "text-amber" : "text-paper/50"}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
