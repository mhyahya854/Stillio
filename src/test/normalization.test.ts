import { describe, expect, it } from "vitest";
import { normalizeDesktopUiState } from "@/lib/local-persistence-service";
import { createDefaultWorkspaceState, normalizeWorkspaceState } from "@/lib/workspace-data";

describe("workspace normalization", () => {
  it("preserves intentionally empty collections from imported backups", () => {
    const input = {
      ...createDefaultWorkspaceState(),
      tasks: [],
      notes: [],
      calendarEvents: [],
      audioTracks: [],
      audioPresets: [],
    };

    const normalized = normalizeWorkspaceState(input);
    expect(normalized.tasks).toEqual([]);
    expect(normalized.notes).toEqual([]);
    expect(normalized.calendarEvents).toEqual([]);
    expect(normalized.audioTracks).toEqual([]);
    expect(normalized.audioPresets).toEqual([]);
    expect(normalized.activePresetId).toBeUndefined();
  });

  it("repairs invalid active ids against normalized collections", () => {
    const input = {
      ...createDefaultWorkspaceState(),
      activeSpaceId: "missing-space",
      activePresetId: "missing-preset",
      settings: {
        ...createDefaultWorkspaceState().settings,
        startupSpaceId: "missing-space",
      },
    };

    const normalized = normalizeWorkspaceState(input);
    expect(normalized.spaces.some((space) => space.id === normalized.activeSpaceId)).toBe(true);
    expect(normalized.settings.startupSpaceId).toBe(normalized.activeSpaceId);
    expect(normalized.audioPresets.some((preset) => preset.id === normalized.activePresetId)).toBe(true);
  });

  it("normalizes malformed event and session data from imports", () => {
    const input = {
      ...createDefaultWorkspaceState(),
      calendarEvents: [
        {
          id: "event-bad",
          title: "Invalid Event",
          date: "2026-02-31",
          time: "99:99",
          durationMinutes: -10,
          category: "bad-category",
        },
      ],
      focusSessions: [
        {
          id: "",
          mode: "invalid",
          startedAt: "bad-date",
          endedAt: "also-bad",
          durationMinutes: 0,
          completed: "true",
        },
      ],
    };

    const normalized = normalizeWorkspaceState(input as unknown);
    expect(normalized.calendarEvents[0].time).toBe("09:00");
    expect(normalized.calendarEvents[0].durationMinutes).toBeGreaterThanOrEqual(15);
    expect(normalized.calendarEvents[0].category).toBe("focus");

    expect(normalized.focusSessions[0].id).toBe("session-0");
    expect(normalized.focusSessions[0].mode).toBe("pomodoro");
    expect(normalized.focusSessions[0].durationMinutes).toBeGreaterThanOrEqual(1);
    expect(Number.isNaN(new Date(normalized.focusSessions[0].startedAt).getTime())).toBe(false);
  });

  it("drops preset layers that point to missing audio tracks", () => {
    const input = {
      ...createDefaultWorkspaceState(),
      audioPresets: [
        {
          id: "preset-custom",
          name: "Custom",
          trackLevels: {
            rain: 55,
            missing: 80,
          },
        },
      ],
    };

    const normalized = normalizeWorkspaceState(input);
    expect(normalized.audioPresets[0].trackLevels).toEqual({ rain: 55 });
  });
});

describe("desktop ui normalization", () => {
  it("retains valid zero coordinates and clamps panel dimensions", () => {
    const normalized = normalizeDesktopUiState({
      panels: {
        notes: {
          open: true,
          collapsed: false,
          minimized: false,
          docked: false,
          size: { width: 120, height: 90 },
          position: { x: 0, y: 0 },
          zIndex: 0,
        } as unknown,
      },
      scene: {
        mode: "docked",
        collapsed: false,
        size: { width: 300, height: 100 },
        position: { x: 0, y: 0 },
      } as unknown,
    });

    expect(normalized.panels.notes.position).toEqual({ x: 0, y: 0 });
    expect(normalized.panels.notes.size.width).toBeGreaterThanOrEqual(280);
    expect(normalized.panels.notes.size.height).toBeGreaterThanOrEqual(180);
    expect(normalized.panels.notes.zIndex).toBeGreaterThanOrEqual(1);
    expect(normalized.scene.position).toEqual({ x: 0, y: 0 });
    expect(normalized.scene.size.width).toBeGreaterThanOrEqual(360);
    expect(normalized.scene.size.height).toBeGreaterThanOrEqual(210);
  });

  it("clamps restored panel positions into the visible viewport", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 800 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });

    const normalized = normalizeDesktopUiState({
      panels: {
        notes: {
          open: true,
          collapsed: false,
          minimized: false,
          docked: false,
          size: { width: 420, height: 300 },
          position: { x: 4000, y: 3000 },
          zIndex: 2,
        },
      },
      scene: {
        mode: "docked",
        collapsed: false,
        size: { width: 560, height: 320 },
        position: { x: 3000, y: 2000 },
      },
    });

    expect(normalized.panels.notes.position.x).toBeLessThanOrEqual(640);
    expect(normalized.panels.notes.position.y).toBeLessThanOrEqual(528);
    expect(normalized.scene.position.x).toBeLessThanOrEqual(640);
    expect(normalized.scene.position.y).toBeLessThanOrEqual(528);
  });
});
