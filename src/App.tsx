import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Suspense, lazy, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { AuthProvider } from "./context/AuthContext";
import { AppStateProvider } from "./context/AppState";
import { useLocation } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import { PageFade } from "./components/Motion";
import NavRail from "./components/NavRail";
import OfflineBanner from "./components/OfflineBanner";
import Login from "./routes/Login";
import Splash from "./routes/Splash";
import Register from "./routes/Register";
import ForgotPassword from "./routes/ForgotPassword";
import SetPassword from "./routes/SetPassword";
import RoleRedirect from "./routes/RoleRedirect";
import RequireRole from "./routes/RequireRole";

// Every screen below is only ever needed by one role (worker, team leader,
// or owner), and RequireRole means a given visitor only ever reaches one of
// these three branches. Loading them eagerly meant a worker's phone
// downloaded the entire owner dashboard/settings/assignments code (and vice
// versa) on first paint. lazy() splits each into its own chunk so a role
// only ever fetches the screens it can actually reach; <Loadable> below
// gives each one a lightweight Suspense boundary scoped to its own Route,
// so the persistent chrome (NavRail/BottomNav) never unmounts while a chunk
// loads — only that route's content area shows the fallback.
const WorkerHome = lazy(() => import("./routes/worker/WorkerHome"));
const ClockInLocation = lazy(() => import("./routes/worker/ClockInLocation"));
const ClockInFace = lazy(() => import("./routes/worker/ClockInFace"));
const ClockInSuccess = lazy(() => import("./routes/worker/ClockInSuccess"));
const TaskList = lazy(() => import("./routes/worker/TaskList"));
const TaskChecklist = lazy(() => import("./routes/worker/TaskChecklist"));
const ClockOutConfirm = lazy(() => import("./routes/worker/ClockOut").then((m) => ({ default: m.ClockOutConfirm })));
const ClockOutSuccess = lazy(() => import("./routes/worker/ClockOut").then((m) => ({ default: m.ClockOutSuccess })));
const ClockOutFace = lazy(() => import("./routes/worker/ClockOutFace"));
const ReportIssue = lazy(() => import("./routes/worker/ReportIssue"));
const WorkerProfile = lazy(() => import("./routes/worker/WorkerProfile"));

const LeadLayout = lazy(() => import("./routes/lead/LeadOverview").then((m) => ({ default: m.LeadLayout })));
const LeadOverview = lazy(() => import("./routes/lead/LeadOverview"));
const OwnerLayout = lazy(() => import("./routes/owner/OwnerDashboard").then((m) => ({ default: m.OwnerLayout })));
const OwnerDashboard = lazy(() => import("./routes/owner/OwnerDashboard"));
const AssignmentsPage = lazy(() => import("./routes/owner/AssignmentsPage"));
const TasksPage = lazy(() => import("./routes/owner/TasksPage"));
const ChecklistsPage = lazy(() => import("./routes/owner/ChecklistsPage"));
const SettingsPage = lazy(() => import("./routes/owner/SettingsPage"));

// Shared between team-leader and owner routes.
const WorkersPage = lazy(() => import("./routes/shared/WorkersPage"));
const AttendancePage = lazy(() => import("./routes/shared/AttendancePage"));
const IssuesPage = lazy(() => import("./routes/shared/IssuesPage"));
const ReportsPage = lazy(() => import("./routes/shared/ReportsPage"));

// Leaflet (~150kb) is only needed on the Sites page — code-split it so
// worker-side mobile visits never download map code they'll never use.
const SitesPage = lazy(() => import("./routes/shared/SitesPage"));

// Shared fallback + Suspense wrapper for every lazy route above. Scoping
// this per-Route (rather than one Suspense around the whole tree) means
// only the content area shows "Loading…" — the nav rail / bottom nav,
// rendered by the (eager) layout components, stay mounted throughout.
function Loadable({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="p-8 text-sm text-ink-900/50">Loading…</div>}>{children}</Suspense>;
}

const workerNav = [
  { to: "/worker", label: "Home" },
  { to: "/worker/tasks", label: "Tasks" },
  { to: "/worker/report-issue", label: "Report" },
  { to: "/worker/profile", label: "Profile" },
];

