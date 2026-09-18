import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppStateProvider } from "./context/AppState";
import BottomNav from "./components/BottomNav";
import Login from "./routes/Login";
import RoleRedirect from "./routes/RoleRedirect";
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
import SitesPage from "./routes/shared/SitesPage";
import WorkersPage from "./routes/shared/WorkersPage";
import AttendancePage from "./routes/shared/AttendancePage";
import IssuesPage from "./routes/shared/IssuesPage";
import ReportsPage from "./routes/shared/ReportsPage";
import AssignmentsPage from "./routes/owner/AssignmentsPage";
import TasksPage from "./routes/owner/TasksPage";
import ChecklistsPage from "./routes/owner/ChecklistsPage";
import SettingsPage from "./routes/owner/SettingsPage";

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
          <Routes>
            <Route path="/" element={<RoleRedirect />} />
            <Route path="/login" element={<Login />} />

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

            <Route element={<LeadLayout />}>
              <Route path="/lead" element={<LeadOverview />} />
              <Route path="/lead/sites" element={<SitesPage />} />
              <Route path="/lead/workers" element={<WorkersPage />} />
              <Route path="/lead/attendance" element={<AttendancePage />} />
              <Route path="/lead/issues" element={<IssuesPage />} />
              <Route path="/lead/reports" element={<ReportsPage />} />
            </Route>

            <Route element={<OwnerLayout />}>
              <Route path="/owner" element={<OwnerDashboard />} />
              <Route path="/owner/sites" element={<SitesPage />} />
              <Route path="/owner/workers" element={<WorkersPage />} />
              <Route path="/owner/assignments" element={<AssignmentsPage />} />
              <Route path="/owner/tasks" element={<TasksPage />} />
              <Route path="/owner/checklists" element={<ChecklistsPage />} />
              <Route path="/owner/attendance" element={<AttendancePage />} />
              <Route path="/owner/issues" element={<IssuesPage />} />
              <Route path="/owner/reports" element={<ReportsPage />} />
              <Route path="/owner/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppStateProvider>
    </AuthProvider>
  );
}
