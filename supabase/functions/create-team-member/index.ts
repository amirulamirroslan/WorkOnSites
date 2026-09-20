// supabase/functions/create-team-member/index.ts
//
// Lets an OWNER create a team_leader or worker account from inside the app.
// Runs with the service-role key (never exposed to the client) so it can
// call the Supabase Auth admin API. The caller's own JWT is used first, on
// a request-scoped client, purely to check "is this caller actually an
// owner in their org" — never trust a role sent in the request body.
//
// Deploy:   supabase functions deploy create-team-member
// Call from the client: supabase.functions.invoke("create-team-member", { body: {...} })

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Required for browser-invoked Edge Functions: the browser sends a preflight
// OPTIONS request before the real POST, and every response (including
// errors) needs Access-Control-Allow-Origin or the browser blocks it before
// the app's own code ever sees a response — this is what was causing
// "Failed to send a request to the Edge Function" client-side even though
// the function itself was deployed and reachable.
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
  // 10 random chars from a readable set — shown once to the owner to relay
  // to the new team leader/worker; they are not emailed anywhere.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
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
  if (callerProfile.role !== "owner") return json({ error: "Only owners can add team members" }, 403);

  const body = await req.json().catch(() => null);
  const fullName: string | undefined = body?.fullName?.trim();
  const username: string | undefined = body?.username?.trim().toLowerCase();
  const role: string | undefined = body?.role;

  if (!fullName || !username || (role !== "worker" && role !== "team_leader")) {
    return json({ error: "fullName, username, and role ('worker' | 'team_leader') are required" }, 400);
  }
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return json({ error: "Username must be 3-32 chars: lowercase letters, numbers, ._-" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const syntheticEmail = `${username}@workonsite.internal`;
  const tempPassword = randomTempPassword();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: syntheticEmail,
    password: tempPassword,
    email_confirm: true,
  });

  if (createErr || !created?.user) {
    const msg = createErr?.message ?? "Could not create the account";
    const status = /already registered|already exists/i.test(msg) ? 409 : 500;
    return json({ error: status === 409 ? "That username is already taken" : msg }, status);
  }

  const { error: insertErr } = await admin.from("profiles").insert({
    id: created.user.id,
    organization_id: callerProfile.organization_id,
    role,
    full_name: fullName,
    username,
  });

  if (insertErr) {
    // Roll back the auth user so we don't leave an orphaned account with no profile.
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: insertErr.message }, 500);
  }

  return json({ username, tempPassword, role, fullName });
});
