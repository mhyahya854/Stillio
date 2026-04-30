import workspaceNightCity from "@/assets/workspace-night-city.jpg";
import workspaceLibrary from "@/assets/workspace-library.jpg";
import workspaceStudio from "@/assets/workspace-studio.jpg";
import workspaceCabin from "@/assets/workspace-cabin.jpg";
import { toLocalDateKey } from "@/lib/workspace-helpers";
import { getTodayDateKey, normalizeDateKey, normalizeDurationMinutes, normalizeTime } from "@/lib/workspace-validation";
import { AudioPreset, AudioTrack, CalendarEvent, Note, Space, Task, UtilityPanelId, WorkspaceState } from "@/types/workspace";

const utilityPanelIds: UtilityPanelId[] = ["timer", "tasks", "notes", "audio"];
const spaceCategories = ["Library", "Rain", "Night City", "Studio", "Cabin", "Nature", "Minimal Office"] as const;
const taskPriorities = ["low", "medium", "high"] as const;
const taskTags = ["Study", "Reading", "Project", "Admin"] as const;
const calendarCategories = ["focus", "meeting", "planning", "break"] as const;
const safeSceneImageRoots = ["/assets/", "/src/assets/", "/scenes/"] as const;
const safeSceneVideoRoots = ["/videos/"] as const;
const safeAudioRoots = ["/audio/"] as const;

function createIsoHelpers(baseDate = new Date()) {
  const now = baseDate;
  return {
    minutesAgo(minutes: number) {
      return new Date(now.getTime() - minutes * 60 * 1000).toISOString();
    },
    daysAhead(days: number) {
      const date = new Date(now);
      date.setDate(date.getDate() + days);
      return toLocalDateKey(date);
    },
  };
}

