import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, BarChart3, CalendarDays, CheckCircle2, CloudOff, Loader2, NotebookPen, Settings2, SlidersHorizontal, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingPanel } from "@/components/workspace-desktop/FloatingPanel";
import { DockBar } from "@/components/workspace-desktop/DockBar";
import { ImmersiveSceneViewport } from "@/components/workspace-desktop/ImmersiveSceneViewport";
import { PanelLauncher } from "@/components/workspace-desktop/PanelLauncher";
import { WorkspaceShell } from "@/components/workspace-desktop/WorkspaceShell";
import { AudioPanel, CalendarPanel, NotesPanel, SessionPanel, SettingsPanel, TasksPanel, TimerPanel } from "@/components/workspace-desktop/DesktopPanels";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useAmbientAudio } from "@/hooks/use-ambient-audio";
import { createDefaultWorkspaceState, normalizeWorkspaceState } from "@/lib/workspace-data";
import { createDefaultDesktopUiState, normalizeDesktopUiState } from "@/lib/local-persistence-service";
import { DESKTOP_UI_STORAGE_KEY, MANAGED_LOCAL_STORAGE_KEYS, ONBOARDING_STORAGE_KEY, PRE_IMPORT_BACKUP_STORAGE_KEY, WORKSPACE_STORAGE_KEY } from "@/lib/storage-keys";
import { formatMinutes, getFocusTotals } from "@/lib/workspace-helpers";
import { createFocusSessionPayload } from "@/lib/timer-session";
import { createWorkspaceBackup, exportWorkspace, validateAndImportWorkspace } from "@/lib/workspace-import-export";
import {
  addCalendarEvent,
  addFocusSession,
  applyPreset,
  changeTaskPriority,
  createNote,
  createTask,
  deleteCalendarEvent,
  deleteFocusSession,
  deleteNote,
  deleteTask,
  moveTask,
  renameNote,
  saveCurrentPreset,
  selectNote,
  selectSpace,
  setFocusTask,
  setTrackVolume,
  toggleNotePin,
  toggleTask,
  toggleTrack,
  updateCalendarEvent,
  updateNoteContent,
  updateTaskDueDate,
  updateTaskTitle,
} from "@/lib/workspace-mutations";
import { DesktopPanelId, DesktopPanelState } from "@/types/desktop";
import { CalendarEvent, FocusSession, TaskPriority, UserSettings } from "@/types/workspace";

const panelDefinitions = [
  { id: "notes", label: "Notes", subtitle: "Session writing", icon: NotebookPen },
  { id: "calendar", label: "Calendar", subtitle: "Monthly and upcoming", icon: CalendarDays },
  { id: "tasks", label: "Tasks", subtitle: "Queue and priorities", icon: SlidersHorizontal },
  { id: "timer", label: "Timer", subtitle: "Pomodoro and countdown", icon: TimerReset },
  { id: "audio", label: "Audio", subtitle: "Ambient mixer", icon: AudioLines },
  { id: "sessions", label: "Session", subtitle: "Focus stats", icon: BarChart3 },
  { id: "settings", label: "Settings", subtitle: "Local preferences", icon: Settings2 },
] as const satisfies { id: DesktopPanelId; label: string; subtitle: string; icon: typeof NotebookPen }[];

const timerPresets = {
  pomodoro: (settings: UserSettings) => settings.pomodoroMinutes * 60,
  countdown: (settings: UserSettings) => settings.countdownMinutes * 60,
  stopwatch: () => 0,
};

function getTimerDuration(mode: "pomodoro" | "countdown" | "stopwatch", settings: UserSettings) {
  return timerPresets[mode](settings);
}

function getPomodoroPhaseDuration(phase: "focus" | "short-break" | "long-break", settings: UserSettings) {
  if (phase === "short-break") return settings.shortBreakMinutes * 60;
  if (phase === "long-break") return settings.longBreakMinutes * 60;
  return settings.pomodoroMinutes * 60;
}

