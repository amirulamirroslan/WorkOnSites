# WorkOnSite — Phase 1 scaffold

Starting point for the SiteCare/WorkOnSite build. See `PHASE1_PLAN.md` for the
full plan (design tokens, route map, schema, deliverables).

## Use this with Claude Code

1. Push this folder to a new empty GitHub repo.
2. Open it in Claude Code and paste `PHASE1_PLAN.md` plus the original master
   spec as context.
3. Ask Claude Code to: create a Supabase project, run
   `supabase/migrations/202609180001_create_foundation.sql`, wire
   `src/lib/supabase.ts` up with real env vars, and build out real auth on
   `src/routes/Login.tsx` + role-aware routing in `src/App.tsx`.
4. From there, work phase by phase (Sites/Geofence → Attendance → Tasks →
   Checklists → Evidence → Team Leader → Owner → Offline → PWA → Android) as
   the spec lays out — don't let it jump ahead and generate everything at once.

## Local setup

```bash
npm install
cp .env.example .env   # fill in Supabase URL + anon key
npm run dev
```

## Accounts

- **Owner**: self-registers at `/register` (email + password). This creates
  their organization and owner profile in one step.
- **Team leaders / workers**: have no self-signup — an owner adds them from
  the "Workers" page ("+ Add team member"), which calls the
  `create-team-member` Edge Function. They sign in with just a **username**
  (no email) plus the temporary password shown once when created.

Deploy the Edge Function once, from the project root:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase functions deploy create-team-member
```

No extra secrets to configure — Supabase injects `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` into Edge Functions automatically. Run migration
`202609180006_registration_and_admin.sql` (adds the registration RLS
policies + `profiles.username`) after the first five.

If your Supabase project has **email confirmation** on, owner registration
will ask the new owner to confirm their email before the org/profile get
created (Supabase won't hand back a session until then) — either turn that
off for now (Authentication → Providers → Email) or expect that extra step.
