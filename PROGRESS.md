# Build progress

This file tracks current state, not a session-by-session log — it's rewritten
to reflect where things stand now, so it doesn't just grow forever.

## Real (backed by Supabase, not mock data)
- **Bug fixed**: owner registration was hitting "new row violates row-level
  security policy for table organizations" on every attempt, despite the
  INSERT policy being correct all along. Root cause: `Register.tsx` chained
  `.insert().select().single()` on the `organizations` insert — the
  read-back after insert is itself governed by the SELECT policy, which
  checks the user's own org via their profile; at that exact moment they
  have no profile yet, so the read-back failed RLS and Supabase reported it
  as the insert itself being blocked. Fixed by generating the org id
  client-side and inserting it explicitly, with no read-back needed at all
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
- **Route protection**: `/worker`, `/lead`, `/owner` had zero auth/role
  guarding — any URL was directly reachable regardless of login state, which
  also meant signing out cleared the session but nothing redirected you away
  from the page you were already on. Added `RequireRole` wrapping every
  protected route group
- **Report Issue**: "Submit Report" didn't write anything — it just
  navigated back pretending to succeed. Now does a real insert into `issues`
- **Diagnosability**: a signed-in user with no matching `profiles` row (e.g.
  an orphaned auth account from a registration that failed partway) used to
  silently show blank names / "No site assigned" everywhere with no
  explanation. `AuthContext` now exposes `profileLoading` distinctly from
  session loading, and Worker Home shows a clear "Account not set up"
  message instead
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

## Responsive layout (phone / tablet / laptop)
- Every screen adapts to the window: worker Home/Tasks/Report/Profile use a bottom tab bar on phones and a left sidebar + wide content (Home is two-column) on laptops; standalone flows (clock-in, checklist, clock-out) are edge-to-edge on phones and a centred card on laptops
- Owner / team leader: sidebar on laptops, a top bar + slide-in menu drawer below 1024px; stat grids and headings scale down on phones
- Splash/Login/Register/Forgot/Set password: full-width navy screen with the skyline spanning the bottom on laptops, form in a glass panel
- Breakpoints: `md` = 768px (wider phone column, centred cards), `lg` = 1024px (sidebar layouts)

## Forgot / reset password
- **Owners (real email):** `Forgot password?` on Login → `/forgot-password` sends a Supabase reset email → link opens `/reset-password` to set a new password. Needs the site URL + `https://<your-domain>/reset-password` in Supabase → Authentication → URL Configuration → Redirect URLs
- **Team leaders / workers (username, no real email):** owner (any team leader/worker) or team leader (workers on their sites) taps **Reset password** on the Workers page → `reset-team-member-password` Edge Function generates a temp password shown once to hand over. The account is flagged `must_change_password`, so their next sign-in is forced through `/set-password`. New accounts from `create-team-member` get the same flag
- Deploy both functions: `npx supabase functions deploy reset-team-member-password` and re-deploy `create-team-member`

## Visual redesign (matches supplied mockups)
- Navy-gradient + light "sheet" layout for every worker screen (`components/MobileScreen.tsx`): Splash (Login / Sign Up + skyline), Login, Register, Worker Home (blue Clock In card, progress ring, task list), Checklist (filter tabs), Task detail + Photo Evidence, Clock In (Location w/ live map + Face steps), Clocked In success, Clock Out, Report Issue, Profile
- Desktop: dark-navy sidebar with logo + user/sign-out, stat-card dashboards for Team Leader and Owner (data still mock, see below)
- Bottom nav is Home / Tasks / Report / Profile (mockup shows Photos / More — no such routes exist yet)

## Visual polish (earlier pass)
- Real icon set (`lucide-react`) replacing plain text/unicode glyphs — bottom
  nav (Home/Tasks/Report/Profile) and the owner/lead sidebar had no real
  icons before (⌂ ☑ ! ● placeholders, or nothing at all on the sidebar)
- Card depth (shadow + subtle border) on Worker Home, Tasks list, Task
  Checklist, and Profile — was flat with no elevation before
- Task Checklist now shows a real progress bar (items done / total) and a
  custom checkbox style matching the app's rounded aesthetic instead of the
  browser's default checkbox

## Still mock data (`src/lib/mockData.ts`) — flagged, not yet touched
- Issues page (`issuesList`)
- Lead Overview's live-workers panel
- Owner Dashboard's KPI/site-performance cards
- Assignments page

## Known gaps / possible next steps
- The `create-team-member` and `reset-team-member-password` Edge Functions need deploying by the project
  owner (`supabase functions deploy create-team-member`) — not something
  doable from this side without their Supabase CLI login

## Setup checklist
1. Run all migrations in `supabase/migrations/` in filename order (001–011)
2. Deploy the Edge Function: `npx supabase functions deploy create-team-member`
3. Copy `.env.example` → `.env`, fill in your Supabase URL + anon key
4. `npm install && npm run dev`

## Design reference
Built against the supplied mockup images (splash, worker dashboard, location
verification, face capture, task list/checklist, clock-out, offline mode,
issue reporting, team leader/owner dashboards, sites/profile/reports/settings
screens) — ask if something doesn't match, since the mockups are the source
of truth over anything written here.

## UI motion & performance pass (current state)
- **Motion** lives in one place: the "Motion" sections at the bottom of
  `src/styles/index.css` (transform/opacity only, `prefers-reduced-motion`
  respected). Pieces: `AnimatedLogo` (gloss sweep + beacon rings; also shown in the phone-only brand row at the top of every worker tab in `MobileScreen`), sliding
  selected-item pill in `NavRail`/`BottomNav`, `Loading.tsx` (branded
  `LoadingScreen`, `PageLoader`, `Spinner`, skeletons), `SuccessBadge`,
  page-enter transition on every layout, `useAnimatedNumber` (count-ups on
  stat cards / bars / progress ring), `.press` / `.press-row` tap feedback.
- **Data loading**: tasks + assigned site are fetched in parallel using
  `session.user.id` (profiles.id === auth.users.id) instead of waiting behind
  the profile fetch, and cached in `AppState` (`site`) instead of re-fetched on
  every tab visit. They refresh quietly when the app returns to the foreground
  after 60s. Auth/AppState context values are memoised.
- **Bundle**: owner/team-leader screens are lazy chunks (`App.tsx`); react and
  supabase are split into long-lived vendor chunks (`vite.config.ts`) so app
  updates re-download ~23 kB gz, not the whole bundle. Google Fonts are
  runtime-cached for offline use.
- **Assets/uploads**: the logo shown in the UI is `public/logo-256.png` (4.5 kB;
  the old 213 kB `logo.png` was being downloaded for a 28–84 px image).
  Checklist photos are downscaled to 1600 px JPEG before upload
  (`src/lib/image.ts`) — raw camera photos are 3–8 MB.