const Index = () => {
  const workspaceStorage = useLocalStorage(WORKSPACE_STORAGE_KEY, createDefaultWorkspaceState(), {
    deserialize: normalizeWorkspaceState,
    externalUpdateMessage: "Workspace data was refreshed from another tab.",
  });
  const desktopUiStorage = useLocalStorage(DESKTOP_UI_STORAGE_KEY, createDefaultDesktopUiState(), {
    deserialize: normalizeDesktopUiState,
    silent: true,
  });
  const workspace = workspaceStorage.value;
  const setWorkspace = workspaceStorage.setValue;
  const desktopUi = desktopUiStorage.value;
  const setDesktopUi = desktopUiStorage.setValue;
  const workspaceSaveStatus = workspaceStorage.status;
  const uiSaveStatus = desktopUiStorage.status;
  const { toast } = useToast();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());
  const [timerMode, setTimerMode] = useState<"pomodoro" | "countdown" | "stopwatch">("pomodoro");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerValue, setTimerValue] = useState(getTimerDuration("pomodoro", workspace.settings));
  const [pomodoroPhase, setPomodoroPhase] = useState<"focus" | "short-break" | "long-break">("focus");
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [timerRuntimeStats, setTimerRuntimeStats] = useState({ activeSeconds: 0, wallClockSeconds: 0, pausedSeconds: 0 });
  const [focusOnlyMode, setFocusOnlyMode] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) !== "true";
    } catch {
      return true;
    }
  });
  const [clockLabel, setClockLabel] = useState(() => new Intl.DateTimeFormat([], { hour: "2-digit", minute: "2-digit" }).format(new Date()));
  const timerWallStartRef = useRef<number | null>(null);
  const timerActiveSecondsRef = useRef(0);
  const timerPausedMsRef = useRef(0);
  const timerPauseStartedAtRef = useRef<number | null>(null);
  const timerLastTickRef = useRef<number | null>(null);
  const startupSpaceAppliedRef = useRef(false);
  const compact = useIsMobile();

  const resetTimerSessionRefs = useCallback(() => {
    timerWallStartRef.current = null;
    timerActiveSecondsRef.current = 0;
    timerPausedMsRef.current = 0;
    timerPauseStartedAtRef.current = null;
    timerLastTickRef.current = null;
    setTimerRuntimeStats({ activeSeconds: 0, wallClockSeconds: 0, pausedSeconds: 0 });
  }, []);

  const activeSpace = useMemo(
    () => workspace.spaces.find((space) => space.id === workspace.activeSpaceId) ?? workspace.spaces[0],
    [workspace.activeSpaceId, workspace.spaces],
  );
  const currentTask = useMemo(() => {
    if (workspace.focusTaskId) {
      const focus = workspace.tasks.find((t) => t.id === workspace.focusTaskId);
      if (focus && !focus.completed) return focus;
    }
    return workspace.tasks.filter((task) => !task.completed).sort((a, b) => a.order - b.order)[0];
  }, [workspace.focusTaskId, workspace.tasks]);
  const focusTotals = useMemo(() => getFocusTotals(workspace.focusSessions), [workspace.focusSessions]);
  const ambientAudio = useAmbientAudio(workspace.audioTracks, {
    masterVolume: workspace.settings.audioMasterVolume,
    muted: workspace.settings.audioMuted,
  });

  useEffect(() => {
    if (startupSpaceAppliedRef.current) return;
    startupSpaceAppliedRef.current = true;

    if (workspace.activeSpaceId !== workspace.settings.startupSpaceId) {
      setWorkspace((current) => selectSpace(current, current.settings.startupSpaceId));
    }
  }, [setWorkspace, workspace.activeSpaceId, workspace.settings.startupSpaceId]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    const updateClock = () => setClockLabel(new Intl.DateTimeFormat([], { hour: "2-digit", minute: "2-digit" }).format(new Date()));
    const interval = window.setInterval(updateClock, 15000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timerMode !== "pomodoro") {
      setPomodoroPhase("focus");
    }
    
    if (timerMode === "stopwatch") {
      setTimerValue(0);
      if (!timerRunning && timerWallStartRef.current === null) resetTimerSessionRefs();
      return;
    }
    
    if (!timerRunning && timerWallStartRef.current === null) {
      if (timerMode === "pomodoro") {
        setTimerValue(getPomodoroPhaseDuration(pomodoroPhase, workspace.settings));
      } else {
        setTimerValue(getTimerDuration(timerMode, workspace.settings));
      }
      resetTimerSessionRefs();
    }
  }, [pomodoroPhase, resetTimerSessionRefs, timerMode, timerRunning, workspace.settings]);

  useEffect(() => {
    if (!timerRunning) {
      timerLastTickRef.current = null;
      return;
    }

    timerLastTickRef.current = Date.now();
    const interval = window.setInterval(() => {
      const now = Date.now();
      const deltaMs = now - (timerLastTickRef.current ?? now);
      const deltaSec = Math.floor(deltaMs / 1000);

      if (deltaSec < 1) return;
      
      timerLastTickRef.current = (timerLastTickRef.current ?? now) + deltaSec * 1000;
      setTimerValue((current) => {
        const appliedDelta = timerMode === "stopwatch" ? deltaSec : Math.min(deltaSec, Math.max(0, current));
        timerActiveSecondsRef.current += appliedDelta;
        const startedAtMs = timerWallStartRef.current ?? now;
        setTimerRuntimeStats({
          activeSeconds: timerActiveSecondsRef.current,
          wallClockSeconds: Math.max(0, Math.floor((now - startedAtMs) / 1000)),
          pausedSeconds: Math.max(0, Math.floor(timerPausedMsRef.current / 1000)),
        });

        if (timerMode === "stopwatch") {
          return current + appliedDelta;
        }

        const nextValue = current - appliedDelta;
        if (nextValue <= 0) {
          window.clearInterval(interval);
          setTimerRunning(false);

          const endedAtMs = Date.now();
          const startedAtMs = timerWallStartRef.current ?? endedAtMs - timerActiveSecondsRef.current * 1000;
          const pausedSeconds = Math.floor(timerPausedMsRef.current / 1000);

          if (timerMode !== "pomodoro" || pomodoroPhase === "focus") {
            const session = createFocusSessionPayload({
              mode: timerMode,
              taskId: currentTask?.id,
              startedAtMs,
              endedAtMs,
              activeSeconds: timerActiveSecondsRef.current,
              pausedSeconds,
              completed: true,
            });
            setWorkspace((previous) => addFocusSession(previous, session));
          }

          // Cycle Pomodoro Phases
          if (timerMode === "pomodoro") {
            if (pomodoroPhase === "focus") {
              const nextCount = pomodoroCount + 1;
              setPomodoroCount(nextCount);
              if (nextCount % 4 === 0) {
                setPomodoroPhase("long-break");
              } else {
                setPomodoroPhase("short-break");
              }
            } else {
              setPomodoroPhase("focus");
            }
          }

          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Timer Finished", {
              body: timerMode === "pomodoro" ? `Phase ${pomodoroPhase} completed.` : "Your timer has finished.",
            });
          } else {
            toast({
              title: "Timer finished",
              description: timerMode === "pomodoro" ? `Phase ${pomodoroPhase} completed.` : "Your timer has finished.",
            });
          }

          resetTimerSessionRefs();
          return 0;
        }

        return nextValue;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [currentTask?.id, pomodoroCount, pomodoroPhase, resetTimerSessionRefs, setWorkspace, timerMode, timerRunning, toast]);

  const updateWorkspace = useCallback(
    (updater: (current: ReturnType<typeof createDefaultWorkspaceState>) => ReturnType<typeof createDefaultWorkspaceState>) => {
      setWorkspace((current) => updater(current));
    },
    [setWorkspace],
  );

  const updatePanel = useCallback(
    (id: DesktopPanelId, patch: Partial<DesktopPanelState>) => {
      setDesktopUi((current) => {
        const panel = current.panels[id];
        return {
          ...current,
          panels: {
            ...current.panels,
            [id]: {
              ...panel,
              ...patch,
              size: patch.size ? { ...panel.size, ...patch.size } : panel.size,
              position: patch.position ? { ...panel.position, ...patch.position } : panel.position,
            },
          },
        };
      });
    },
    [setDesktopUi],
  );

  const openPanel = useCallback(
    (id: DesktopPanelId) => {
      setDesktopUi((current) => {
        const topZ = Math.max(...Object.values(current.panels).map((panel) => panel.zIndex));
        const panel = current.panels[id];

        return {
          ...current,
          activePanelId: id,
          panels: {
            ...current.panels,
            [id]: {
              ...panel,
              open: true,
              minimized: false,
              zIndex: topZ + 1,
            },
          },
        };
      });
    },
    [setDesktopUi],
  );

  const focusPanel = useCallback(
    (id: DesktopPanelId) => {
      setDesktopUi((current) => {
        const topZ = Math.max(...Object.values(current.panels).map((panel) => panel.zIndex));
        return {
          ...current,
          activePanelId: id,
          panels: {
            ...current.panels,
            [id]: {
              ...current.panels[id],
              zIndex: topZ + 1,
            },
          },
        };
      });
    },
    [setDesktopUi],
  );

  const minimizePanel = useCallback(
    (id: DesktopPanelId) => {
      setDesktopUi((current) => ({
        ...current,
        activePanelId: current.activePanelId === id ? undefined : current.activePanelId,
        panels: {
          ...current.panels,
          [id]: {
            ...current.panels[id],
            minimized: true,
          },
        },
      }));
    },
    [setDesktopUi],
  );

  const closePanel = useCallback(
    (id: DesktopPanelId) => {
      setDesktopUi((current) => ({
        ...current,
        activePanelId: current.activePanelId === id ? undefined : current.activePanelId,
        panels: {
          ...current.panels,
          [id]: {
            ...current.panels[id],
            open: false,
            minimized: false,
            collapsed: false,
          },
        },
      }));
    },
    [setDesktopUi],
  );

  const toggleDocked = useCallback(
    (id: DesktopPanelId) => {
      setDesktopUi((current) => ({
        ...current,
        panels: {
          ...current.panels,
          [id]: {
            ...current.panels[id],
            docked: !current.panels[id].docked,
          },
        },
      }));
    },
    [setDesktopUi],
  );

  const togglePanelFromDock = useCallback(
    (id: DesktopPanelId) => {
      setDesktopUi((current) => {
        const panel = current.panels[id];
        if (panel.open && !panel.minimized) {
          return {
            ...current,
            activePanelId: current.activePanelId === id ? undefined : current.activePanelId,
            panels: {
              ...current.panels,
              [id]: {
                ...panel,
                minimized: true,
              },
            },
          };
        }

        const topZ = Math.max(...Object.values(current.panels).map((item) => item.zIndex));
        return {
          ...current,
          activePanelId: id,
          panels: {
            ...current.panels,
            [id]: {
              ...panel,
              open: true,
              minimized: false,
              zIndex: topZ + 1,
            },
          },
        };
      });
    },
    [setDesktopUi],
  );

  const minimizeAllPanels = useCallback(() => {
    setDesktopUi((current) => {
      const panels = Object.fromEntries(
        Object.entries(current.panels).map(([id, panel]) => [
          id,
          {
            ...panel,
            minimized: panel.open ? true : panel.minimized,
          },
        ]),
      ) as typeof current.panels;

      return {
        ...current,
        activePanelId: undefined,
        panels,
      };
    });
  }, [setDesktopUi]);

  useEffect(() => {
    const shortcuts: Record<string, DesktopPanelId> = {
      "1": "notes",
      "2": "calendar",
      "3": "tasks",
      "4": "timer",
      "5": "audio",
      "6": "sessions",
      "7": "settings",
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && shortcuts[event.key]) {
        event.preventDefault();
        openPanel(shortcuts[event.key]);
      }

      if (event.key === "Escape" && desktopUi.activePanelId) {
        event.preventDefault();
        minimizePanel(desktopUi.activePanelId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [desktopUi.activePanelId, minimizePanel, openPanel]);

  const dockedTopById = useMemo(() => {
    const dockedEntries = panelDefinitions
      .map((panel) => panel.id)
      .filter((id) => desktopUi.panels[id].open && !desktopUi.panels[id].minimized && desktopUi.panels[id].docked)
      .sort((a, b) => desktopUi.panels[a].zIndex - desktopUi.panels[b].zIndex);

    const map: Partial<Record<DesktopPanelId, number>> = {};
    dockedEntries.forEach((id, index) => {
      map[id] = 88 + index * 56;
    });
    return map;
  }, [desktopUi.panels]);

  const handleSpaceSelect = (spaceId: string) => {
    updateWorkspace((current) => selectSpace(current, spaceId));
  };

  const handleTaskCreate = (title: string) => {
    updateWorkspace((current) => createTask(current, title));
  };

  const handleTaskToggle = (id: string) => {
    updateWorkspace((current) => toggleTask(current, id));
  };

  const handleTaskPriorityChange = (id: string, priority: TaskPriority) => {
    updateWorkspace((current) => changeTaskPriority(current, id, priority));
  };

  const handleTaskMove = (activeId: string, overId: string) => {
    updateWorkspace((current) => moveTask(current, activeId, overId));
  };

  const handleTaskUpdate = (id: string, title: string) => {
    updateWorkspace((current) => updateTaskTitle(current, id, title));
  };

  const handleTaskDelete = (id: string) => {
    updateWorkspace((current) => deleteTask(current, id));
  };

  const handleNoteUpdate = (id: string, content: string) => {
    updateWorkspace((current) => updateNoteContent(current, id, content));
  };

  const handleNotePin = (id: string) => {
    updateWorkspace((current) => toggleNotePin(current, id));
  };

  const handleNoteCreate = () => {
    updateWorkspace((current) => createNote(current));
  };

  const handleNoteDelete = (id: string) => {
    updateWorkspace((current) => deleteNote(current, id));
  };

  const handleNoteRename = (id: string, title: string) => {
    updateWorkspace((current) => renameNote(current, id, title));
  };

  const handleNoteSelect = (id: string) => {
    updateWorkspace((current) => selectNote(current, id));
  };

  const handleTaskFocusSelect = (id: string | undefined) => {
    updateWorkspace((current) => setFocusTask(current, id));
  };

  const handleTaskDueDateUpdate = (id: string, date: string | undefined) => {
    updateWorkspace((current) => updateTaskDueDate(current, id, date));
  };

  const handleCalendarEventUpdate = (id: string, patch: Partial<CalendarEvent>) => {
    updateWorkspace((current) => updateCalendarEvent(current, id, patch));
  };

  const handleCalendarEventDelete = (id: string) => {
    updateWorkspace((current) => deleteCalendarEvent(current, id));
  };

  const handleFocusSessionAdd = (session: Omit<FocusSession, "id">) => {
    updateWorkspace((current) => addFocusSession(current, session));
  };

  const handleFocusSessionDelete = (id: string) => {
    updateWorkspace((current) => deleteFocusSession(current, id));
  };

  const handleTrackToggle = (id: string) => {
    updateWorkspace((current) => toggleTrack(current, id));
  };

  const handleTrackVolumeChange = (id: string, volume: number) => {
    updateWorkspace((current) => setTrackVolume(current, id, volume));
  };

  const handlePresetApply = (presetId: string) => {
    updateWorkspace((current) => applyPreset(current, presetId));
  };

  const handlePresetSave = () => {
    updateWorkspace((current) => saveCurrentPreset(current));
  };

  const handleAudioMasterVolumeChange = (volume: number) => {
    ambientAudio.setMasterVolume(volume);
    updateWorkspace((current) => ({ ...current, settings: { ...current.settings, audioMasterVolume: volume } }));
  };

  const handleAudioMutedChange = (muted: boolean) => {
    if (muted) ambientAudio.muteAll();
    updateWorkspace((current) => ({ ...current, settings: { ...current.settings, audioMuted: muted } }));
  };

  const handleTimerStartPause = () => {
    const now = Date.now();

    if (!timerRunning) {
      if (timerWallStartRef.current === null) {
        timerWallStartRef.current = now;
        timerActiveSecondsRef.current = 0;
        timerPausedMsRef.current = 0;
      } else if (timerPauseStartedAtRef.current !== null) {
        timerPausedMsRef.current += now - timerPauseStartedAtRef.current;
      }
      timerPauseStartedAtRef.current = null;
      timerLastTickRef.current = now;
      setTimerRuntimeStats({
        activeSeconds: timerActiveSecondsRef.current,
        wallClockSeconds: Math.max(0, Math.floor((now - (timerWallStartRef.current ?? now)) / 1000)),
        pausedSeconds: Math.max(0, Math.floor(timerPausedMsRef.current / 1000)),
      });

      if (timerMode !== "stopwatch" && timerValue <= 0) {
        if (timerMode === "pomodoro") {
          setTimerValue(getPomodoroPhaseDuration(pomodoroPhase, workspace.settings));
        } else {
          setTimerValue(getTimerDuration(timerMode, workspace.settings));
        }
      }
      setTimerRunning(true);
      return;
    }

    timerPauseStartedAtRef.current = now;
    timerLastTickRef.current = null;
    setTimerRuntimeStats({
      activeSeconds: timerActiveSecondsRef.current,
      wallClockSeconds: Math.max(0, Math.floor((now - (timerWallStartRef.current ?? now)) / 1000)),
      pausedSeconds: Math.max(0, Math.floor(timerPausedMsRef.current / 1000)),
    });
    setTimerRunning(false);
  };

  const handleTimerReset = () => {
    setTimerRunning(false);
    resetTimerSessionRefs();
    if (timerMode === "stopwatch") {
      setTimerValue(0);
    } else {
      if (timerMode === "pomodoro") {
        setPomodoroPhase("focus");
        setPomodoroCount(0);
        setTimerValue(workspace.settings.pomodoroMinutes * 60);
      } else {
        setTimerValue(getTimerDuration(timerMode, workspace.settings));
      }
    }
  };

  const handleSettingsChange = (settings: UserSettings) => {
    updateWorkspace((current) => ({ ...current, settings }));
    if (!timerRunning && timerMode !== "stopwatch") {
      setTimerValue(timerMode === "pomodoro" ? getPomodoroPhaseDuration(pomodoroPhase, settings) : getTimerDuration(timerMode, settings));
    }
  };

  const handleResetLayout = () => {
    setDesktopUi(createDefaultDesktopUiState());
    toast({ title: "Layout reset", description: "Panel positions were restored to the default layout." });
  };

  const handleClearLocalData = () => {
    if (!window.confirm("Clear local workspace data on this device? This cannot be undone.")) return;
    MANAGED_LOCAL_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    setWorkspace(createDefaultWorkspaceState());
    setDesktopUi(createDefaultDesktopUiState());
    setShowOnboarding(true);
    toast({ title: "Local data cleared", description: "A fresh local workspace is ready." });
  };

  const handleDismissOnboarding = () => {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {
      toast({
        title: "Preference not saved",
        description: "Onboarding was dismissed for now, but the browser could not remember that preference.",
      });
    }
    setShowOnboarding(false);
  };

  const handleCalendarEventCreate = (event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => {
    updateWorkspace((current) => addCalendarEvent(current, event));
  };


  const handleExport = () => {
    exportWorkspace(workspace);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await validateAndImportWorkspace(file);
    if (result.success && result.data) {
      const confirmed = window.confirm(
        [
          "Import this workspace backup?",
          `Tasks: ${result.summary?.tasks ?? 0}`,
          `Notes: ${result.summary?.notes ?? 0}`,
          `Events: ${result.summary?.events ?? 0}`,
          `Sessions: ${result.summary?.sessions ?? 0}`,
        ].join("\n"),
      );

      if (!confirmed) {
        event.target.value = "";
        return;
      }

      try {
        window.localStorage.setItem(PRE_IMPORT_BACKUP_STORAGE_KEY, JSON.stringify(createWorkspaceBackup(workspace)));
      } catch {
        toast({
          title: "Import backup warning",
          description: "Previous workspace backup could not be saved, so import was cancelled.",
          variant: "destructive",
        });
        event.target.value = "";
        return;
      }

      setWorkspace(result.data);
      toast({
        title: "Import complete",
        description: "Your current workspace was backed up before import.",
      });
    } else {
      toast({
        title: "Import failed",
        description: result.error || "Import failed; your current workspace was not changed.",
        variant: "destructive",
      });
    }
    event.target.value = "";
  };

  const renderPanelContent = (id: DesktopPanelId) => {
    switch (id) {
      case "notes":
        return (
          <NotesPanel
            notes={workspace.notes}
            selectedNoteId={workspace.selectedNoteId}
            onNoteUpdate={handleNoteUpdate}
            onNotePin={handleNotePin}
            onNoteCreate={handleNoteCreate}
            onNoteDelete={handleNoteDelete}
            onNoteRename={handleNoteRename}
            onNoteSelect={handleNoteSelect}
          />
        );
      case "calendar":
        return (
          <CalendarPanel
            events={workspace.calendarEvents}
            selectedDate={selectedCalendarDate}
            onSelectedDateChange={setSelectedCalendarDate}
            onCreateEvent={handleCalendarEventCreate}
            onUpdateEvent={handleCalendarEventUpdate}
            onDeleteEvent={handleCalendarEventDelete}
          />
        );
      case "tasks":
        return (
          <TasksPanel
            tasks={workspace.tasks}
            focusTaskId={workspace.focusTaskId}
            onTaskCreate={handleTaskCreate}
            onTaskToggle={handleTaskToggle}
            onTaskPriorityChange={handleTaskPriorityChange}
            onTaskMove={handleTaskMove}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onTaskFocusSelect={handleTaskFocusSelect}
            onTaskDueDateUpdate={handleTaskDueDateUpdate}
          />
        );
      case "timer":
        return (
          <TimerPanel
            timerMode={timerMode}
            timerValue={timerValue}
            timerRunning={timerRunning}
            currentTaskTitle={currentTask?.title}
            pomodoroPhase={pomodoroPhase}
            pomodoroCount={pomodoroCount}
            runtimeStats={timerRuntimeStats}
            onTimerModeChange={setTimerMode}
            onTimerStartPause={handleTimerStartPause}
            onTimerReset={handleTimerReset}
          />
        );
      case "audio":
        return (
          <AudioPanel
            audioTracks={workspace.audioTracks}
            audioPresets={workspace.audioPresets}
            isUnlocked={ambientAudio.isUnlocked}
            masterVolume={workspace.settings.audioMasterVolume}
            muted={workspace.settings.audioMuted}
            errors={ambientAudio.errors}
            onUnlockAudio={ambientAudio.unlockAudio}
            onTrackToggle={handleTrackToggle}
            onTrackVolumeChange={handleTrackVolumeChange}
            onMasterVolumeChange={handleAudioMasterVolumeChange}
            onMutedChange={handleAudioMutedChange}
            onPresetApply={handlePresetApply}
            onPresetSave={handlePresetSave}
          />
        );
      case "settings":
        return (
          <SettingsPanel
            settings={workspace.settings}
            spaces={workspace.spaces}
            persistenceStatus={workspaceStorage.status}
            persistenceError={workspaceStorage.error}
            lastSavedAt={workspaceStorage.lastSavedAt}
            onSettingsChange={handleSettingsChange}
            onResetLayout={handleResetLayout}
            onClearLocalData={handleClearLocalData}
            onExport={handleExport}
            onImport={handleImport}
          />
        );
      case "sessions":
        return (
          <SessionPanel
            sessions={workspace.focusSessions}
            tasks={workspace.tasks}
            dailyFocus={formatMinutes(focusTotals.today)}
            weeklyFocus={formatMinutes(focusTotals.week)}
            onAddSession={handleFocusSessionAdd}
            onDeleteSession={handleFocusSessionDelete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <WorkspaceShell
      immersiveViewport={
        <ImmersiveSceneViewport
          activeSpace={activeSpace}
          spaces={workspace.spaces}
          mode={desktopUi.scene.mode}
          collapsed={desktopUi.scene.collapsed}
          position={desktopUi.scene.position}
          size={desktopUi.scene.size}
          reducedMotion={workspace.settings.reducedMotion}
          onModeChange={(mode) => setDesktopUi((current) => ({ ...current, scene: { ...current.scene, mode } }))}
          onCollapsedChange={(collapsed) => setDesktopUi((current) => ({ ...current, scene: { ...current.scene, collapsed } }))}
          onPositionChange={(position) => setDesktopUi((current) => ({ ...current, scene: { ...current.scene, position } }))}
          onSizeChange={(size) => setDesktopUi((current) => ({ ...current, scene: { ...current.scene, size } }))}
          onSpaceSelect={handleSpaceSelect}
        />
      }
      toolbar={
        <div className="flex items-start justify-between gap-3">
          <PanelLauncher
            title={activeSpace.title}
            subtitle="Desktop Launcher"
            items={panelDefinitions}
            panels={desktopUi.panels}
            onOpenPanel={(id) => {
              openPanel(id);
              if (focusOnlyMode) setFocusOnlyMode(false);
            }}
          />

          <div className="rounded-xl border border-slate-700/80 bg-slate-950/72 px-4 py-3 text-right backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-end gap-2 border-b border-slate-800/50 pb-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Local Persistence</span>
              {workspaceSaveStatus === "saving" || uiSaveStatus === "saving" ? (
                <div className="flex items-center gap-1 text-sky-400">
                  <span className="text-[10px] font-semibold uppercase tracking-tighter">Saving</span>
                  <Loader2 className="h-3 w-3 animate-spin" />
                </div>
              ) : workspaceSaveStatus === "error" || uiSaveStatus === "error" ? (
                <div className="flex items-center gap-1 text-red-500">
                  <span className="text-[10px] font-semibold uppercase tracking-tighter text-red-400">Save Error</span>
                  <CloudOff className="h-3 w-3" />
                </div>
              ) : (
                <div className="flex items-center gap-1 text-emerald-500/80">
                  <span className="text-[10px] font-semibold uppercase tracking-tighter">Saved</span>
                  <CheckCircle2 className="h-3 w-3" />
                </div>
              )}
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Workspace clock</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">{clockLabel}</p>
            <p className="mt-1 text-xs text-slate-400">{focusOnlyMode ? "Minimalist mode enabled" : "Power workspace mode"}</p>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                size="sm"
                variant={focusOnlyMode ? "subtle" : "ghost"}
                onClick={() => {
                  if (!focusOnlyMode) minimizeAllPanels();
                  setFocusOnlyMode((current) => !current);
                }}
              >
                {focusOnlyMode ? "Show tools" : "Hide tools"}
              </Button>
              <Button size="sm" variant="ghost" onClick={minimizeAllPanels}>
                Minimize all
              </Button>
            </div>
          </div>
        </div>
      }
      floatingPanels={
        !focusOnlyMode && (
          <>
            {showOnboarding && (
              <div className="pointer-events-auto fixed left-1/2 top-1/2 z-[120] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-700/80 bg-slate-950/92 p-5 shadow-[0_32px_90px_-32px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
                <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">Offline ready</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-100">Welcome to your local focus sanctuary</h2>
                <div className="mt-4 grid gap-2 text-sm text-slate-300">
                  <p>Everything saves on this device.</p>
                  <p>Add a task, choose a scene, enable ambience, then start a focus session.</p>
                </div>
                <div className="mt-5 flex justify-end">
                  <Button variant="hero" onClick={handleDismissOnboarding}>
                    Begin focus
                  </Button>
                </div>
              </div>
            )}
            {panelDefinitions.map((panelDefinition) => {
              const panelState = desktopUi.panels[panelDefinition.id];
              return (
                <FloatingPanel
                  key={panelDefinition.id}
                  id={panelDefinition.id}
                  title={panelDefinition.label}
                  subtitle={panelDefinition.subtitle}
                  icon={panelDefinition.icon}
                  state={panelState}
                  dockedTop={dockedTopById[panelDefinition.id] ?? 88}
                  compact={compact}
                  onFocus={() => focusPanel(panelDefinition.id)}
                  onUpdate={(patch) => updatePanel(panelDefinition.id, patch)}
                  onClose={() => closePanel(panelDefinition.id)}
                  onToggleCollapsed={() => updatePanel(panelDefinition.id, { collapsed: !panelState.collapsed })}
                  onToggleMinimized={() => minimizePanel(panelDefinition.id)}
                  onToggleDocked={() => toggleDocked(panelDefinition.id)}
                >
                  {renderPanelContent(panelDefinition.id)}
                </FloatingPanel>
              );
            })}
          </>
        )
      }
      dock={
        <DockBar
          items={panelDefinitions}
          panels={desktopUi.panels}
          activePanelId={desktopUi.activePanelId}
          sceneMode={desktopUi.scene.mode}
          launcherCollapsed={desktopUi.launcherCollapsed}
          onToggleLauncher={() => setDesktopUi((current) => ({ ...current, launcherCollapsed: !current.launcherCollapsed }))}
          onSceneModeChange={(mode) => setDesktopUi((current) => ({ ...current, scene: { ...current.scene, mode } }))}
          onPanelToggle={(id) => {
            togglePanelFromDock(id);
            if (focusOnlyMode) setFocusOnlyMode(false);
          }}
        />
      }
    />
  );
};

export default Index;