export function createDefaultWorkspaceState(): WorkspaceState {
  const iso = createIsoHelpers();

  return {
    spaces: [
      {
        id: "night-desk",
        title: "Night Desk",
        category: "Night City",
        mediaType: "image",
        image: workspaceNightCity,
        description: "Rain against glass, low lamp, clear desk.",
        ambienceLabel: "Rain / city hush / 14C",
        tags: ["Rain", "Writing"],
        favorite: true,
        recent: true,
        soundPresetId: "preset-night-shift",
      },
      {
        id: "private-library",
        title: "Private Library",
        category: "Library",
        mediaType: "image",
        image: workspaceLibrary,
        description: "Warm shelves, deep wood, long-form reading focus.",
        ambienceLabel: "Quiet stacks / lamp glow / 20C",
        tags: ["Reading", "Study", "Long session"],
        favorite: true,
        recent: false,
        soundPresetId: "preset-archive",
      },
      {
        id: "studio-grid",
        title: "Studio Grid",
        category: "Studio",
        mediaType: "image",
        image: workspaceStudio,
        description: "Concrete, steel, reduced noise, analytical work.",
        ambienceLabel: "Soft overcast / studio air / 18C",
        tags: ["Planning", "Design", "Minimal"],
        favorite: false,
        recent: true,
        soundPresetId: "preset-concrete",
      },
      {
        id: "forest-cabin",
        title: "Forest Cabin",
        category: "Cabin",
        mediaType: "image",
        image: workspaceCabin,
        description: "Timber, rain, stove heat, slower pace.",
        ambienceLabel: "Forest rain / stove heat / 11C",
        tags: ["Deep Work", "Reading", "Calm"],
        favorite: false,
        recent: false,
        soundPresetId: "preset-hearth",
      },
      {
        id: "quiet-atrium",
        title: "Quiet Atrium",
        category: "Minimal Office",
        mediaType: "image",
        image: workspaceStudio,
        description: "Open surfaces and clean architectural rhythm.",
        ambienceLabel: "Low HVAC / diffuse light / 19C",
        tags: ["Admin", "Review", "Operations"],
        favorite: false,
        recent: false,
        soundPresetId: "preset-concrete",
      },
      {
        id: "evergreen-lookout",
        title: "Evergreen Lookout",
        category: "Nature",
        mediaType: "image",
        image: workspaceCabin,
        description: "A steadier forest view for quiet planning.",
        ambienceLabel: "Wind in pines / rain edge / 9C",
        tags: ["Nature", "Sketching", "Reset"],
        favorite: false,
        recent: false,
        soundPresetId: "preset-hearth",
      },
    ],
    audioTracks: [
      { id: "rain", name: "Rain", icon: "CloudRain", src: "/audio/rain.wav", volume: 74, active: true },
      { id: "cafe", name: "Cafe Murmur", icon: "Coffee", src: "/audio/cafe.wav", volume: 28, active: false },
      { id: "keys", name: "Keyboard", icon: "Keyboard", src: "/audio/keyboard.wav", volume: 24, active: false },
      { id: "fire", name: "Fireplace", icon: "Flame", src: "/audio/fireplace.wav", volume: 36, active: false },
      { id: "wind", name: "Wind", icon: "Wind", src: "/audio/wind.wav", volume: 22, active: true },
      { id: "birds", name: "Birds", icon: "Bird", src: "/audio/birds.wav", volume: 20, active: false },
      { id: "ocean", name: "Ocean", icon: "Waves", src: "/audio/ocean.wav", volume: 18, active: false },
      { id: "noise", name: "White Noise", icon: "Waves", src: "/audio/white-noise.wav", volume: 14, active: false },
    ],
    audioPresets: [
      {
        id: "preset-night-shift",
        name: "Night Shift",
        trackLevels: { rain: 74, wind: 22 },
      },
      {
        id: "preset-archive",
        name: "Archive",
        trackLevels: { rain: 22, cafe: 16, keys: 12 },
      },
      {
        id: "preset-concrete",
        name: "Concrete Studio",
        trackLevels: { noise: 30, wind: 10, keys: 18 },
      },
      {
        id: "preset-hearth",
        name: "Hearth",
        trackLevels: { fire: 36, rain: 30, wind: 20 },
      },
    ],
    tasks: [
      { id: "task-outline", title: "Outline chapter notes", completed: false, priority: "high", tag: "Study", dueToday: true, createdAt: iso.minutesAgo(360), updatedAt: iso.minutesAgo(45), order: 0 },
      { id: "task-review", title: "Review sprint brief", completed: false, priority: "medium", tag: "Project", dueToday: true, createdAt: iso.minutesAgo(300), updatedAt: iso.minutesAgo(60), order: 1 },
      { id: "task-admin", title: "Send weekly admin summary", completed: false, priority: "low", tag: "Admin", dueToday: false, createdAt: iso.minutesAgo(220), updatedAt: iso.minutesAgo(90), order: 2 },
      { id: "task-reading", title: "Read two journal sections", completed: true, priority: "medium", tag: "Reading", dueToday: false, createdAt: iso.minutesAgo(420), updatedAt: iso.minutesAgo(120), completedAt: iso.minutesAgo(120), order: 3 },
    ],
    notes: [
      {
        id: "note-scratchpad",
        title: "Scratchpad",
        content: "Capture loose thoughts, links, or talking points here.",
        pinned: true,
        createdAt: iso.minutesAgo(180),
        updatedAt: iso.minutesAgo(8),
        kind: "scratchpad",
      },
      {
        id: "note-session",
        title: "Session Notes",
        content: "Tonight: keep the brief lean, tighten the opening, and hold email until the last block.",
        pinned: false,
        createdAt: iso.minutesAgo(240),
        updatedAt: iso.minutesAgo(32),
        kind: "session",
      },
      {
        id: "note-reference",
        title: "Reading Extracts",
        content: "Architecture: cadence matters more than ornament. Keep decisions structural.",
        pinned: true,
        createdAt: iso.minutesAgo(360),
        updatedAt: iso.minutesAgo(94),
        kind: "reference",
      },
    ],
    calendarEvents: [
      {
        id: "event-standup",
        title: "Weekly planning",
        date: iso.daysAhead(0),
        time: "10:30",
        durationMinutes: 45,
        category: "planning",
        createdAt: iso.minutesAgo(180),
        updatedAt: iso.minutesAgo(180),
      },
      {
        id: "event-review",
        title: "Project review",
        date: iso.daysAhead(1),
        time: "14:00",
        durationMinutes: 30,
        category: "meeting",
        createdAt: iso.minutesAgo(160),
        updatedAt: iso.minutesAgo(160),
      },
      {
        id: "event-focus",
        title: "Deep focus block",
        date: iso.daysAhead(2),
        time: "09:00",
        durationMinutes: 90,
        category: "focus",
        createdAt: iso.minutesAgo(140),
        updatedAt: iso.minutesAgo(140),
      },
    ],
    focusSessions: [
      {
        id: "session-1",
        mode: "pomodoro",
        taskId: "task-outline",
        startedAt: iso.minutesAgo(320),
        endedAt: iso.minutesAgo(295),
        activeSeconds: 25 * 60,
        wallClockSeconds: 25 * 60,
        pausedSeconds: 0,
        durationMinutes: 25,
        completed: true,
        createdAt: iso.minutesAgo(295),
      },
      {
        id: "session-2",
        mode: "countdown",
        taskId: "task-review",
        startedAt: iso.minutesAgo(190),
        endedAt: iso.minutesAgo(145),
        activeSeconds: 45 * 60,
        wallClockSeconds: 45 * 60,
        pausedSeconds: 0,
        durationMinutes: 45,
        completed: true,
        createdAt: iso.minutesAgo(145),
      },
      {
        id: "session-3",
        mode: "pomodoro",
        taskId: "task-outline",
        startedAt: iso.minutesAgo(70),
        endedAt: iso.minutesAgo(45),
        activeSeconds: 25 * 60,
        wallClockSeconds: 25 * 60,
        pausedSeconds: 0,
        durationMinutes: 25,
        completed: true,
        createdAt: iso.minutesAgo(45),
      },
    ],
    settings: {
      reducedMotion: false,
      startupSpaceId: "night-desk",
      pomodoroMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
        countdownMinutes: 45,
        defaultUtilityPanel: "timer",
        audioMasterVolume: 70,
        audioMuted: false,
      },
    activeSpaceId: "night-desk",
    activePresetId: "preset-night-shift",
    selectedNoteId: "note-scratchpad",
    focusTaskId: "task-outline",
  };
}

