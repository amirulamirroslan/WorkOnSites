import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkerNav } from "./nav";
import { I18nProvider } from "@/components/i18n-provider";
import type { Language } from "@/lib/i18n";

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, preferred_language")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // See the matching comment in dashboard/layout.tsx — signing out here
    // is what actually breaks the loop, not just redirecting.
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <I18nProvider initialLanguage={(profile.preferred_language as Language) ?? "en"}>
      <div className="min-h-screen bg-ink text-paper">
        <div className="pb-20">{children}</div>
        <WorkerNav />
      </div>
    </I18nProvider>
  );
}
