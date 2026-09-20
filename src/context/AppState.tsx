import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "./AuthContext";
import { fetchMyTasksToday, setChecklistItemCompleted, markTaskCompleted, type Task } from "../lib/tasks";
import { getMyAssignedSite, type AssignedSite } from "../lib/attendance";

type ClockStatus = "clocked_out" | "clocked_in";

export type PendingClockIn = {
  site: AssignedSite;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  distance: number;
  verified: boolean;
  photoBlob: Blob | null;
  overrideReason: string | null;
};

// Captured on the clock-out photo screen — GPS is re-checked at clock-out
// (same site as clock-in, but position can move), so it travels alongside
// the photo rather than being re-fetched a second time at the summary step.
export type PendingClockOut = {
  photoBlob: Blob | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
};

type AppStateValue = {
  // The worker's assigned site, fetched once and shared by every screen
  // (previously each tab re-fetched it on every visit).
  site: AssignedSite | null;
  tasks: Task[];
  tasksLoading: boolean;
  refreshTasks: () => Promise<void>;
  setTaskChecklistItem: (taskId: string, itemId: string, isCompleted: boolean) => void;
  completeTask: (taskId: string) => Promise<void>;
  clockStatus: ClockStatus;
  setClockStatus: (s: ClockStatus) => void;
  clockInTime: string | null;
  setClockInTime: (t: string | null) => void;
  pendingClockIn: PendingClockIn | null;
  setPendingClockIn: (p: PendingClockIn | null) => void;
  pendingClockOut: PendingClockOut | null;
  setPendingClockOut: (p: PendingClockOut | null) => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  // profiles.id === auth.users.id, so tasks and the assigned site can be
  // fetched in parallel with the profile instead of waiting behind it.
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const [site, setSite] = useState<AssignedSite | null>(null);
  const lastFetchAt = useRef(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [clockStatus, setClockStatus] = useState<ClockStatus>("clocked_out");
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [pendingClockIn, setPendingClockIn] = useState<PendingClockIn | null>(null);
  const [pendingClockOut, setPendingClockOut] = useState<PendingClockOut | null>(null);

  const refreshTasks = useCallback(async () => {
    if (!userId) {
      setTasks([]);
      // Still resolving the session → keep showing the loading state.
      setTasksLoading(authLoading);
      return;
    }
    lastFetchAt.current = Date.now();
    setTasksLoading(true);
    const fetched = await fetchMyTasksToday(userId);
    setTasks(fetched);
    setTasksLoading(false);
  }, [userId, authLoading]);

  const refreshSite = useCallback(async () => {
    setSite(userId ? await getMyAssignedSite(userId) : null);
  }, [userId]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  useEffect(() => {
    refreshSite();
  }, [refreshSite]);

  // Data is now cached for the whole session, so quietly refresh it when the
  // app comes back to the foreground after a while (no skeleton flash: the
  // loading UI only shows while there are no tasks yet).
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible" && userId && Date.now() - lastFetchAt.current > 60_000) {
        refreshTasks();
        refreshSite();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [userId, refreshTasks, refreshSite]);

  const setTaskChecklistItem = useCallback((taskId: string, itemId: string, isCompleted: boolean) => {
    // Optimistic local update, then a real write. Also flips a still-pending
    // task to in_progress the moment its first item is checked, matching
    // setChecklistItemCompleted's own server-side rule.
    setTasks((prev) =>
      prev.map((t) =>
        t.id !== taskId
          ? t
          : {
              ...t,
              status: isCompleted && t.status === "pending" ? "in_progress" : t.status,
              subtitle: isCompleted && t.status === "pending" ? "In Progress" : t.subtitle,
              checklist: t.checklist.map((c) => (c.id === itemId ? { ...c, isCompleted } : c)),
            }
      )
    );
    setChecklistItemCompleted(taskId, itemId, isCompleted);
  }, []);

  const completeTask = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "completed", subtitle: "Completed" } : t)));
    await markTaskCompleted(taskId);
  }, []);

  // Memoised so consumers only re-render when something they read changes.
  const value = useMemo(
    () => ({
      site,
      tasks,
      tasksLoading,
      refreshTasks,
      setTaskChecklistItem,
      completeTask,
      clockStatus,
      setClockStatus,
      clockInTime,
      setClockInTime,
      pendingClockIn,
      setPendingClockIn,
      pendingClockOut,
      setPendingClockOut,
    }),
    [
      site,
      tasks,
      tasksLoading,
      refreshTasks,
      setTaskChecklistItem,
      completeTask,
      clockStatus,
      clockInTime,
      pendingClockIn,
      pendingClockOut,
    ]
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
