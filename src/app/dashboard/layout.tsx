import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "./nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, organizations(name)")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Authenticated but no profile row — a previous registration attempt
    // must have failed partway through. Sign out rather than redirecting
    // to a page that will bounce right back here (middleware sends a
    // still-logged-in user away from /login), which is what caused the
    // hang: dashboard → worker → login → dashboard, forever.
    await supabase.auth.signOut();
    redirect("/login");
  }
  if (profile.role === "janitor") redirect("/worker");

  const orgName = (profile.organizations as unknown as { name: string } | null)?.name;

  return (
    <div className="min-h-screen bg-paper md:flex">
      <DashboardNav fullName={profile.full_name} orgName={orgName ?? ""} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
