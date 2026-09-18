# WorkOnSite — Phase 1 Plan (Foundation)

Derived from the SiteCare Master Specification + supplied mockups/logo. This is the
"propose before building" step the spec asks for (§74) — hand this to Claude Code
as the opening brief for a fresh repo.

## 1. Design tokens (from the mockups)

**Color**
| Token | Hex | Use |
|---|---|---|
| `brand-blue` | `#2E6BFF` | Primary actions, links, active states, logo |
| `brand-blue-dark` | `#1B48CC` | Pressed states, gradients |
| `navy-950` | `#0A1220` | Worker mobile dark surfaces (splash, dashboard, capture) |
| `navy-800` | `#121C2E` | Elevated dark cards/panels |
| `ink-900` | `#0F172A` | Primary text on light surfaces |
| `cloud-50` | `#F5F7FB` | Light app background (Team Leader / Owner desktop) |
| `success-500` | `#22C55E` | Clock-in success, completed checklist items |
| `warning-500` | `#F59E0B` | Pending / in-progress states |
| `danger-500` | `#EF4444` | Blocked / high-priority issues |

**Type**
- Headline/display: **Inter Tight** (600/700) — used for big stat numbers (65%, 8/12), section titles, worker-facing headers. Tabular figures on for all numeric stats.
- Body/UI: **Inter** (400/500) — labels, list rows, form fields, table text.
- Scale: 12 / 14 / 16 / 20 / 28 / 40 (px), 1.15 line-height on display, 1.5 on body.

**Layout principles**
- Worker mobile: single column, bottom tab bar (Home / Tasks / Activity / Profile), one dominant full-bleed action band per screen (Clock In, Continue Task) rather than grids of equal cards — matches spec §67 (don't overuse cards).
- Team Leader / Owner desktop: left nav rail + content. KPI numbers get compact stat rows, not giant cards; live worker status and site performance render as list rows with inline progress bars, not a wall of cards.
- Dark navy is reserved for the worker mobile flow (splash → clock-in → capture); Team Leader/Owner surfaces run on `cloud-50` light theme for scanability at a desk.

## 2. Route map

```
/                      → role-aware redirect
/login
/worker                Worker Home
/worker/tasks
/worker/tasks/:id      Checklist + photo evidence
/worker/clock-in       Location → Face Capture → Success
/worker/clock-out
/worker/activity
/worker/profile
/lead                  Team Leader Overview
/lead/sites
/lead/workers
/lead/attendance
/lead/issues
/lead/reports
/owner                 Owner Dashboard
/owner/sites
/owner/workers
/owner/assignments
/owner/tasks
/owner/checklists
/owner/settings
```

## 3. Phase 1 DB schema (foundation only — sites/tasks land in Phase 2+)

```sql
create type user_role as enum ('owner', 'team_leader', 'worker');

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  role user_role not null,
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);
```

RLS: every table scoped by `organization_id`; `profiles` readable within the same
org, writable only by `owner` (self-row excepted). Workers never get row access
outside their own assignments — enforced starting Phase 2 once `sites` and
`assignments` exist.

## 4. Phase 1 deliverables (matches spec §63)

- Vite + React + TS + Tailwind project (scaffolded below)
- Supabase project wired, `organizations` + `profiles` + RLS migration
- Auth: login, session restore, role-aware redirect
- Design system: tokens above as Tailwind theme + base components (Button, StatNumber, ProgressRing, ListRow)
- Bottom nav (worker) / nav rail (lead/owner) shells, no real data yet

Everything after this (sites, geofence, attendance, tasks…) is Phase 2 onward per
the spec — build those once Phase 1 is reviewed and running.
