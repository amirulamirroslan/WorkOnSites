import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type Role = "owner" | "team_leader" | "worker";

type Profile = {
  id: string;
  organization_id: string;
  role: Role;
  full_name: string;
  pdpa_accepted_at: string | null;
};

type AuthValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    // profiles.id === auth.users.id, from the Phase 1 migration. A null
    // result here (no matching row) is a real, distinguishable state — see
    // profileLoading below — not the same as "still fetching."
    supabase
      .from("profiles")
      .select("id, organization_id, role, full_name, pdpa_accepted_at")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        setProfile(data as Profile | null);
        setProfileLoading(false);
      });
  }, [session]);

  const signIn = useCallback(async (emailOrUsername: string, password: string) => {
    // Team leaders/workers created via the "Add team member" flow have no
    // real email — they sign in with just their username, which maps to a
    // synthetic "<username>@workonsite.internal" auth email under the hood.
    const email = emailOrUsername.includes("@")
      ? emailOrUsername
      : `${emailOrUsername.trim().toLowerCase()}@workonsite.internal`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, profile, loading, profileLoading, signIn, signOut }),
    [session, profile, loading, profileLoading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
