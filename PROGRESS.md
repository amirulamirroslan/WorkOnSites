# Build progress

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
