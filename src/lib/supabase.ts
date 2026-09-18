import { createClient } from "@supabase/supabase-js";

// Fill these from your Supabase project settings (Project Settings → API).
// Use a .env file (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) — never commit
// the service-role key or use it in frontend code (spec §75 rule 4).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
