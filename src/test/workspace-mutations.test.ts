import { describe, expect, it } from "vitest";
import { createDefaultWorkspaceState } from "@/lib/workspace-data";
import {
  addCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  addFocusSession,
  deleteFocusSession,
  applyPreset,
  createTask,
  deleteTask,
  moveTask,
  selectSpace,
  setTrackVolume,
  toggleTask,
  toggleNotePin,
  updateTaskTitle,
} from "@/lib/workspace-mutations";

describe("workspace mutations", () => {
  it("updates active space and preserves recent markers", () => {
    const state = createDefaultWorkspaceState();
    const target = state.spaces.find((space) => !space.recent)?.id ?? state.spaces[0].id;

    const next = selectSpace(state, target);
    expect(next.activeSpaceId).toBe(target);
    expect(next.spaces.find((space) => space.id === target)?.recent).toBe(true);
  });

  it("manages calendar events (CRUD)", () => {
    const initial = createDefaultWorkspaceState();
    const withEvent = addCalendarEvent(initial, {
      title: "Initial event",
      date: "2026-05-01",
      time: "10:00",
      durationMinutes: 60,
      category: "focus",
    });
    const created = withEvent.calendarEvents[withEvent.calendarEvents.length - 1];
    
    const updated = updateCalendarEvent(withEvent, created.id, {
      title: "Updated event",
      durationMinutes: 0,
      category: "bad-category" as never,
      description: "   ",
    });
    const deleted = deleteCalendarEvent(updated, created.id);

    expect(withEvent.calendarEvents.length).toBe(initial.calendarEvents.length + 1);
    expect(updated.calendarEvents.find(e => e.id === created.id)?.title).toBe("Updated event");
    expect(updated.calendarEvents.find(e => e.id === created.id)?.durationMinutes).toBe(15);
    expect(updated.calendarEvents.find(e => e.id === created.id)?.category).toBe("focus");
    expect(updated.calendarEvents.find(e => e.id === created.id)?.description).toBeUndefined();
    expect(deleted.calendarEvents.find(e => e.id === created.id)).toBeUndefined();
  });

  it("manages focus sessions", () => {
    const initial = createDefaultWorkspaceState();
    const withSession = addFocusSession(initial, {
      mode: "pomodoro",
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      activeSeconds: 25 * 60,
      wallClockSeconds: 32 * 60,
      pausedSeconds: 7 * 60,
      durationMinutes: 25,
      completed: true,
      createdAt: new Date().toISOString(),
    });
    const created = withSession.focusSessions[withSession.focusSessions.length - 1];
    
    const deleted = deleteFocusSession(withSession, created.id);

    expect(withSession.focusSessions.length).toBe(initial.focusSessions.length + 1);
    expect(created.activeSeconds).toBe(25 * 60);
    expect(created.wallClockSeconds).toBe(32 * 60);
    expect(created.pausedSeconds).toBe(7 * 60);
    expect(deleted.focusSessions.find(s => s.id === created.id)).toBeUndefined();
    expect(deleted.tasks.every((task) => !(task.focusSessionIds ?? []).includes(created.id))).toBe(true);
  });

  it("creates, updates, moves, toggles, and deletes tasks deterministically", () => {
    const initial = createDefaultWorkspaceState();
    const unchanged = createTask(initial, "   ");
    const created = createTask(initial, "Mock task");
    const newTask = created.tasks[created.tasks.length - 1];

    const renamed = updateTaskTitle(created, newTask.id, "Renamed task");
    const toggled = toggleTask(renamed, newTask.id);
    const moved = moveTask(toggled, newTask.id, toggled.tasks[0].id);
    const deleted = deleteTask(moved, newTask.id);

    expect(unchanged.tasks.length).toBe(initial.tasks.length);
    expect(renamed.tasks.find((task) => task.id === newTask.id)?.title).toBe("Renamed task");
    expect(toggled.tasks.find((task) => task.id === newTask.id)?.completed).toBe(true);
    expect(moved.tasks[0].id).toBe(newTask.id);
    expect(deleted.tasks.some((task) => task.id === newTask.id)).toBe(false);
    expect(deleted.tasks.map((task) => task.order)).toEqual(deleted.tasks.map((_task, index) => index));
  });

  it("clears the focused task when it is completed or deleted", () => {
    const initial = createDefaultWorkspaceState();
    const targetId = initial.tasks[0].id;

    const toggled = toggleTask({ ...initial, focusTaskId: targetId }, targetId);
    const deleted = deleteTask({ ...initial, focusTaskId: targetId }, targetId);

    expect(toggled.focusTaskId).toBeUndefined();
    expect(deleted.focusTaskId).toBeUndefined();
  });

  it("updates note timestamps when pin state changes", () => {
    const initial = createDefaultWorkspaceState();
    const target = initial.notes[0];
    const next = toggleNotePin(initial, target.id);

    expect(next.notes.find((note) => note.id === target.id)?.pinned).toBe(!target.pinned);
    expect(next.notes.find((note) => note.id === target.id)?.updatedAt).not.toBe(target.updatedAt);
  });

  it("applies audio presets and volume rules consistently", () => {
    const initial = createDefaultWorkspaceState();
    const presetId = initial.audioPresets[0].id;
    const applied = applyPreset(initial, presetId);
    const raised = setTrackVolume(applied, applied.audioTracks[0].id, 150);

    expect(applied.activePresetId).toBe(presetId);
    const zeroed = setTrackVolume(applied, applied.audioTracks[0].id, 0);
    expect(raised.audioTracks.find((track) => track.id === applied.audioTracks[0].id)?.volume).toBe(100);
    expect(raised.audioTracks.find((track) => track.id === applied.audioTracks[0].id)?.active).toBe(true);
    expect(zeroed.audioTracks.find((track) => track.id === applied.audioTracks[0].id)?.active).toBe(false);
  });
});
