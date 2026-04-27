export type UtilityPanelId = "timer" | "tasks" | "notes" | "audio";

export type SpaceCategory =
  | "Library"
  | "Rain"
  | "Night City"
  | "Studio"
  | "Cabin"
  | "Nature"
  | "Minimal Office";

export type MediaType = "image" | "video";

export interface Space {
  id: string;
  title: string;
  category: SpaceCategory;
  mediaType: MediaType;
  image: string;
  videoSrc?: string;
  posterImage?: string;
  fallbackImage?: string;
  description: string;
  ambienceLabel: string;
  tags: string[];
  favorite: boolean;
  recent: boolean;
  soundPresetId?: string;
}

export interface AudioTrack {
  id: string;
  name: string;
  icon: string;
  src: string;
  volume: number;
  active: boolean;
  error?: string;
}

export interface AudioPreset {
  id: string;
  name: string;
  trackLevels: Record<string, number>;
}

export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  tag: "Study" | "Reading" | "Project" | "Admin";
  dueToday: boolean;
  dueDate?: string; // ISO date YYYY-MM-DD
  description?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  focusSessionIds?: string[];
  order: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  kind: "scratchpad" | "session" | "reference";
}

export interface FocusSession {
  id: string;
  mode: "pomodoro" | "countdown" | "stopwatch";
  taskId?: string;
  title?: string;
  startedAt: string;
  endedAt: string;
  activeSeconds: number;
  wallClockSeconds: number;
  pausedSeconds: number;
  durationMinutes: number;
  completed: boolean;
  createdAt: string;
}


export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  durationMinutes: number;
  category: "focus" | "meeting" | "planning" | "break";
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  reducedMotion: boolean;
  startupSpaceId: string;
  pomodoroMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  countdownMinutes: number;
  defaultUtilityPanel: UtilityPanelId;
  audioMasterVolume: number;
  audioMuted: boolean;
}


export interface WorkspaceState {
  spaces: Space[];
  audioTracks: AudioTrack[];
  audioPresets: AudioPreset[];
  tasks: Task[];
  notes: Note[];
  calendarEvents: CalendarEvent[];
  focusSessions: FocusSession[];
  settings: UserSettings;
  activeSpaceId: string;
  activePresetId?: string;
  selectedNoteId?: string;
  focusTaskId?: string;
}
