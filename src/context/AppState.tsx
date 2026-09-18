import { createContext, useContext, useState, ReactNode } from "react";
import { Task, initialTasks } from "../lib/mockData";

type ClockStatus = "clocked_out" | "clocked_in";

type AppStateValue = {
  tasks: Task[];
  setTaskChecklistItem: (taskId: string, itemId: string, isCompleted: boolean) => void;
  clockStatus: ClockStatus;
  setClockStatus: (s: ClockStatus) => void;
  clockInTime: string | null;
  setClockInTime: (t: string | null) => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [clockStatus, setClockStatus] = useState<ClockStatus>("clocked_out");
  const [clockInTime, setClockInTime] = useState<string | null>(null);

  function setTaskChecklistItem(taskId: string, itemId: string, isCompleted: boolean) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id !== taskId
          ? t
          : { ...t, checklist: t.checklist.map((c) => (c.id === itemId ? { ...c, isCompleted } : c)) }
      )
    );
  }

  return (
    <AppStateContext.Provider
      value={{ tasks, setTaskChecklistItem, clockStatus, setClockStatus, clockInTime, setClockInTime }}
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
