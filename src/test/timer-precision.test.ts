import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createFocusSessionPayload } from "@/lib/timer-session";

describe("timer precision logic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates correct deltas regardless of interval drift", () => {
    let lastTick = Date.now();
    let elapsedSeconds = 0;
    let timerValue = 1500; // 25 mins

    const tick = () => {
      const now = Date.now();
      const deltaMs = now - lastTick;
      const deltaSec = Math.floor(deltaMs / 1000);

      if (deltaSec >= 1) {
        lastTick += deltaSec * 1000;
        elapsedSeconds += deltaSec;
        timerValue -= deltaSec;
      }
    };

    // Fast forward 5.5 seconds at once (simulating throttling)
    vi.advanceTimersByTime(5500);
    tick();

    expect(elapsedSeconds).toBe(5);
    expect(timerValue).toBe(1495);
    
    // Check remainder
    const now = Date.now();
    expect(now - lastTick).toBe(500); 

    // Fast forward another 0.6 seconds
    vi.advanceTimersByTime(600);
    tick();

    expect(elapsedSeconds).toBe(6);
    expect(timerValue).toBe(1494);
    expect(Date.now() - lastTick).toBe(100);
  });

  it("separates active focus time from paused wall-clock time", () => {
    const startedAtMs = Date.parse("2026-04-24T10:00:00.000Z");
    const endedAtMs = Date.parse("2026-04-24T10:32:00.000Z");

    const session = createFocusSessionPayload({
      mode: "pomodoro",
      taskId: "task-1",
      startedAtMs,
      endedAtMs,
      activeSeconds: 25 * 60,
      pausedSeconds: 7 * 60,
      completed: true,
    });

    expect(session.durationMinutes).toBe(25);
    expect(session.activeSeconds).toBe(25 * 60);
    expect(session.wallClockSeconds).toBe(32 * 60);
    expect(session.pausedSeconds).toBe(7 * 60);
  });
});
