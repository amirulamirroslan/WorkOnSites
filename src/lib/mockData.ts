// Local mock data + minimal state so the worker flow is fully clickable
// before Supabase is connected. Replace with real Supabase queries once
// `src/lib/supabase.ts` has real env vars — the shapes here mirror the
// Phase 1-6 tables so the swap is mostly 1:1.

export type ChecklistItem = {
  id: string;
  label: string;
  requiresPhoto: boolean;
  isRequired: boolean;
  isCompleted: boolean;
};

export type Task = {
  id: string;
  title: string;
  subtitle: string;
  status: "pending" | "in_progress" | "completed";
  checklist: ChecklistItem[];
};

export const site = {
  name: "KL Tower",
  latitude: 3.1570,
  longitude: 101.7726,
  geofenceRadiusM: 50,
};

export const worker = {
  name: "Faiz Rahman",
};

export const initialTasks: Task[] = [
  {
    id: "t1",
    title: "Lobby",
    subtitle: "Completed",
    status: "completed",
    checklist: [
      { id: "c1", label: "Sweep floor", requiresPhoto: false, isRequired: true, isCompleted: true },
      { id: "c2", label: "Mop floor", requiresPhoto: false, isRequired: true, isCompleted: true },
    ],
  },
  {
    id: "t2",
    title: "Reception",
    subtitle: "Completed",
    status: "completed",
    checklist: [],
  },
  {
    id: "t3",
    title: "Level 2 Toilets",
    subtitle: "In progress",
    status: "in_progress",
    checklist: [
      { id: "c3", label: "Sweep floor", requiresPhoto: false, isRequired: true, isCompleted: true },
      { id: "c4", label: "Mop floor", requiresPhoto: false, isRequired: true, isCompleted: true },
      { id: "c5", label: "Clean mirrors", requiresPhoto: false, isRequired: true, isCompleted: false },
      { id: "c6", label: "Clean toilet bowls", requiresPhoto: false, isRequired: true, isCompleted: false },
      { id: "c7", label: "Refill soap", requiresPhoto: false, isRequired: true, isCompleted: false },
      { id: "c8", label: "Refill tissue", requiresPhoto: false, isRequired: true, isCompleted: false },
      { id: "c9", label: "Empty bins", requiresPhoto: true, isRequired: true, isCompleted: false },
    ],
  },
  { id: "t4", title: "Pantry", subtitle: "Pending", status: "pending", checklist: [] },
  { id: "t5", title: "Office Area", subtitle: "Pending", status: "pending", checklist: [] },
  { id: "t6", title: "Meeting Room", subtitle: "Pending", status: "pending", checklist: [] },
];

export type LiveWorker = {
  id: string;
  name: string;
  site: string;
  status: "on_site" | "not_clocked_in";
  clockedInAt?: string;
  tasksDone: number;
  tasksTotal: number;
};

export const liveWorkers: LiveWorker[] = [
  { id: "w1", name: "Ahmad Fauzi", site: "KL Tower", status: "on_site", clockedInAt: "06:03", tasksDone: 7, tasksTotal: 8 },
  { id: "w2", name: "Siti Rahman", site: "KL Tower", status: "on_site", clockedInAt: "06:07", tasksDone: 5, tasksTotal: 8 },
  { id: "w3", name: "Razak", site: "Menara A", status: "on_site", clockedInAt: "06:31", tasksDone: 3, tasksTotal: 10 },
  { id: "w4", name: "Amin", site: "HQ", status: "not_clocked_in", tasksDone: 0, tasksTotal: 6 },
];

export const sitePerformance = [
  { site: "KL Tower", percent: 92 },
  { site: "Menara A", percent: 76 },
  { site: "HQ", percent: 88 },
  { site: "Plant 2", percent: 95 },
];

export const ownerKpis = {
  attendance: "94%",
  taskCompletion: "87%",
  sitesActive: 18,
  highPriorityIssues: 4,
};

export type SiteRecord = {
  id: string;
  name: string;
  address: string;
  geofenceRadiusM: number;
  workersAssigned: number;
  performance: number;
};

export const sitesList: SiteRecord[] = [
  { id: "s1", name: "KL Tower", address: "Jalan KL, Kuala Lumpur", geofenceRadiusM: 50, workersAssigned: 6, performance: 92 },
  { id: "s2", name: "Menara A", address: "Menara A, Kuala Lumpur", geofenceRadiusM: 50, workersAssigned: 4, performance: 76 },
  { id: "s3", name: "HQ", address: "Sultan Ismail, Kuala Lumpur", geofenceRadiusM: 30, workersAssigned: 3, performance: 88 },
  { id: "s4", name: "Plant 2", address: "Shah Alam", geofenceRadiusM: 80, workersAssigned: 5, performance: 95 },
];