// Phone: bottom tab bar. Laptop: left sidebar (same look as owner/team leader).
function WorkerLayout() {
  return (
    <div className="lg:flex">
      <div className="hidden lg:block">
        <NavRail items={workerNav} />
      </div>
      <div className="flex-1 min-w-0">
        <PageFade routeKey={useLocation().pathname}>
          <Outlet />
        </PageFade>
      </div>
      <BottomNav />
    </div>
  );
}

// Auth (Supabase-backed) + role-aware routing. All nav-rail sections for
// Team Leader and Owner are now real routes (still reading mock data —
// see PROGRESS.md for the swap-to-live-Supabase step).
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
    <AuthProvider>
      <AppStateProvider>
        <BrowserRouter>
          <OfflineBanner />
          <Routes>
            <Route path="/" element={<RoleRedirect />} />
            <Route path="/splash" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<SetPassword mode="recovery" />} />
            <Route path="/set-password" element={<SetPassword mode="forced" />} />

            <Route element={<RequireRole allow={["worker"]} />}>
              <Route element={<WorkerLayout />}>
                <Route path="/worker" element={<Loadable><WorkerHome /></Loadable>} />
                <Route path="/worker/tasks" element={<Loadable><TaskList /></Loadable>} />
                <Route path="/worker/report-issue" element={<Loadable><ReportIssue /></Loadable>} />
                <Route path="/worker/profile" element={<Loadable><WorkerProfile /></Loadable>} />
              </Route>
              <Route path="/worker/tasks/:taskId" element={<Loadable><TaskChecklist /></Loadable>} />
              <Route path="/worker/clock-in/location" element={<Loadable><ClockInLocation /></Loadable>} />
              <Route path="/worker/clock-in/face" element={<Loadable><ClockInFace /></Loadable>} />
              <Route path="/worker/clock-in/success" element={<Loadable><ClockInSuccess /></Loadable>} />
              <Route path="/worker/clock-out" element={<Loadable><ClockOutConfirm /></Loadable>} />
              <Route path="/worker/clock-out/face" element={<Loadable><ClockOutFace /></Loadable>} />
              <Route path="/worker/clock-out/success" element={<Loadable><ClockOutSuccess /></Loadable>} />
            </Route>

            <Route element={<RequireRole allow={["team_leader"]} />}>
              <Route element={<Loadable><LeadLayout /></Loadable>}>
                <Route path="/lead" element={<Loadable><LeadOverview /></Loadable>} />
                <Route path="/lead/sites" element={<Loadable><SitesPage /></Loadable>} />
                <Route path="/lead/workers" element={<Loadable><WorkersPage /></Loadable>} />
                <Route path="/lead/attendance" element={<Loadable><AttendancePage /></Loadable>} />
                <Route path="/lead/issues" element={<Loadable><IssuesPage /></Loadable>} />
                <Route path="/lead/reports" element={<Loadable><ReportsPage /></Loadable>} />
              </Route>
            </Route>

            <Route element={<RequireRole allow={["owner"]} />}>
              <Route element={<Loadable><OwnerLayout /></Loadable>}>
                <Route path="/owner" element={<Loadable><OwnerDashboard /></Loadable>} />
                <Route path="/owner/sites" element={<Loadable><SitesPage /></Loadable>} />
                <Route path="/owner/workers" element={<Loadable><WorkersPage /></Loadable>} />
                <Route path="/owner/assignments" element={<Loadable><AssignmentsPage /></Loadable>} />
                <Route path="/owner/tasks" element={<Loadable><TasksPage /></Loadable>} />
                <Route path="/owner/checklists" element={<Loadable><ChecklistsPage /></Loadable>} />
                <Route path="/owner/attendance" element={<Loadable><AttendancePage /></Loadable>} />
                <Route path="/owner/issues" element={<Loadable><IssuesPage /></Loadable>} />
                <Route path="/owner/reports" element={<Loadable><ReportsPage /></Loadable>} />
                <Route path="/owner/settings" element={<Loadable><SettingsPage /></Loadable>} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppStateProvider>
    </AuthProvider>
    </MotionConfig>
  );
}
