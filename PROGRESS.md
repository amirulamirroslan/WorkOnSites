# Build progress

## Built and working (this session)
- Real logo/favicon/PWA icons (blue rounded-square mark, pin + checkmark) — was completely missing before;
  wired into `index.html`, `vite.config.ts` PWA manifest, Login and NavRail
- `.gitignore` — was missing entirely
- Owner self-registration (`/register`): creates `organizations` + owner `profiles` row client-side
- Migration `202609180006_registration_and_admin.sql`: RLS policies enabling the org-creation +
  first-owner bootstrap insert (previously impossible — `profiles_insert_owner` required an existing
  owner, a chicken-and-egg deadlock for the very first user), plus a `profiles.username` column
- `create-team-member` Edge Function (`supabase/functions/`): owner-only, service-role-backed creation
  of team_leader/worker accounts with a synthesized `username@workonsite.internal` email + random temp
  password (shown once) — since field workers often have no real email
- `AuthContext.signIn` now accepts a bare username (auto-maps to the synthetic email) alongside real email
- `WorkersPage` rebuilt off real Supabase data (was mock-only) with an owner-only "+ Add team member" modal

## Not yet done
- Edge Function needs deploying by the project owner (`supabase functions deploy create-team-member`) —
  not something doable from this side without their Supabase CLI login
- Team-leader-scoped worker visibility (currently every org member sees the full workers list, not
  scoped to a team leader's assigned sites)

## Built and working
- Full worker mobile flow: Home (clock-in aware) → Clock In (Location → Face Capture → Success) →
  Task List → Task Checklist + photo evidence → Clock Out (confirm → success) → Report Issue → Profile
- Real Supabase auth wiring: `AuthContext` (session + profile/role lookup), functional `Login.tsx`
  calling `supabase.auth.signInWithPassword`, `RoleRedirect` sending each role to its home
- Team Leader (`/lead`): Overview, Sites, Workers, Attendance, Issues (acknowledge/resolve actions),
  Reports — all real routes on the nav rail
- Owner (`/owner`): Dashboard, Sites, Workers, Assignments, Tasks, Checklists, Attendance, Issues,
  Reports, Settings (incl. sign out) — every nav item from the spec is a real route
- Design tokens from your mockups; dark surface for worker mobile, light surface for desktop
- Type-checks clean (`npx tsc -b`) and builds clean (`npx vite build`)

## Database schema (SQL migrations, not yet applied — needs your Supabase project)
- Phase 1: organizations, profiles, roles, RLS
- Phase 2: sites, geofence, site_assignments
- Phase 3: attendance_events (clock in/out, location, verification status, capture photo)
- Phase 4/5: checklist_templates, tasks, task_checklist_items
- Phase 6: task_photos, issues

## Not built yet (all data is local mock data in `src/lib/mockData.ts` right now)
- Every page above reads mock data, not live Supabase queries — the shapes in mockData.ts already
  match the migration tables 1:1, so this is a query swap, not a rebuild
- Create/edit forms (Sites, Workers, Assignments, Checklist template editor) — pages are read-only
  lists right now, matching what's visible in the mockups
- Offline queue/sync
- PWA install polish beyond the basic manifest, and Capacitor/Android packaging

## Suggested next step
Connect Supabase (your side), run the five migrations in order, create one test user per role, and
confirm `RoleRedirect` sends each to the right dashboard. Then swap `mockData.ts` reads for real
Supabase queries page by page — Sites and Workers first, since Attendance/Issues/Tasks depend on
them existing.
