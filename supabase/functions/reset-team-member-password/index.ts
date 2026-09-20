// supabase/functions/reset-team-member-password/index.ts
//
// Lets an OWNER (for team leaders + workers) or a TEAM LEADER (for workers on
// their own sites) reset a forgotten password. Team leaders/workers sign in
// with a synthetic "<username>@workonsite.internal" address, so an emailed
// reset link can't reach them — instead a new one-time temporary password is
// generated and shown to the person doing the reset, to hand over directly.
// The account is flagged `must_change_password`, so the worker is forced to
// choose their own password the first time they sign in with the temp one.
//
// Like create-team-member, the caller's own JWT is used on a request-scoped
// client so Row Level Security decides which people the caller may even see
// (a team leader can only read profiles on sites they're assigned to). The
// service-role key is only used for the actual password change.
//
// Deploy:   supabase functions deploy reset-team-member-password
// Call:     supabase.functions.invoke("reset-team-member-password", { body: { memberId } })

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function randomTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "Not authenticated" }, 401);

  const { data: callerProfile, error: profileErr } = await callerClient
    .from("profiles")
    .select("role, organization_id")
    .eq("id", userData.user.id)
    .single();

  if (profileErr || !callerProfile) return json({ error: "No profile found for caller" }, 403);
  if (callerProfile.role !== "owner" && callerProfile.role !== "team_leader") {
    return json({ error: "Only owners and team leaders can reset passwords" }, 403);
  }

  const body = await req.json().catch(() => null);
  const memberId: string | undefined = body?.memberId;
  if (!memberId || typeof memberId !== "string") return json({ error: "memberId is required" }, 400);
  if (memberId === userData.user.id) {
    return json({ error: "You can't reset your own password here. Use Forgot password on the login page." }, 400);
  }

  // Read the target through the CALLER's RLS-scoped client: a team leader
  // only gets a row back for workers who share one of their sites.
  const { data: target } = await callerClient
    .from("profiles")
    .select("id, role, username, full_name, organization_id")
    .eq("id", memberId)
    .maybeSingle();

  if (!target || target.organization_id !== callerProfile.organization_id) {
    return json({ error: "Team member not found (or not on your sites)" }, 404);
  }
  if (target.role === "owner") return json({ error: "Owner passwords can't be reset this way" }, 403);
  if (callerProfile.role === "team_leader" && target.role !== "worker") {
    return json({ error: "Team leaders can only reset worker passwords" }, 403);
  }
  if (!target.username) {
    return json({ error: "This account signs in with an email address — they can use Forgot password on the login page." }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const tempPassword = randomTempPassword();
  const { error: updateErr } = await admin.auth.admin.updateUserById(target.id, {
    password: tempPassword,
    user_metadata: { must_change_password: true },
  });
  if (updateErr) return json({ error: updateErr.message }, 500);

  return json({ username: target.username, fullName: target.full_name, tempPassword });
});