export type WorkerRecord = {
  id: string;
  name: string;
  role: "worker" | "team_leader";
  site: string;
  mobile: string;
};

export const workersList: WorkerRecord[] = [
  { id: "w1", name: "Ahmad Fauzi", role: "worker", site: "KL Tower", mobile: "+6012 345 6789" },
  { id: "w2", name: "Siti Rahman", role: "worker", site: "KL Tower", mobile: "+6012 555 1122" },
  { id: "w3", name: "Razak", role: "worker", site: "Menara A", mobile: "+6013 222 9981" },
  { id: "w4", name: "Amin", role: "worker", site: "HQ", mobile: "+6011 777 4433" },
  { id: "w5", name: "Faiz Rahman", role: "team_leader", site: "KL Tower", mobile: "+6012 345 6789" },
];

export type AttendanceRecord = {
  id: string;
  worker: string;
  site: string;
  clockIn: string;
  clockOut: string | null;
  status: "verified" | "out_of_range" | "exception_override";
};

export const attendanceLog: AttendanceRecord[] = [
  { id: "a1", worker: "Ahmad Fauzi", site: "KL Tower", clockIn: "06:03", clockOut: "13:18", status: "verified" },
  { id: "a2", worker: "Siti Rahman", site: "KL Tower", clockIn: "06:07", clockOut: null, status: "verified" },
  { id: "a3", worker: "Razak", site: "Menara A", clockIn: "06:31", clockOut: null, status: "exception_override" },
  { id: "a4", worker: "Amin", site: "HQ", clockIn: "—", clockOut: null, status: "out_of_range" },
];

export type IssueRecord = {
  id: string;
  site: string;
  reportedBy: string;
  category: string;
  description: string;
  status: "open" | "acknowledged" | "resolved";
};

export const issuesList: IssueRecord[] = [
  { id: "i1", site: "KL Tower", reportedBy: "Ahmad Fauzi", category: "Access Problem", description: "Toilet is blocked. Please arrange for service.", status: "open" },
  { id: "i2", site: "Menara A", reportedBy: "Razak", category: "Equipment Damage", description: "Mop bucket handle broken.", status: "acknowledged" },
  { id: "i3", site: "HQ", reportedBy: "Amin", category: "Chemical Unavailable", description: "Out of glass cleaner.", status: "resolved" },
];

export type OrgTask = {
  id: string;
  title: string;
  site: string;
  assignedTo: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
};

export const orgTasksList: OrgTask[] = [
  { id: "ot1", title: "Lobby cleaning", site: "KL Tower", assignedTo: "Ahmad Fauzi", status: "completed" },
  { id: "ot2", title: "Level 2 Toilets", site: "KL Tower", assignedTo: "Ahmad Fauzi", status: "in_progress" },
  { id: "ot3", title: "Reception", site: "Menara A", assignedTo: "Razak", status: "pending" },
  { id: "ot4", title: "Pantry restock", site: "HQ", assignedTo: "Amin", status: "blocked" },
];

export type ChecklistTemplateRecord = {
  id: string;
  name: string;
  version: number;
  itemCount: number;
};

export const checklistTemplatesList: ChecklistTemplateRecord[] = [
  { id: "ct1", name: "Toilet Cleaning", version: 3, itemCount: 7 },
  { id: "ct2", name: "Lobby Cleaning", version: 2, itemCount: 5 },
  { id: "ct3", name: "Pantry Restock", version: 1, itemCount: 4 },
];

export type AssignmentRecord = {
  id: string;
  worker: string;
  site: string;
  teamLeader: string;
  active: boolean;
};

export const assignmentsList: AssignmentRecord[] = [
  { id: "as1", worker: "Ahmad Fauzi", site: "KL Tower", teamLeader: "Faiz Rahman", active: true },
  { id: "as2", worker: "Siti Rahman", site: "KL Tower", teamLeader: "Faiz Rahman", active: true },
  { id: "as3", worker: "Razak", site: "Menara A", teamLeader: "Faiz Rahman", active: true },
  { id: "as4", worker: "Amin", site: "HQ", teamLeader: "Faiz Rahman", active: false },
];

// Haversine distance in metres — used by the location-verification screen.
export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
