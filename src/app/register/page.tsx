"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/card";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message ?? "Could not create the account.");
      setLoading(false);
      return;
    }

    if (!signUpData.session) {
      setError(
        "Account created — check your email to confirm it, then log in to finish setup."
      );
      setLoading(false);
      return;
    }

    const orgId = crypto.randomUUID();
    const { error: orgError } = await supabase.from("organizations").insert({
      id: orgId,
      name: companyName,
      slug: `${slugify(companyName)}-${Date.now().toString(36)}`,
    });

    if (orgError) {
      setError(orgError.message);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: signUpData.user.id,
      organization_id: orgId,
      role: "owner",
      full_name: fullName,
      internal_email: email,
    });

    if (profileError) {
      await supabase.auth.signOut();
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
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
          <h1 className="font-display text-2xl font-semibold text-ink">Register your team</h1>
          <p className="mt-1.5 text-sm text-muted">
            You'll be the owner account — add janitors and team leaders after.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <Field label="Company name">
              <input
                required
                className={inputClass}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Bright Clean Sdn Bhd"
              />
            </Field>
            <Field label="Your name">
              <input
                required
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Siti Aminah"
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="siti@brightclean.my"
              />
            </Field>
            <Field label="Password">
              <input
                required
                minLength={8}
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </Field>

            {error && (
              <p className="rounded-xl border border-rust/30 bg-rust/5 px-3.5 py-2.5 text-sm text-rust">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating your account…" : "Create account"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-ink underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
