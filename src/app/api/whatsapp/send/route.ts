import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Coded, not yet configured: set WHATSAPP_PHONE_NUMBER_ID and
// WHATSAPP_ACCESS_TOKEN (from a Meta developer app with WhatsApp
// Business enabled) to make this actually send anything.
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const { data: caller } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!caller || !["owner", "team_leader"].includes(caller.role)) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!phoneNumberId || !accessToken) {
      return NextResponse.json({ error: "WhatsApp isn't configured yet." }, { status: 501 });
    }

    const { to, message } = (await request.json()) as { to: string; message: string };

    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({ error: body }, { status: 502 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("POST /api/whatsapp/send failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong sending the WhatsApp message." },
      { status: 500 }
    );
  }
}
