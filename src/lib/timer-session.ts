import { FocusSession } from "@/types/workspace";

export type FocusSessionMode = FocusSession["mode"];

interface CreateFocusSessionInput {
  mode: FocusSessionMode;
  taskId?: string;
  startedAtMs: number;
  endedAtMs: number;
  activeSeconds: number;
  pausedSeconds: number;
  completed: boolean;
}

export function getSessionActiveSeconds(session: Pick<FocusSession, "activeSeconds" | "durationMinutes">) {
  if (Number.isFinite(session.activeSeconds) && session.activeSeconds > 0) {
    return Math.round(session.activeSeconds);
  }
  return Math.max(0, Math.round((session.durationMinutes || 0) * 60));
}

export function getSessionActiveMinutes(session: Pick<FocusSession, "activeSeconds" | "durationMinutes">) {
  const activeSeconds = getSessionActiveSeconds(session);
  return activeSeconds > 0 ? Math.max(1, Math.round(activeSeconds / 60)) : 0;
}

export function createFocusSessionPayload({
  mode,
  taskId,
  startedAtMs,
  endedAtMs,
  activeSeconds,
  pausedSeconds,
  completed,
}: CreateFocusSessionInput): Omit<FocusSession, "id"> {
  const safeStartedAtMs = Number.isFinite(startedAtMs) ? startedAtMs : endedAtMs;
  const safeEndedAtMs = Number.isFinite(endedAtMs) && endedAtMs >= safeStartedAtMs ? endedAtMs : safeStartedAtMs;
  const wallClockSeconds = Math.max(1, Math.floor((safeEndedAtMs - safeStartedAtMs) / 1000));
  const safePausedSeconds = Math.max(0, Math.min(wallClockSeconds, Math.floor(pausedSeconds)));
  const safeActiveSeconds = Math.max(1, Math.min(wallClockSeconds, Math.round(activeSeconds)));

  return {
    mode,
    taskId,
    startedAt: new Date(safeStartedAtMs).toISOString(),
    endedAt: new Date(safeEndedAtMs).toISOString(),
    activeSeconds: safeActiveSeconds,
    wallClockSeconds,
    pausedSeconds: safePausedSeconds,
    durationMinutes: Math.max(1, Math.round(safeActiveSeconds / 60)),
    completed,
    createdAt: new Date().toISOString(),
  };
}
