import { reorderTasks } from "@/lib/workspace-helpers";
import { getTodayDateKey, normalizeDateKey, normalizeDurationMinutes, normalizeOptionalDateKey, normalizeTime } from "@/lib/workspace-validation";
import { CalendarEvent, FocusSession, TaskPriority, WorkspaceState } from "@/types/workspace";

export function generateId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function selectSpace(state: WorkspaceState, spaceId: string): WorkspaceState {
  if (!state.spaces.some((space) => space.id === spaceId)) return state;

  return {
    ...state,
    activeSpaceId: spaceId,
    spaces: state.spaces.map((space) => ({
      ...space,
      recent: space.id === spaceId || space.recent,
    })),
  };
}

export function createTask(state: WorkspaceState, title: string, dueDate?: string, description?: string): WorkspaceState {
  const safeTitle = title.trim();
  if (!safeTitle) return state;
  const now = new Date().toISOString();

  return {
    ...state,
    tasks: [
      ...state.tasks,
      {
        id: generateId("task"),
        title: safeTitle,
        completed: false,
        priority: "medium",
        tag: "Project",
        dueToday: dueDate === getTodayDateKey(),
        dueDate,
        description,
        createdAt: now,
        updatedAt: now,
        focusSessionIds: [],
        order: state.tasks.length,
      },
    ],
  };
}

export function updateTaskDueDate(state: WorkspaceState, id: string, dueDate: string | undefined): WorkspaceState {
  const safeDueDate = normalizeOptionalDateKey(dueDate);
  const now = new Date().toISOString();

  return {
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            dueDate: safeDueDate,
            dueToday: safeDueDate === getTodayDateKey(),
            updatedAt: now,
          }
        : task,
    ),
  };
}

export function updateTaskDescription(state: WorkspaceState, id: string, description: string): WorkspaceState {
  const now = new Date().toISOString();
  return {
    ...state,
    tasks: state.tasks.map((task) => (task.id === id ? { ...task, description, updatedAt: now } : task)),
  };
}

export function setFocusTask(state: WorkspaceState, id: string | undefined): WorkspaceState {
  const nextFocusTaskId =
    typeof id === "string" && state.tasks.some((task) => task.id === id && !task.completed)
      ? id
      : undefined;

  return {
    ...state,
    focusTaskId: nextFocusTaskId,
  };
}

export function toggleTask(state: WorkspaceState, id: string): WorkspaceState {
  const now = new Date().toISOString();
  let nextFocusTaskId = state.focusTaskId;
  const tasks = state.tasks.map((task) =>
    task.id === id
      ? (() => {
          const completed = !task.completed;
          if (completed && state.focusTaskId === id) {
            nextFocusTaskId = undefined;
          }

          return {
            ...task,
            completed,
            completedAt: task.completed ? undefined : now,
            updatedAt: now,
          };
        })()
      : task,
  );

  return {
    ...state,
    focusTaskId: nextFocusTaskId,
    tasks,
  };
}

export function changeTaskPriority(state: WorkspaceState, id: string, priority: TaskPriority): WorkspaceState {
  const now = new Date().toISOString();
  return {
    ...state,
    tasks: state.tasks.map((task) => (task.id === id ? { ...task, priority, updatedAt: now } : task)),
  };
}

export function moveTask(state: WorkspaceState, activeId: string, overId: string): WorkspaceState {
  return {
    ...state,
    tasks: reorderTasks(state.tasks, activeId, overId),
  };
}

export function updateTaskTitle(state: WorkspaceState, id: string, title: string): WorkspaceState {
  const safeTitle = title.trim();
  if (!safeTitle) return state;

  return {
    ...state,
    tasks: state.tasks.map((task) => (task.id === id ? { ...task, title: safeTitle, updatedAt: new Date().toISOString() } : task)),
  };
}

export function deleteTask(state: WorkspaceState, id: string): WorkspaceState {
  const remaining = state.tasks.filter((task) => task.id !== id);
  return {
    ...state,
    focusTaskId: state.focusTaskId === id ? undefined : state.focusTaskId,
    tasks: remaining.map((task, index) => ({ ...task, order: index })),
  };
}

export function updateNoteContent(state: WorkspaceState, id: string, content: string): WorkspaceState {
  return {
    ...state,
    notes: state.notes.map((note) =>
      note.id === id
        ? {
            ...note,
            content,
            updatedAt: new Date().toISOString(),
          }
        : note,
    ),
  };
}

export function toggleNotePin(state: WorkspaceState, id: string): WorkspaceState {
  const now = new Date().toISOString();
  return {
    ...state,
    notes: state.notes.map((note) => (note.id === id ? { ...note, pinned: !note.pinned, updatedAt: now } : note)),
  };
}

export function createNote(state: WorkspaceState): WorkspaceState {
  const id = generateId("note");
  const newNote = {
    id,
    title: "Untitled Note",
    content: "",
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    kind: "reference" as const,
  };

  return {
    ...state,
    notes: [newNote, ...state.notes],
    selectedNoteId: id,
  };
}

export function renameNote(state: WorkspaceState, id: string, title: string): WorkspaceState {
  const safeTitle = title.trim();
  if (!safeTitle) return state;

  return {
    ...state,
    notes: state.notes.map((note) => (note.id === id ? { ...note, title: safeTitle, updatedAt: new Date().toISOString() } : note)),
  };
}