function ensureArray<T>(value: unknown, fallback: T[]) {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function hasSafePathSegments(path: string) {
  try {
    const decoded = decodeURI(path).replace(/\\/g, "/");
    const pathOnly = decoded.split(/[?#]/, 1)[0];
    return !pathOnly.split("/").some((segment) => segment === "..");
  } catch {
    return false;
  }
}

function isSafeLocalPath(value: unknown, allowedRoots: readonly string[]): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return false;
  if ([...trimmed].some((character) => character.charCodeAt(0) < 32)) return false;
  if (!hasSafePathSegments(trimmed)) return false;
  return allowedRoots.some((root) => trimmed.startsWith(root));
}

function sanitizeIdentifier(value: unknown, prefix: string, index: number) {
  return typeof value === "string" && /^[a-z0-9][a-z0-9_-]*$/i.test(value) ? value : `${prefix}-${index}`;
}

function normalizeSpaces(spaces: Space[], fallback: Space[]) {
  if (!spaces.length) return fallback;
  return spaces.map((space, index) => {
    const fallbackSpace = fallback[index % fallback.length];
    const rawVideoSrc = space.id === "night-desk" && space.videoSrc === "/videos/night-desk.mp4"
      ? undefined
      : isSafeLocalPath(space.videoSrc, safeSceneVideoRoots)
        ? space.videoSrc.trim()
        : undefined;
    const image = isSafeLocalPath(space.image, safeSceneImageRoots) ? space.image.trim() : fallbackSpace.image;
    const posterImage = isSafeLocalPath(space.posterImage, safeSceneImageRoots) ? space.posterImage.trim() : undefined;
    const fallbackImage = isSafeLocalPath(space.fallbackImage, safeSceneImageRoots) ? space.fallbackImage.trim() : undefined;

    return {
      ...fallbackSpace,
      ...space,
      id: typeof space.id === "string" && space.id ? space.id : `space-${index}`,
      title: typeof space.title === "string" && space.title.trim() ? space.title : `Workspace ${index + 1}`,
      category: spaceCategories.includes(space.category) ? space.category : fallbackSpace.category,
      mediaType: space.mediaType === "video" && rawVideoSrc ? "video" : "image",
      image,
      videoSrc: rawVideoSrc,
      posterImage,
      fallbackImage,
      description: typeof space.description === "string" ? space.description : "",
      ambienceLabel: typeof space.ambienceLabel === "string" ? space.ambienceLabel : "",
      tags: Array.isArray(space.tags) ? space.tags.filter((tag): tag is string => typeof tag === "string") : [],
      favorite: Boolean(space.favorite),
      recent: Boolean(space.recent),
    };
  });
}

function normalizeAudioTracks(tracks: AudioTrack[]) {
  return tracks.map((track, index) => {
    const id = sanitizeIdentifier(track.id, "track", index);

    return {
      ...track,
      id,
      name: typeof track.name === "string" && track.name.trim() ? track.name : `Layer ${index + 1}`,
      icon: typeof track.icon === "string" ? track.icon : "Waves",
      src: isSafeLocalPath(track.src, safeAudioRoots) ? track.src.trim() : `/audio/${id}.wav`,
      volume: Math.max(0, Math.min(100, Number(track.volume) || 0)),
      active: Boolean(track.active),
      error: typeof track.error === "string" ? track.error : undefined,
    };
  });
}

function normalizeAudioPresets(presets: AudioPreset[], validTrackIds: Set<string>) {
  return presets.map((preset, index) => ({
    ...preset,
    id: typeof preset.id === "string" && preset.id ? preset.id : `preset-${index}`,
    name: typeof preset.name === "string" && preset.name.trim() ? preset.name : `Preset ${index + 1}`,
    trackLevels: typeof preset.trackLevels === "object" && preset.trackLevels
      ? Object.fromEntries(
          Object.entries(preset.trackLevels)
            .filter(([key]) => validTrackIds.has(key))
            .map(([key, level]) => [key, Math.max(0, Math.min(100, Number(level) || 0))]),
        )
      : {},
  }));
}

function normalizeTasks(tasks: Task[]) {
  return tasks
    .map((task, index) => ({
      ...task,
      id: typeof task.id === "string" && task.id ? task.id : `task-${index}`,
      title: typeof task.title === "string" && task.title.trim() ? task.title : `Task ${index + 1}`,
      completed: Boolean(task.completed),
      priority: taskPriorities.includes(task.priority) ? task.priority : "medium",
      tag: taskTags.includes(task.tag) ? task.tag : "Project",
      dueToday: Boolean(task.dueToday),
      dueDate: typeof task.dueDate === "string" ? task.dueDate : undefined,
      description: typeof task.description === "string" ? task.description : undefined,
      createdAt: typeof task.createdAt === "string" ? task.createdAt : new Date().toISOString(),
      updatedAt: typeof task.updatedAt === "string" ? task.updatedAt : new Date().toISOString(),
      completedAt: typeof task.completedAt === "string" ? task.completedAt : undefined,
      focusSessionIds: Array.isArray(task.focusSessionIds)
        ? task.focusSessionIds.filter((id): id is string => typeof id === "string")
        : [],
      order: Number.isFinite(task.order) ? Number(task.order) : index,
    }))
    .sort((a, b) => a.order - b.order)
    .map((task, index) => ({ ...task, order: index }));
}

function normalizeNotes(notes: Note[]) {
  return notes.map((note, index) => ({
    ...note,
    id: typeof note.id === "string" && note.id ? note.id : `note-${index}`,
    title: typeof note.title === "string" && note.title.trim() ? note.title : `Note ${index + 1}`,
    content: typeof note.content === "string" ? note.content : "",
    createdAt: typeof note.createdAt === "string" ? note.createdAt : new Date().toISOString(),
    updatedAt: typeof note.updatedAt === "string" ? note.updatedAt : new Date().toISOString(),
    pinned: Boolean(note.pinned),
    kind: note.kind === "scratchpad" || note.kind === "session" || note.kind === "reference" ? note.kind : "reference",
  }));
}

function normalizeCalendarEvents(events: CalendarEvent[]) {
  const today = getTodayDateKey();
  return events.map((event, index) => ({
    ...event,
    id: typeof event.id === "string" && event.id ? event.id : `event-${index}`,
    title: typeof event.title === "string" && event.title.trim() ? event.title : `Event ${index + 1}`,
    description: typeof event.description === "string" ? event.description.trim() : undefined,
    date: normalizeDateKey(event.date, today),
    time: normalizeTime(event.time),
    durationMinutes: normalizeDurationMinutes(event.durationMinutes),
    category: calendarCategories.includes(event.category) ? event.category : "focus",
    createdAt: typeof event.createdAt === "string" ? event.createdAt : new Date().toISOString(),
    updatedAt: typeof event.updatedAt === "string" ? event.updatedAt : new Date().toISOString(),
  }));
}

function normalizeFocusSessions(sessions: WorkspaceState["focusSessions"]) {
  return sessions.map((session, index) => {
    const nowIso = new Date().toISOString();
    const startedDate = new Date(session?.startedAt ?? nowIso);
    const safeStartedDate = Number.isNaN(startedDate.getTime()) ? new Date(nowIso) : startedDate;
    const endedDate = new Date(session?.endedAt ?? nowIso);
    const hasValidEndedDate = !Number.isNaN(endedDate.getTime()) && endedDate >= safeStartedDate;
    const durationFromField = Number.isFinite(session?.durationMinutes) ? Math.round(session.durationMinutes) : NaN;
    const durationFromDates = hasValidEndedDate
      ? Math.round((endedDate.getTime() - safeStartedDate.getTime()) / 60000)
      : 0;
    const safeDurationMinutes = Number.isFinite(durationFromField) && durationFromField > 0
      ? durationFromField
      : Math.max(1, durationFromDates);
    const fallbackEndedDate = new Date(safeStartedDate.getTime() + safeDurationMinutes * 60000);
    const safeEndedDate = hasValidEndedDate ? endedDate : fallbackEndedDate;
    const wallClockSecondsFromDates = Math.max(1, Math.floor((safeEndedDate.getTime() - safeStartedDate.getTime()) / 1000));
    const safeWallClockSeconds = Number.isFinite(session?.wallClockSeconds) && session.wallClockSeconds > 0
      ? Math.round(session.wallClockSeconds)
      : wallClockSecondsFromDates;
    const safeActiveSeconds = Number.isFinite(session?.activeSeconds) && session.activeSeconds > 0
      ? Math.round(session.activeSeconds)
      : Math.max(1, safeDurationMinutes * 60);
    const safePausedSeconds = Number.isFinite(session?.pausedSeconds) && session.pausedSeconds >= 0
      ? Math.round(session.pausedSeconds)
      : Math.max(0, safeWallClockSeconds - safeActiveSeconds);

    return {
      ...session,
      id: typeof session?.id === "string" && session.id ? session.id : `session-${index}`,
      mode: session?.mode === "pomodoro" || session?.mode === "countdown" || session?.mode === "stopwatch" ? session.mode : "pomodoro",
      taskId: typeof session?.taskId === "string" && session.taskId ? session.taskId : undefined,
      title: typeof session?.title === "string" && session.title.trim() ? session.title.trim() : undefined,
      startedAt: safeStartedDate.toISOString(),
      endedAt: safeEndedDate.toISOString(),
      activeSeconds: Math.max(1, Math.min(safeWallClockSeconds, safeActiveSeconds)),
      wallClockSeconds: Math.max(1, safeWallClockSeconds),
      pausedSeconds: Math.max(0, Math.min(safeWallClockSeconds, safePausedSeconds)),
      durationMinutes: Math.max(1, Math.round(Math.max(1, safeActiveSeconds) / 60)),
      completed: Boolean(session?.completed),
      createdAt: typeof session?.createdAt === "string" ? session.createdAt : safeEndedDate.toISOString(),
    };
  });
}



function normalizeDefaultUtilityPanel(value: unknown, fallback: UtilityPanelId) {
  return utilityPanelIds.includes(value as UtilityPanelId) ? (value as UtilityPanelId) : fallback;
}

function normalizePercentage(value: unknown, fallback: number) {
  if (typeof value !== "number" && typeof value !== "string") return fallback;
  if (typeof value === "string" && value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : fallback;
}

export function normalizeWorkspaceState(value: unknown): WorkspaceState {
  const fallback = createDefaultWorkspaceState();
  if (!value || typeof value !== "object") return fallback;

  const raw = value as Partial<WorkspaceState>;
  
  const spaces = normalizeSpaces(ensureArray(raw.spaces, fallback.spaces), fallback.spaces).map(space => ({
    ...space,
    tags: space.tags.filter(tag => tag !== "Calls")
  }));
  const audioTracks = normalizeAudioTracks(ensureArray(raw.audioTracks, fallback.audioTracks));
  const audioTrackIds = new Set(audioTracks.map((track) => track.id));
  const audioPresets = normalizeAudioPresets(ensureArray(raw.audioPresets, fallback.audioPresets), audioTrackIds);
  const tasks = normalizeTasks(ensureArray(raw.tasks, fallback.tasks));
  const notes = normalizeNotes(ensureArray(raw.notes, fallback.notes));
  const calendarEvents = normalizeCalendarEvents(ensureArray(raw.calendarEvents, fallback.calendarEvents));
  const focusSessions = normalizeFocusSessions(ensureArray(raw.focusSessions, fallback.focusSessions));

  const activeSpaceId = spaces.some((space) => space.id === raw.activeSpaceId) 
    ? (raw.activeSpaceId as string) 
    : spaces[0].id;
    
  const activePresetId = audioPresets.length === 0
    ? undefined
    : audioPresets.some((preset) => preset.id === raw.activePresetId)
      ? (raw.activePresetId as string)
      : audioPresets[0].id;

  const startupSpaceId = spaces.some((space) => space.id === raw.settings?.startupSpaceId)
    ? (raw.settings?.startupSpaceId as string)
    : activeSpaceId;

  const selectedNoteId = notes.some((note) => note.id === raw.selectedNoteId) ? (raw.selectedNoteId as string) : (notes.length > 0 ? notes[0].id : undefined);
  const focusTaskId = tasks.some((task) => task.id === raw.focusTaskId) ? (raw.focusTaskId as string) : undefined;

  return {
    spaces,
    audioTracks,
    audioPresets,
    tasks,
    notes,
    calendarEvents,
    focusSessions,
    activeSpaceId,
    activePresetId,
    selectedNoteId,
    focusTaskId,
    settings: {
      reducedMotion: Boolean(raw.settings?.reducedMotion ?? fallback.settings.reducedMotion),
      startupSpaceId,
      pomodoroMinutes: Math.max(1, Number(raw.settings?.pomodoroMinutes) || fallback.settings.pomodoroMinutes),
      shortBreakMinutes: Math.max(1, Number(raw.settings?.shortBreakMinutes) || fallback.settings.shortBreakMinutes),
      longBreakMinutes: Math.max(1, Number(raw.settings?.longBreakMinutes) || fallback.settings.longBreakMinutes),
      countdownMinutes: Math.max(1, Number(raw.settings?.countdownMinutes) || fallback.settings.countdownMinutes),
      defaultUtilityPanel: normalizeDefaultUtilityPanel(raw.settings?.defaultUtilityPanel, fallback.settings.defaultUtilityPanel),
      audioMasterVolume: normalizePercentage(raw.settings?.audioMasterVolume, fallback.settings.audioMasterVolume),
      audioMuted: Boolean(raw.settings?.audioMuted ?? fallback.settings.audioMuted),
    },
  } as WorkspaceState;
}
