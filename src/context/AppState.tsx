import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { fetchMyTasksToday, setChecklistItemCompleted, markTaskCompleted, type Task } from "../lib/tasks";
import type { AssignedSite } from "../lib/attendance";

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

export type PendingClockOut = {
  photoBlob: Blob | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
};

type AppStateValue = {
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
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [clockStatus, setClockStatus] = useState<ClockStatus>("clocked_out");
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [pendingClockIn, setPendingClockIn] = useState<PendingClockIn | null>(null);
  const [pendingClockOut, setPendingClockOut] = useState<PendingClockOut | null>(null);

  const refreshTasks = useCallback(async () => {
    if (!profile) {
      setTasks([]);
      setTasksLoading(false);
      return;
    }
    setTasksLoading(true);
    const fetched = await fetchMyTasksToday(profile.id);
    setTasks(fetched);
    setTasksLoading(false);
  }, [profile]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  function setTaskChecklistItem(taskId: string, itemId: string, isCompleted: boolean) {
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
  }

  async function completeTask(taskId: string) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "completed", subtitle: "Completed" } : t)));
    await markTaskCompleted(taskId);
  }

  return (
    <AppStateContext.Provider
      value={{
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
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
