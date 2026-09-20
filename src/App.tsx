import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";
import { AppStateProvider } from "./context/AppState";
import BottomNav from "./components/BottomNav";
import OfflineBanner from "./components/OfflineBanner";
import Login from "./routes/Login";
import Splash from "./routes/Splash";
import Register from "./routes/Register";
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
import { LeadLayout } from "./routes/lead/LeadOverview";
import LeadOverview from "./routes/lead/LeadOverview";
import { OwnerLayout } from "./routes/owner/OwnerDashboard";
import OwnerDashboard from "./routes/owner/OwnerDashboard";
import WorkersPage from "./routes/shared/WorkersPage";
import AttendancePage from "./routes/shared/AttendancePage";
import IssuesPage from "./routes/shared/IssuesPage";
import ReportsPage from "./routes/shared/ReportsPage";
import AssignmentsPage from "./routes/owner/AssignmentsPage";
import TasksPage from "./routes/owner/TasksPage";
import ChecklistsPage from "./routes/owner/ChecklistsPage";
import SettingsPage from "./routes/owner/SettingsPage";

// Leaflet (~150kb) is only needed on the Sites page — code-split it so
// worker-side mobile visits never download map code they'll never use.
const SitesPage = lazy(() => import("./routes/shared/SitesPage"));

function WorkerLayout() {
  return (
    <div>
      <Outlet />
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
          <Routes>
            <Route path="/" element={<RoleRedirect />} />
            <Route path="/splash" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

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
                  element={
                    <Suspense fallback={<div className="p-8 text-sm text-ink-900/50">Loading…</div>}>
                      <SitesPage />
                    </Suspense>
                  }
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
                  element={
                    <Suspense fallback={<div className="p-8 text-sm text-ink-900/50">Loading…</div>}>
                      <SitesPage />
                    </Suspense>
                  }
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
        </BrowserRouter>
      </AppStateProvider>
    </AuthProvider>
  );
}
