"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let email = identifier.trim();

    if (!email.includes("@")) {
      const { data: resolvedEmail, error: lookupError } = await supabase.rpc(
        "get_login_email",
        { login_username: email }
      );
      if (lookupError || !resolvedEmail) {
        setError("We couldn't find that username.");
        setLoading(false);
        return;
      }
      email = resolvedEmail;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError("Wrong username/email or password.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    router.push(profile?.role === "janitor" ? "/worker" : "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-semibold text-paper">
            W
          </div>
          <span className="font-display text-lg font-semibold text-ink">WorkOnSite</span>
        </Link>

        <div className="mt-8 rounded-2xl border border-line bg-paper p-7 shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-ink">Log in</h1>
          <p className="mt-1.5 text-sm text-muted">
            Owners and team leaders use email. Janitors use their username.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <Field label="Email or username">
              <input
                required
                className={inputClass}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </Field>
            <Field label="Password">
              <input
                required
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            {error && (
              <p className="rounded-xl border border-rust/30 bg-rust/5 px-3.5 py-2.5 text-sm text-rust">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Logging in…" : "Log in"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Registering an organization for the first time?{" "}
          <Link href="/register" className="text-ink underline">
            Register your team
          </Link>
        </p>
      </div>
    </main>
  );
}
