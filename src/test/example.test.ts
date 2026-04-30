import { describe, expect, it } from "vitest";
import { formatMinutes, formatSeconds, formatTimer, getFocusTotals, reorderTasks } from "@/lib/workspace-helpers";
import { FocusSession, Task } from "@/types/workspace";

describe("workspace helpers", () => {
  it("reorders tasks deterministically", () => {
    const tasks: Task[] = [
      { id: "a", title: "A", completed: false, priority: "low", tag: "Study", dueToday: true, createdAt: "2026-04-23T08:00:00.000Z", updatedAt: "2026-04-23T08:00:00.000Z", order: 0 },
      { id: "b", title: "B", completed: false, priority: "low", tag: "Study", dueToday: true, createdAt: "2026-04-23T08:00:00.000Z", updatedAt: "2026-04-23T08:00:00.000Z", order: 1 },
      { id: "c", title: "C", completed: false, priority: "low", tag: "Study", dueToday: true, createdAt: "2026-04-23T08:00:00.000Z", updatedAt: "2026-04-23T08:00:00.000Z", order: 2 },
    ];

    const reordered = reorderTasks(tasks, "c", "a");
    expect(reordered.map((task) => task.id)).toEqual(["c", "a", "b"]);
    expect(reordered.map((task) => task.order)).toEqual([0, 1, 2]);
  });

  it("computes focus totals for today and the rolling week", () => {
    const now = new Date("2026-04-23T12:00:00.000Z");
    const sessions: FocusSession[] = [
      {
        id: "1",
        mode: "pomodoro",
        startedAt: "2026-04-23T08:00:00.000Z",
        endedAt: "2026-04-23T08:25:00.000Z",
        activeSeconds: 25 * 60,
        wallClockSeconds: 25 * 60,
        pausedSeconds: 0,
        durationMinutes: 25,
        completed: true,
        createdAt: "2026-04-23T08:25:00.000Z",
      },
      {
        id: "2",
        mode: "countdown",
        startedAt: "2026-04-21T10:00:00.000Z",
        endedAt: "2026-04-21T10:45:00.000Z",
        activeSeconds: 45 * 60,
        wallClockSeconds: 45 * 60,
        pausedSeconds: 0,
        durationMinutes: 45,
        completed: true,
        createdAt: "2026-04-21T10:45:00.000Z",
      },
      {
        id: "3",
        mode: "pomodoro",
        startedAt: "2026-04-12T10:00:00.000Z",
        endedAt: "2026-04-12T10:25:00.000Z",
        activeSeconds: 25 * 60,
        wallClockSeconds: 25 * 60,
        pausedSeconds: 0,
        durationMinutes: 25,
        completed: true,
        createdAt: "2026-04-12T10:25:00.000Z",
      },
    ];

    expect(getFocusTotals(sessions, now)).toEqual({ today: 25, week: 70, completed: 3 });
  });

  it("formats minute totals for compact UI labels", () => {
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(95)).toBe("1h 35m");
  });

  it("clamps invalid timer display values", () => {
    expect(formatTimer(-1)).toBe("00:00");
    expect(formatTimer(Number.NaN)).toBe("00:00");
    expect(formatSeconds(Number.NaN)).toBe("0s");
  });
});
