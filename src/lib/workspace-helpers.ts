import { FocusSession, Task } from "@/types/workspace";
import { getSessionActiveMinutes } from "@/lib/timer-session";

export function reorderTasks(tasks: Task[], activeId: string, overId: string) {
  const sorted = [...tasks].sort((a, b) => a.order - b.order);
  const fromIndex = sorted.findIndex((task) => task.id === activeId);
  const toIndex = sorted.findIndex((task) => task.id === overId);

  if (fromIndex === -1 || toIndex === -1) return tasks;

  const [moved] = sorted.splice(fromIndex, 1);
  sorted.splice(toIndex, 0, moved);

  return sorted.map((task, index) => ({ ...task, order: index }));
}

export function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getFocusTotals(sessions: FocusSession[], now = new Date()) {
  const todayKey = toLocalDateKey(now);
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
  const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  return sessions.reduce(
    (acc, session) => {
      const sessionDate = new Date(session.startedAt);
      if (!Number.isNaN(sessionDate.getTime())) {
        const sessionKey = toLocalDateKey(sessionDate);
        const durationMinutes = getSessionActiveMinutes(session);
        if (sessionKey === todayKey) acc.today += durationMinutes;
        if (sessionDate >= weekStart && sessionDate <= weekEnd) acc.week += durationMinutes;
      }
      acc.completed += Number(session.completed);
      return acc;
    },
    { today: 0, week: 0, completed: 0 },
  );
}

export function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatSeconds(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
