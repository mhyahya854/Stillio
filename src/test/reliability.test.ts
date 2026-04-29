import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { WORKSPACE_STORAGE_KEY, LEGACY_WORKSPACE_KEY, LEGACY_LIFEATIO_WORKSPACE_KEY } from "@/lib/storage-keys";
import { createWorkspaceBackup, validateAndImportWorkspace } from "@/lib/workspace-import-export";
import { createDefaultWorkspaceState } from "@/lib/workspace-data";

// Mock toast to avoid actual UI side effects
vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

describe("useLocalStorage reliability", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  it("handles quota exceeded error gracefully", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    const { result } = renderHook(() => useLocalStorage("test-key", { foo: "bar" }));

    act(() => {
      result.current.setValue({ foo: "baz" });
    });

    // Save is debounced
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toContain("Local storage is full");
    expect(setItemSpy).toHaveBeenCalled();
    
    // Check if toast was called (import { toast } from "@/hooks/use-toast")
    const { toast } = await import("@/hooks/use-toast");
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Local storage is full",
    }));
  });

  it("indicates saving status during debounce", async () => {
    const { result } = renderHook(() => useLocalStorage("test-key", { foo: "bar" }));

    act(() => {
      result.current.setValue({ foo: "baz" });
    });

    expect(result.current.status).toBe("saving");

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current.status).toBe("saved");
    expect(result.current.lastSavedAt).toBeDefined();
    expect(localStorage.getItem("test-key")).toContain("baz");
  });

  it("persists the initial value when storage starts empty", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", { foo: "bar" }));

    expect(localStorage.getItem("test-key")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current.status).toBe("saved");
    expect(localStorage.getItem("test-key")).toContain("bar");
  });

  it("migrates legacy workspace key to new Stillio key", () => {
    const legacy = { tasks: [{ id: "t1", title: "hi" }], notes: [] };
    localStorage.setItem(LEGACY_WORKSPACE_KEY, JSON.stringify(legacy));

    const { result } = renderHook(() => useLocalStorage(WORKSPACE_STORAGE_KEY, createDefaultWorkspaceState()));

    // The hook should load legacy data as the initial value
    expect(result.current.value).toEqual(legacy);

    // Advance timers so the debounced save writes the new key
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(localStorage.getItem(WORKSPACE_STORAGE_KEY)).toContain('"tasks"');
    // Legacy key should remain (migration preserves old data until user clears)
    expect(localStorage.getItem(LEGACY_WORKSPACE_KEY)).not.toBeNull();
  });

  it("migrates legacy Lifeatio workspace key to new Stillio key", () => {
    const legacy = { tasks: [{ id: "t1", title: "hello" }], notes: [] };
    localStorage.setItem(LEGACY_LIFEATIO_WORKSPACE_KEY, JSON.stringify(legacy));

    const { result } = renderHook(() => useLocalStorage(WORKSPACE_STORAGE_KEY, createDefaultWorkspaceState()));

    // The hook should load legacy data as the initial value
    expect(result.current.value).toEqual(legacy);

    // Advance timers so the debounced save writes the new key
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(localStorage.getItem(WORKSPACE_STORAGE_KEY)).toContain('"tasks"');
    // Legacy key should remain (migration preserves old data until user clears)
    expect(localStorage.getItem(LEGACY_LIFEATIO_WORKSPACE_KEY)).not.toBeNull();
  });

  it("loads cross-tab storage updates for the same key", async () => {
    const { result } = renderHook(() => useLocalStorage("test-key", { foo: "bar" }));
    const nextRaw = JSON.stringify({ foo: "from-tab" });

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "test-key",
          newValue: nextRaw,
          storageArea: localStorage,
        }),
      );
    });

    expect(result.current.value.foo).toBe("from-tab");
    const { toast } = await import("@/hooks/use-toast");
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Workspace updated from another tab",
    }));
  });
});

describe("workspace import/export reliability", () => {
  it("rejects invalid JSON", async () => {
    const file = new File(["not json"], "backup.json", { type: "application/json" });
    const result = await validateAndImportWorkspace(file);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid JSON file");
  });

  it("rejects invalid workspace shape", async () => {
    const file = new File([JSON.stringify({ wrong: "shape" })], "backup.json", { type: "application/json" });
    const result = await validateAndImportWorkspace(file);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("valid workspace backup");
  });

  it("accepts versioned workspace backups and returns a preview summary", async () => {
    const backup = createWorkspaceBackup(createDefaultWorkspaceState());
    const file = new File([JSON.stringify(backup)], "backup.json", { type: "application/json" });
    const result = await validateAndImportWorkspace(file);

    expect(result.success).toBe(true);
    expect(result.summary?.tasks).toBe(backup.workspace.tasks.length);
    expect(result.summary?.notes).toBe(backup.workspace.notes.length);
    expect(result.summary?.events).toBe(backup.workspace.calendarEvents.length);
    expect(result.summary?.sessions).toBe(backup.workspace.focusSessions.length);
  });

  it("accepts legacy Lifeatio backups during import", async () => {
    const backup = { ...createWorkspaceBackup(createDefaultWorkspaceState()), app: "Lifeatio Clone" };
    const file = new File([JSON.stringify(backup)], "backup.json", { type: "application/json" });
    const result = await validateAndImportWorkspace(file);

    expect(result.success).toBe(true);
    expect(result.data?.tasks.length).toBeGreaterThan(0);
  });

  it("rejects unsupported backup versions", async () => {
    const backup = { ...createWorkspaceBackup(createDefaultWorkspaceState()), schemaVersion: 999 };
    const file = new File([JSON.stringify(backup)], "backup.json", { type: "application/json" });
    const result = await validateAndImportWorkspace(file);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Backup version is unsupported");
  });
});
