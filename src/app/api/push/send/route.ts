import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Coded, not yet configured: set NEXT_PUBLIC_VAPID_PUBLIC_KEY,
// VAPID_PRIVATE_KEY, and VAPID_SUBJECT (e.g. "mailto:you@yourcompany.com")
// to make this actually deliver anything. Generate a keypair with:
//   npx web-push generate-vapid-keys
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const { data: caller } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();
    if (!caller || !["owner", "team_leader"].includes(caller.role)) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT;
    if (!vapidPublic || !vapidPrivate || !vapidSubject) {
      return NextResponse.json({ error: "Push isn't configured yet (missing VAPID keys)." }, { status: 501 });
    }
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const { title, body, userIds } = (await request.json()) as {
      title: string;
      body: string;
      userIds?: string[];
    };

    const admin = createAdminClient();
    let query = admin.from("push_subscriptions").select("endpoint, p256dh, auth, user_id");
    if (userIds?.length) query = query.in("user_id", userIds);
    const { data: subs } = await query;

    const results = await Promise.allSettled(
      (subs ?? []).map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body })
        )
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return NextResponse.json({ sent, total: results.length });
  } catch (err) {
    console.error("POST /api/push/send failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong sending push notifications." },
      { status: 500 }
    );
  }
}
