import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";
import { AppStateProvider } from "./context/AppState";
import BottomNav from "./components/BottomNav";
import NavRail from "./components/NavRail";
import OfflineBanner from "./components/OfflineBanner";
import { LoadingScreen } from "./components/Loading";
import Login from "./routes/Login";
import Splash from "./routes/Splash";
import Register from "./routes/Register";
import ForgotPassword from "./routes/ForgotPassword";
import SetPassword from "./routes/SetPassword";
import RoleRedirect from "./routes/RoleRedirect";
import RequireRole from "./routes/RequireRole";
import WorkerHome from "./routes/worker/WorkerHome";
import ClockInLocation from "./routes/worker/ClockInLocation";
import ClockInFace from "./routes/worker/ClockInFace";
import ClockInSuccess from "./routes/worker/ClockInSuccess";
import TaskList from "./routes/worker/TaskList";
import TaskChecklist from "./routes/worker/TaskChecklist";
import { ClockOutConfirm, ClockOutSuccess } from "./routes/worker/ClockOut";
import ReportIssue from "./routes/worker/ReportIssue";
import WorkerProfile from "./routes/worker/WorkerProfile";

// Leaflet (~150kb) is only needed on the Sites page — code-split it so
// worker-side mobile visits never download map code they'll never use.
const SitesPage = lazy(() => import("./routes/shared/SitesPage"));

// Owner / team-leader screens are code-split: a worker on a phone never
// downloads them (and vice-versa). Each layout renders its own <Suspense>
// around the page outlet, so the sidebar stays put while a page chunk loads.
const LeadLayout = lazy(() => import("./routes/lead/LeadOverview").then((m) => ({ default: m.LeadLayout })));
const LeadOverview = lazy(() => import("./routes/lead/LeadOverview"));
const OwnerLayout = lazy(() => import("./routes/owner/OwnerDashboard").then((m) => ({ default: m.OwnerLayout })));
const OwnerDashboard = lazy(() => import("./routes/owner/OwnerDashboard"));
const WorkersPage = lazy(() => import("./routes/shared/WorkersPage"));
const AttendancePage = lazy(() => import("./routes/shared/AttendancePage"));
const IssuesPage = lazy(() => import("./routes/shared/IssuesPage"));
const ReportsPage = lazy(() => import("./routes/shared/ReportsPage"));
const AssignmentsPage = lazy(() => import("./routes/owner/AssignmentsPage"));
const TasksPage = lazy(() => import("./routes/owner/TasksPage"));
const ChecklistsPage = lazy(() => import("./routes/owner/ChecklistsPage"));
const SettingsPage = lazy(() => import("./routes/owner/SettingsPage"));

const workerNav = [
  { to: "/worker", label: "Home" },
  { to: "/worker/tasks", label: "Tasks" },
  { to: "/worker/report-issue", label: "Report" },
  { to: "/worker/profile", label: "Profile" },
];

// Phone: bottom tab bar. Laptop: left sidebar (same look as owner/team leader).
function WorkerLayout() {
  const { pathname } = useLocation();
  return (
    <div className="lg:flex">
      <div className="hidden lg:block">
        <NavRail items={workerNav} />
      </div>
      <div className="flex-1 min-w-0">
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
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
    <AuthProvider>
      <AppStateProvider>
        <BrowserRouter>
          <OfflineBanner />
          <Suspense fallback={<LoadingScreen />}>
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
                <Route path="/worker" element={<WorkerHome />} />
                <Route path="/worker/tasks" element={<TaskList />} />
                <Route path="/worker/report-issue" element={<ReportIssue />} />
                <Route path="/worker/profile" element={<WorkerProfile />} />
              </Route>
              <Route path="/worker/tasks/:taskId" element={<TaskChecklist />} />
              <Route path="/worker/clock-in/location" element={<ClockInLocation />} />
              <Route path="/worker/clock-in/face" element={<ClockInFace />} />
              <Route path="/worker/clock-in/success" element={<ClockInSuccess />} />
              <Route path="/worker/clock-out" element={<ClockOutConfirm />} />
              <Route path="/worker/clock-out/success" element={<ClockOutSuccess />} />
            </Route>

            <Route element={<RequireRole allow={["team_leader"]} />}>
              <Route element={<LeadLayout />}>
                <Route path="/lead" element={<LeadOverview />} />
                <Route
                  path="/lead/sites"
                  element={<SitesPage />}
                />
                <Route path="/lead/workers" element={<WorkersPage />} />
                <Route path="/lead/attendance" element={<AttendancePage />} />
                <Route path="/lead/issues" element={<IssuesPage />} />
                <Route path="/lead/reports" element={<ReportsPage />} />
              </Route>
            </Route>

            <Route element={<RequireRole allow={["owner"]} />}>
              <Route element={<OwnerLayout />}>
                <Route path="/owner" element={<OwnerDashboard />} />
                <Route
                  path="/owner/sites"
                  element={<SitesPage />}
                />
                <Route path="/owner/workers" element={<WorkersPage />} />
                <Route path="/owner/assignments" element={<AssignmentsPage />} />
                <Route path="/owner/tasks" element={<TasksPage />} />
                <Route path="/owner/checklists" element={<ChecklistsPage />} />
                <Route path="/owner/attendance" element={<AttendancePage />} />
                <Route path="/owner/issues" element={<IssuesPage />} />
                <Route path="/owner/reports" element={<ReportsPage />} />
                <Route path="/owner/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AppStateProvider>
    </AuthProvider>
  );
}