export function deleteNote(state: WorkspaceState, id: string): WorkspaceState {
  const remaining = state.notes.filter((note) => note.id !== id);
  let nextSelectedId = state.selectedNoteId;

  if (state.selectedNoteId === id) {
    nextSelectedId = remaining.length > 0 ? remaining[0].id : undefined;
  }

  return {
    ...state,
    notes: remaining,
    selectedNoteId: nextSelectedId,
  };
}

export function selectNote(state: WorkspaceState, id: string | undefined): WorkspaceState {
  return {
    ...state,
    selectedNoteId: id,
  };
}

export function toggleTrack(state: WorkspaceState, id: string): WorkspaceState {
  return {
    ...state,
    audioTracks: state.audioTracks.map((track) => (track.id === id ? { ...track, active: !track.active } : track)),
  };
}

export function setTrackVolume(state: WorkspaceState, id: string, volume: number): WorkspaceState {
  const safeVolume = Math.max(0, Math.min(100, Math.round(volume)));

  return {
    ...state,
    audioTracks: state.audioTracks.map((track) =>
      track.id === id
        ? {
            ...track,
            volume: safeVolume,
            active: safeVolume > 0,
          }
        : track,
    ),
  };
}

export function applyPreset(state: WorkspaceState, presetId: string): WorkspaceState {
  const preset = state.audioPresets.find((item) => item.id === presetId);
  if (!preset) return state;

  return {
    ...state,
    activePresetId: presetId,
    audioTracks: state.audioTracks.map((track) => {
      const level = preset.trackLevels[track.id];
      const safeVolume = typeof level === "number" ? Math.max(0, Math.min(100, Math.round(level))) : 0;
      return {
        ...track,
        volume: safeVolume,
        active: safeVolume > 0,
      };
    }),
  };
}

export function saveCurrentPreset(state: WorkspaceState): WorkspaceState {
  return {
    ...state,
    audioPresets: [
      ...state.audioPresets,
      {
        id: generateId("preset"),
        name: `Preset ${state.audioPresets.length + 1}`,
        trackLevels: Object.fromEntries(state.audioTracks.filter((track) => track.active).map((track) => [track.id, track.volume])),
      },
    ],
  };
}

export function addCalendarEvent(state: WorkspaceState, event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">): WorkspaceState {
  const safeTitle = event.title.trim();
  if (!safeTitle) return state;
  const safeDate = normalizeDateKey(event.date, getTodayDateKey());
  const safeTime = normalizeTime(event.time);
  const safeDuration = normalizeDurationMinutes(event.durationMinutes);
  const now = new Date().toISOString();
  const safeCategory =
    event.category === "focus" || event.category === "meeting" || event.category === "planning" || event.category === "break"
      ? event.category
      : "focus";

  return {
    ...state,
    calendarEvents: [
      ...state.calendarEvents,
      {
        ...event,
        id: generateId("event"),
        title: safeTitle,
        description: event.description?.trim(),
        date: safeDate,
        time: safeTime,
        durationMinutes: safeDuration,
        category: safeCategory,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

export function updateCalendarEvent(state: WorkspaceState, id: string, patch: Partial<Omit<CalendarEvent, "id">>): WorkspaceState {
  const now = new Date().toISOString();
  return {
    ...state,
    calendarEvents: state.calendarEvents.map((event) => {
      if (event.id !== id) return event;
      const updated = { ...event, ...patch };
      const nextCategory =
        updated.category === "focus" || updated.category === "meeting" || updated.category === "planning" || updated.category === "break"
          ? updated.category
          : event.category;

      return {
        ...updated,
        title: updated.title.trim() || event.title,
        description:
          typeof patch.description === "string"
            ? patch.description.trim() || undefined
            : event.description,
        date: typeof patch.date !== "undefined" ? normalizeDateKey(patch.date, event.date) : event.date,
        time: typeof patch.time !== "undefined" ? normalizeTime(patch.time, event.time) : event.time,
        durationMinutes:
          typeof patch.durationMinutes !== "undefined"
            ? normalizeDurationMinutes(patch.durationMinutes, event.durationMinutes)
            : event.durationMinutes,
        category: nextCategory,
        updatedAt: now,
      };
    }),
  };
}

export function deleteCalendarEvent(state: WorkspaceState, id: string): WorkspaceState {
  return {
    ...state,
    calendarEvents: state.calendarEvents.filter((event) => event.id !== id),
  };
}

export function addFocusSession(state: WorkspaceState, session: Omit<FocusSession, "id">): WorkspaceState {
  const id = generateId("session");
  const taskId = typeof session.taskId === "string" && state.tasks.some((task) => task.id === session.taskId)
    ? session.taskId
    : undefined;

  return {
    ...state,
    focusSessions: [
      ...state.focusSessions,
      {
        ...session,
        taskId,
        id,
      },
    ],
    tasks: taskId
      ? state.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                focusSessionIds: [...new Set([...(task.focusSessionIds ?? []), id])],
                updatedAt: new Date().toISOString(),
              }
            : task,
        )
      : state.tasks,
  };
}

export function deleteFocusSession(state: WorkspaceState, id: string): WorkspaceState {
  return {
    ...state,
    focusSessions: state.focusSessions.filter((session) => session.id !== id),
    tasks: state.tasks.map((task) => ({
      ...task,
      focusSessionIds: task.focusSessionIds?.filter((sessionId) => sessionId !== id),
    })),
  };
}
