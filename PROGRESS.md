# Build progress

This file tracks current state, not a session-by-session log — it's rewritten
to reflect where things stand now, so it doesn't just grow forever.

## Real (backed by Supabase, not mock data)
- **Auth & accounts**: owner self-registration (`/register`, creates org +
  owner profile), `create-team-member` Edge Function for owner-added
  team leaders/workers (synthetic `username@workonsite.internal` email +
  one-time temp password, since field workers often have no real email),
  real sign-in for both (username or email)
- **Sites**: owner CRUD with a map-picked location + geofence radius
  (Leaflet/OpenStreetMap, no API key), worker/team-leader assignment per site
- **Attendance**: clock-in/out does a real GPS geofence check against the
  worker's actual assigned site (with a picker if they have more than one),
  uploads the capture photo to Storage, writes real `attendance_events` rows.
  Out-of-range clock-ins can be submitted with a reason as a self-reported
  exception (`verification_status = 'exception_override'`), visible to
  owner/team leader on the Attendance page
- **Offline queueing**: a clock-in/out made without connection (or one that
  fails mid-request) is queued in IndexedDB (`src/lib/offlineQueue.ts`) and
  auto-synced on reconnect (`syncOfflineQueue()`, wired into `OfflineBanner`)
- **Tasks & checklists**: owner assigns tasks (worker + site + checklist
  template + date) from the Tasks page; template items are copied onto the
  task at creation time so later template edits don't retroactively change
  an in-progress task. Owner also has a full template editor (Checklists
  page: add/remove items, toggle required/photo-required). Worker's task
  list/checklist reads and writes real data (`src/lib/tasks.ts`) — checking
  an item, completing a task, and uploading a checklist photo (to a
  `task-photos` bucket) all persist for real
- **Reports**: Daily/Weekly/Monthly toggle computed from live attendance +
  task data, plus CSV export of the period's attendance records
- **Team-leader/worker scoping**: `profiles` and `attendance_events` used to
  be readable org-wide by anyone — any worker or team leader could see every
  other worker's profile and attendance data. Now scoped: owner sees
  everything, team leader sees only people/records on sites they're assigned
  to (`shares_a_site_with()`), worker sees only their own
- **Supervisor override review**: an out-of-range clock-in submitted with a
  reason (self-reported exception) now shows an "Approve" action to
  owner/team leader on the Attendance page — sets the schema's `override_by`
  column, which existed from the start but had no UPDATE policy or UI at
  all before. A reviewed exception shows "Reviewed" next to it

## Still mock data (`src/lib/mockData.ts`) — flagged, not yet touched
- Issues page (`issuesList`)
- Lead Overview's live-workers panel
- Owner Dashboard's KPI/site-performance cards
- Assignments page

## Known gaps / possible next steps
- The `create-team-member` Edge Function needs deploying by the project
  owner (`supabase functions deploy create-team-member`) — not something
  doable from this side without their Supabase CLI login

## Setup checklist
1. Run all migrations in `supabase/migrations/` in filename order (001–010)
2. Deploy the Edge Function: `npx supabase functions deploy create-team-member`
3. Copy `.env.example` → `.env`, fill in your Supabase URL + anon key
4. `npm install && npm run dev`

## Design reference
Built against the supplied mockup images (splash, worker dashboard, location
verification, face capture, task list/checklist, clock-out, offline mode,
issue reporting, team leader/owner dashboards, sites/profile/reports/settings
screens) — ask if something doesn't match, since the mockups are the source
of truth over anything written here.
