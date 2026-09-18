import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (!callerProfile || !["owner", "team_leader"].includes(callerProfile.role)) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error:
            "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it in your deployment's environment variables (Settings → API → service_role key in Supabase), then redeploy.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { fullName, username, role, hourlyRate, phoneNumber } = body as {
      fullName: string;
      username: string;
      role: "janitor" | "team_leader";
      hourlyRate?: number;
      phoneNumber?: string;
    };

    if (!fullName || !username || !role) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Janitors don't have an email, so we back their Supabase Auth account
    // with a synthetic one and let them log in by username instead —
    // resolved server-side via get_login_email(). `username` already has
    // a unique constraint on `profiles`, so it alone is enough to keep
    // this email unique — no need to also append the org id, which for a
    // longer username could push the local part past the 64-character
    // email limit and fail account creation with a cryptic error.
    const internalEmail = `${username}@workers.internal`;
    const temporaryPassword = crypto.randomUUID().slice(0, 12);

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: internalEmail,
      password: temporaryPassword,
      email_confirm: true,
    });

    if (createError || !created.user) {
      return NextResponse.json(
        { error: createError?.message ?? "Could not create the account." },
        { status: 400 }
      );
    }

    const { error: profileError } = await admin.from("profiles").insert({
      id: created.user.id,
      organization_id: callerProfile.organization_id,
      role,
      full_name: fullName,
      username,
      internal_email: internalEmail,
      hourly_rate: hourlyRate ?? null,
      phone_number: phoneNumber ?? null,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      const friendlyMessage = profileError.message.includes("profiles_username_key")
        ? `The username "${username}" is already taken — try a different one.`
        : profileError.message;
      return NextResponse.json({ error: friendlyMessage }, { status: 400 });
    }

    return NextResponse.json({
      id: created.user.id,
      username,
      temporaryPassword,
    });
  } catch (err) {
    // Whatever went wrong, guarantee a JSON response — an HTML error
    // page here would make the client's res.json() throw uncaught,
    // which is what was hanging the "Create account" button forever.
    console.error("POST /api/workers failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong creating the account." },
      { status: 500 }
    );
  }
}
