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
