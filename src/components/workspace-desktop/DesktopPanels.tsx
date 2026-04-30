import { ChangeEvent, DragEvent, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CalendarClock, Check, Clock3, Flame, GripVertical, Pencil, Pin, Plus, RotateCcw, Save, Search, Target, Trash2, Volume2, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { formatMinutes, formatSeconds, formatTimer, toLocalDateKey } from "@/lib/workspace-helpers";
import { createFocusSessionPayload } from "@/lib/timer-session";
import { getTodayDateKey, normalizeDateKey } from "@/lib/workspace-validation";
import { AudioPreset, AudioTrack, CalendarEvent, FocusSession, Note, Space, Task, TaskPriority, UserSettings } from "@/types/workspace";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const panelCardClass = "panel-card";
const sectionHeaderClass = "section-header";

export function NotesPanel({
  notes,
  selectedNoteId,
  onNoteUpdate,
  onNotePin,
  onNoteCreate,
  onNoteDelete,
  onNoteRename,
  onNoteSelect,
}: {
  notes: Note[];
  selectedNoteId?: string;
  onNoteUpdate: (id: string, content: string) => void;
  onNotePin: (id: string) => void;
  onNoteCreate: () => void;
  onNoteDelete: (id: string) => void;
  onNoteRename: (id: string, title: string) => void;
  onNoteSelect: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filteredNotes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return notes;
    return notes.filter((n) => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query));
  }, [notes, searchQuery]);

  const activeNote = useMemo(() => notes.find((n) => n.id === selectedNoteId) || notes[0], [notes, selectedNoteId]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 border-slate-700/70 bg-slate-950/50 pl-9"
          />
        </div>
        <Button size="sm" variant="hero" onClick={onNoteCreate} className="h-9 px-3">
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 overflow-hidden md:grid-cols-[180px_1fr]">
        <div className="flex flex-col gap-2 overflow-y-auto pr-1">
          {filteredNotes.length === 0 && (
            <div className="py-4 text-center text-xs text-slate-500">
              {searchQuery ? "No matches found" : "No notes yet"}
            </div>
          )}
          {filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => onNoteSelect(note.id)}
              className={cn(
                "group flex flex-col items-start rounded-md border p-2 text-left transition-all",
                activeNote?.id === note.id
                  ? "border-cyan-500/50 bg-cyan-500/10"
                  : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/60",
              )}
            >
              <div className="flex w-full items-center justify-between gap-1">
                <span className={cn("truncate text-xs font-medium", activeNote?.id === note.id ? "text-cyan-100" : "text-slate-300")}>
                  {note.title}
                </span>
                {note.pinned && <Pin className="h-3 w-3 text-cyan-400" />}
              </div>
              <span className="mt-1 truncate text-[10px] text-slate-500">
                {new Date(note.updatedAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col overflow-hidden">
          {activeNote ? (
            <article className={cn(panelCardClass, "flex flex-1 flex-col gap-3 overflow-hidden")}>
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="min-w-0 flex-1">
                  {isRenaming === activeNote.id ? (
                    <Input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => {
                        if (renameValue.trim()) onNoteRename(activeNote.id, renameValue);
                        setIsRenaming(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (renameValue.trim()) onNoteRename(activeNote.id, renameValue);
                          setIsRenaming(null);
                        }
                      }}
                      className="h-7 border-slate-700/70 bg-slate-950/50 text-sm"
                    />
                  ) : (
                    <h3
                      className="cursor-pointer truncate text-sm font-semibold text-slate-100 hover:text-cyan-300"
                      onClick={() => {
                        setIsRenaming(activeNote.id);
                        setRenameValue(activeNote.title);
                      }}
                    >
                      {activeNote.title}
                    </h3>
                  )}
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                    Updated {new Date(activeNote.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant={activeNote.pinned ? "subtle" : "ghost"}
                    className="h-8 w-8"
                    onClick={() => onNotePin(activeNote.id)}
                  >
                    <Pin className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                    onClick={() => onNoteDelete(activeNote.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={activeNote.content}
                onChange={(e) => onNoteUpdate(activeNote.id, e.target.value)}
                className="flex-1 resize-none border-none bg-transparent p-0 text-sm focus-visible:ring-0"
                placeholder="Start writing..."
              />
            </article>
          ) : (
            <div className={cn(panelCardClass, "flex flex-1 flex-col items-center justify-center text-center")}>
              <Pencil className="mb-3 h-10 w-10 text-slate-700" />
              <p className="text-sm text-slate-400">Select a note to view its contents</p>
              <Button variant="outline" size="sm" onClick={onNoteCreate} className="mt-4">
                Create new note
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CalendarPanel({
  events,
  selectedDate,
  onSelectedDateChange,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
}: {
  events: CalendarEvent[];
  selectedDate: Date | undefined;
  onSelectedDateChange: (date: Date | undefined) => void;
  onCreateEvent: (event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [category, setCategory] = useState<CalendarEvent["category"]>("focus");
  const [editingId, setEditingId] = useState<string | null>(null);

  const selectedDateKey = selectedDate ? toLocalDateKey(selectedDate) : "";
  const eventsForDate = useMemo(
    () => events.filter((event) => event.date === selectedDateKey).sort((a, b) => a.time.localeCompare(b.time)),
    [events, selectedDateKey],
  );

  const upcoming = useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => {
        const eventDate = new Date(`${event.date}T${event.time}:00`);
        return eventDate >= now;
      })
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .slice(0, 5);
  }, [events]);

  const checkConflict = (event: CalendarEvent) => {
    const start = new Date(`${event.date}T${event.time}:00`).getTime();
    const end = start + event.durationMinutes * 60000;
    return events.some((other) => {
      if (other.id === event.id || other.date !== event.date) return false;
      const otherStart = new Date(`${other.date}T${other.time}:00`).getTime();
      const otherEnd = otherStart + other.durationMinutes * 60000;
      return start < otherEnd && end > otherStart;
    });
  };

  const activeList = eventsForDate.length > 0 ? eventsForDate : upcoming;

  return (
    <div className="space-y-3">
      <div className={panelCardClass}>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelectedDateChange}
          className="rounded-lg border border-slate-700/60 bg-slate-950/40 p-3"
          classNames={{
            day_today: "bg-cyan-700/40 text-cyan-100",
            day_selected: "bg-cyan-500 text-slate-950",
            head_cell: "text-slate-400 rounded-md w-9 font-normal text-[0.8rem]",
          }}
        />
      </div>

      <div className={panelCardClass}>
        <p className={sectionHeaderClass}>{editingId ? "Edit Event" : "Create Event"}</p>
        <div className="grid gap-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Event title" className="border-slate-700/70 bg-slate-950/50" />
          <div className="grid grid-cols-2 gap-2">
            <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="border-slate-700/70 bg-slate-950/50" />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={15}
                step={15}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(Math.max(15, Number(event.target.value) || 15))}
                className="flex-1 border-slate-700/70 bg-slate-950/50"
              />
              <span className="text-[10px] uppercase text-slate-500">min</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["focus", "meeting", "planning", "break"] as const).map((option) => (
              <Button key={option} size="sm" variant={category === option ? "subtle" : "ghost"} onClick={() => setCategory(option)}>
                {option}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            {editingId ? (
              <>
                <Button
                  variant="hero"
                  className="flex-1"
                  onClick={() => {
                    if (!title.trim()) return;
                    onUpdateEvent(editingId, {
                      title: title.trim(),
                      time,
                      durationMinutes,
                      category,
                    });
                    setEditingId(null);
                    setTitle("");
                  }}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setTitle("");
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="hero"
                className="w-full"
                onClick={() => {
                  if (!title.trim()) return;
                  const date = selectedDate ? toLocalDateKey(selectedDate) : toLocalDateKey(new Date());
                  onCreateEvent({
                    title: title.trim(),
                    date,
                    time,
                    durationMinutes,
                    category,
                  });
                  setTitle("");
                }}
              >
                <Plus className="h-4 w-4" />
                Add event
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className={panelCardClass}>
        <p className={sectionHeaderClass}>{eventsForDate.length > 0 ? "Agenda" : "Upcoming"}</p>
        <div className="space-y-2">
          {activeList.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500 italic">No scheduled events</p>
          ) : (
            activeList.map((event) => {
              const hasConflict = checkConflict(event);
              return (
                <div key={event.id} className="group relative flex items-center justify-between rounded-md border border-slate-700/70 bg-slate-950/45 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm text-slate-100">{event.title}</p>
                      {hasConflict && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400" title="Time conflict detected">
                          <Clock3 className="h-3 w-3" />
                          Conflict
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-400">
                        {event.date} at {event.time}
                      </p>
                      <span className="text-[10px] text-slate-500">- {formatMinutes(event.durationMinutes)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-slate-600/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-300">
                      {event.category}
                    </span>
                    <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingId(event.id);
                          setTitle(event.title);
                          setTime(event.time);
                          setDurationMinutes(event.durationMinutes);
                          setCategory(event.category);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-400 hover:text-rose-300" onClick={() => onDeleteEvent(event.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function TasksPanel({
  tasks,
  focusTaskId,
  onTaskCreate,
  onTaskToggle,
  onTaskPriorityChange,
  onTaskMove,
  onTaskUpdate,
  onTaskDelete,
  onTaskFocusSelect,
  onTaskDueDateUpdate,
}: {
  tasks: Task[];
  focusTaskId?: string;
  onTaskCreate: (title: string) => void;
  onTaskToggle: (id: string) => void;
  onTaskPriorityChange: (id: string, priority: TaskPriority) => void;
  onTaskMove: (activeId: string, overId: string) => void;
  onTaskUpdate: (id: string, title: string) => void;
  onTaskDelete: (id: string) => void;
  onTaskFocusSelect: (id: string | undefined) => void;
  onTaskDueDateUpdate: (id: string, date: string | undefined) => void;
}) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "upcoming" | "completed">("all");

  const todayKey = toLocalDateKey(new Date());

  const counts = useMemo(() => {
    return {
      all: tasks.filter((t) => !t.completed).length,
      today: tasks.filter((t) => !t.completed && (t.dueToday || t.dueDate === todayKey)).length,
      upcoming: tasks.filter((t) => !t.completed && t.dueDate && t.dueDate > todayKey).length,
      completed: tasks.filter((t) => t.completed).length,
    };
  }, [tasks, todayKey]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (activeFilter === "today") {
      list = tasks.filter((t) => !t.completed && (t.dueToday || t.dueDate === todayKey || (t.dueDate && t.dueDate < todayKey)));
    } else if (activeFilter === "upcoming") {
      list = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate > todayKey);
    } else if (activeFilter === "completed") {
      list = tasks.filter((t) => t.completed);
    } else {
      list = tasks.filter((t) => !t.completed);
    }

    return [...list].sort((a, b) => {
      // Focus task first
      if (a.id === focusTaskId) return -1;
      if (b.id === focusTaskId) return 1;

      // Overdue first
      const aOverdue = !a.completed && a.dueDate && a.dueDate < todayKey;
      const bOverdue = !b.completed && b.dueDate && b.dueDate < todayKey;
      if (aOverdue && !bOverdue) return -1;
      if (bOverdue && !aOverdue) return 1;

      // Due today
      const aToday = !a.completed && (a.dueToday || a.dueDate === todayKey);
      const bToday = !b.completed && (b.dueToday || b.dueDate === todayKey);
      if (aToday && !bToday) return -1;
      if (bToday && !aToday) return 1;

      // Priority
      const priorityWeight = { high: 0, medium: 1, low: 2 };
      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[a.priority] - priorityWeight[b.priority];
      }

      return a.order - b.order;
    });
  }, [tasks, activeFilter, todayKey, focusTaskId]);

  const handleDrop = (event: DragEvent<HTMLElement>, overId: string) => {
    const activeId = event.dataTransfer.getData("text/plain");
    if (!activeId || activeId === overId) return;
    onTaskMove(activeId, overId);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className={cn(panelCardClass, "p-2")}>
        <div className="flex gap-2">
          <Input
            value={draft}
            placeholder="Capture a task..."
            className="h-9 border-slate-700/70 bg-slate-950/50"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                onTaskCreate(draft.trim());
                setDraft("");
              }
            }}
          />
          <Button
            variant="hero"
            size="sm"
            onClick={() => {
              if (!draft.trim()) return;
              onTaskCreate(draft.trim());
              setDraft("");
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "today", "upcoming", "completed"] as const).map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "subtle" : "ghost"}
            size="sm"
            className="h-8 gap-2 px-3 text-xs"
            onClick={() => setActiveFilter(filter)}
          >
            <span className="capitalize">{filter}</span>
            {counts[filter] > 0 && (
              <Badge variant="outline" className="h-4 min-w-[1.25rem] border-slate-700 px-1 text-[10px] text-slate-400">
                {counts[filter]}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Check className="mb-3 h-8 w-8 text-slate-700" />
            <p className="text-sm text-slate-400">
              {activeFilter === "completed" ? "No completed tasks yet" : "All caught up in this view!"}
            </p>
          </div>
        )}
        {filtered.map((task, index) => {
          const isOverdue = !task.completed && task.dueDate && task.dueDate < todayKey;
          const isFocus = task.id === focusTaskId;

          return (
            <article
              key={task.id}
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/plain", task.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, task.id)}
              className={cn(
                panelCardClass,
                "relative transition-all border-l-4",
                isFocus ? "border-l-cyan-500 bg-cyan-500/5" : isOverdue ? "border-l-rose-500 bg-rose-500/5" : "border-l-transparent",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 flex flex-col gap-1">
                  <GripVertical className="h-4 w-4 cursor-grab text-slate-600 active:cursor-grabbing" />
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn("h-4 w-4 p-0", isFocus ? "text-cyan-400" : "text-slate-600 hover:text-cyan-400")}
                    onClick={() => onTaskFocusSelect(isFocus ? undefined : task.id)}
                    title={isFocus ? "Remove from focus" : "Set as current focus"}
                  >
                    <Target className="h-4 w-4" />
                  </Button>
                </div>
                <Checkbox checked={task.completed} onCheckedChange={() => onTaskToggle(task.id)} className="mt-1" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    {editingId === task.id ? (
                      <Input
                        autoFocus
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        onBlur={() => {
                          const value = editingTitle.trim();
                          if (value) onTaskUpdate(task.id, value);
                          setEditingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const value = editingTitle.trim();
                            if (value) onTaskUpdate(task.id, value);
                            setEditingId(null);
                          }
                        }}
                        className="h-7 border-slate-700/70 bg-slate-950/50 text-sm"
                      />
                    ) : (
                      <p
                        className={cn("cursor-pointer text-sm font-medium transition-colors hover:text-cyan-300", task.completed ? "text-slate-500 line-through" : "text-slate-100")}
                        onClick={() => {
                          setEditingId(task.id);
                          setEditingTitle(task.title);
                        }}
                      >
                        {task.title}
                      </p>
                    )}
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-slate-500 hover:text-rose-400"
                        onClick={() => onTaskDelete(task.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-950/40 px-1.5 py-0.5">
                      {(["low", "medium", "high"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => onTaskPriorityChange(task.id, p)}
                          className={cn(
                            "h-2 w-2 rounded-full transition-all",
                            task.priority === p
                              ? p === "high" ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : p === "medium" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                              : "bg-slate-700 hover:bg-slate-600",
                          )}
                          title={`Set priority to ${p}`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <CalendarClock className={cn("h-3 w-3", isOverdue ? "text-rose-400" : "text-slate-500")} />
                      <input
                        type="date"
                        value={task.dueDate || ""}
                        onChange={(e) => onTaskDueDateUpdate(task.id, e.target.value || undefined)}
                        className={cn(
                          "bg-transparent text-[10px] outline-none focus:text-cyan-400",
                          isOverdue ? "text-rose-400 font-medium" : "text-slate-500",
                        )}
                      />
                    </div>

                    {task.description && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Pencil className="h-3 w-3" />
                        <span className="truncate max-w-[100px]">{task.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function TimerPanel({
  timerMode,
  timerValue,
  timerRunning,
  currentTaskTitle,
  pomodoroPhase,
  pomodoroCount,
  runtimeStats,
  onTimerModeChange,
  onTimerStartPause,
  onTimerReset,
}: {
  timerMode: "pomodoro" | "countdown" | "stopwatch";
  timerValue: number;
  timerRunning: boolean;
  currentTaskTitle?: string;
  pomodoroPhase?: "focus" | "short-break" | "long-break";
  pomodoroCount?: number;
  runtimeStats: {
    activeSeconds: number;
    wallClockSeconds: number;
    pausedSeconds: number;
  };
  onTimerModeChange: (mode: "pomodoro" | "countdown" | "stopwatch") => void;
  onTimerStartPause: () => void;
  onTimerReset: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className={cn(panelCardClass, "flex flex-col items-center justify-center py-8 relative overflow-hidden")}>
        {timerMode === "pomodoro" && (
          <div className="absolute top-2 left-3 flex items-center gap-1.5">
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              pomodoroPhase === "focus" ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            )} />
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
              {pomodoroPhase?.replace("-", " ")}
            </span>
          </div>
        )}
        
        {timerMode === "pomodoro" && pomodoroCount !== undefined && pomodoroCount > 0 && (
          <div className="absolute top-2 right-3 flex gap-1">
            {Array.from({ length: Math.min(4, (pomodoroCount % 4) || (pomodoroPhase === "focus" ? 0 : 4)) }).map((_, i) => (
              <div key={i} className="h-1 w-3 rounded-full bg-orange-500/60" />
            ))}
          </div>
        )}

        <p className="text-5xl font-semibold text-slate-100 tracking-tight">{formatTimer(timerValue)}</p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
          {timerRunning ? "Active Session" : "Paused"}
        </p>
      </div>

      <div className={panelCardClass}>
        <div className="mb-4 flex gap-1 rounded-md bg-slate-950/40 p-1">
          {(["pomodoro", "countdown", "stopwatch"] as const).map((mode) => (
            <Button 
              key={mode} 
              size="sm" 
              variant="ghost" 
              className={cn(
                "flex-1 h-8 text-[11px] uppercase tracking-wider transition-all",
                timerMode === mode ? "bg-slate-800 text-cyan-400" : "text-slate-400 hover:text-slate-200"
              )} 
              onClick={() => onTimerModeChange(mode)}
            >
              {mode}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="hero" className="flex-1 shadow-lg shadow-cyan-950/20" onClick={onTimerStartPause}>
            {timerRunning ? "Pause" : "Start"}
          </Button>
          <Button variant="outline" className="px-4" onClick={onTimerReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={panelCardClass}>
        <p className={sectionHeaderClass}>Session Time</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Focus</p>
            <p className="mt-1 text-sm font-medium text-slate-100">{formatSeconds(runtimeStats.activeSeconds)}</p>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Elapsed</p>
            <p className="mt-1 text-sm font-medium text-slate-100">{formatSeconds(runtimeStats.wallClockSeconds)}</p>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Paused</p>
            <p className="mt-1 text-sm font-medium text-slate-100">{formatSeconds(runtimeStats.pausedSeconds)}</p>
          </div>
        </div>
      </div>

      <div className={panelCardClass}>
        <p className={sectionHeaderClass}>Focus Target</p>
        <p className={cn(
          "mt-1 text-sm transition-colors",
          currentTaskTitle ? "text-slate-100" : "text-slate-500 italic"
        )}>
          {currentTaskTitle ?? "No active task selected"}
        </p>
      </div>
    </div>
  );
}

export function AudioPanel({
  audioTracks,
  audioPresets,
  isUnlocked,
  masterVolume,
  muted,
  errors,
  onUnlockAudio,
  onTrackToggle,
  onTrackVolumeChange,
  onMasterVolumeChange,
  onMutedChange,
  onPresetApply,
  onPresetSave,
}: {
  audioTracks: AudioTrack[];
  audioPresets: AudioPreset[];
  isUnlocked: boolean;
  masterVolume: number;
  muted: boolean;
  errors: Record<string, string>;
  onUnlockAudio: () => void;
  onTrackToggle: (id: string) => void;
  onTrackVolumeChange: (id: string, volume: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onMutedChange: (muted: boolean) => void;
  onPresetApply: (presetId: string) => void;
  onPresetSave: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className={panelCardClass}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className={sectionHeaderClass}>Local Mixer</p>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">Local files</Badge>
        </div>

        {!isUnlocked && (
          <Button variant="hero" className="mb-3 w-full" onClick={onUnlockAudio}>
            <Volume2 className="h-4 w-4" />
            Enable ambience
          </Button>
        )}

        <div className="mb-4 space-y-2 rounded-md border border-slate-700/70 bg-slate-950/45 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Master</p>
            <Button size="sm" variant={muted ? "subtle" : "ghost"} className="h-7 px-2 text-[11px]" onClick={() => onMutedChange(!muted)}>
              {muted ? "Muted" : "Mute all"}
            </Button>
          </div>
          <Slider value={[masterVolume]} max={100} step={1} onValueChange={([value]) => onMasterVolumeChange(value)} />
        </div>

        <div className="space-y-2">
          {audioTracks.map((track) => (
            <div key={track.id} className="rounded-md border border-slate-700/70 bg-slate-950/45 p-2">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-slate-300" />
                  <p className="text-sm text-slate-100">{track.name}</p>
                </div>
                <Button size="sm" variant={track.active ? "subtle" : "ghost"} className="h-7 px-2 text-[11px]" onClick={() => onTrackToggle(track.id)}>
                  {track.active ? "On" : "Off"}
                </Button>
              </div>
              <Slider value={[track.volume]} max={100} step={1} onValueChange={([value]) => onTrackVolumeChange(track.id, value)} />
              {(errors[track.id] || track.error) && (
                <p className="mt-2 text-[11px] text-rose-300">{errors[track.id] ?? track.error}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={panelCardClass}>
        <p className={sectionHeaderClass}>Presets</p>
        <div className="space-y-2">
          {audioPresets.map((preset) => (
            <div key={preset.id} className="flex items-center justify-between rounded-md border border-slate-700/70 bg-slate-950/45 px-3 py-2">
              <div>
                <p className="text-sm text-slate-100">{preset.name}</p>
                <p className="text-xs text-slate-400">{Object.keys(preset.trackLevels).length} layers</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => onPresetApply(preset.id)}>
                Apply
              </Button>
            </div>
          ))}
          <Button variant="hero" className="w-full" onClick={onPresetSave}>
            <Save className="h-4 w-4" />
            Save current mix
          </Button>
        </div>
      </div>
    </div>
  );
}


export function SettingsPanel({
  settings,
  spaces,
  persistenceStatus,
  persistenceError,
  lastSavedAt,
  onSettingsChange,
  onResetLayout,
  onClearLocalData,
  onExport,
  onImport,
}: {
  settings: UserSettings;
  spaces: Space[];
  persistenceStatus: "idle" | "saving" | "saved" | "error";
  persistenceError?: string;
  lastSavedAt?: string;
  onSettingsChange: (settings: UserSettings) => void;
  onResetLayout: () => void;
  onClearLocalData: () => void;
  onExport: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className={panelCardClass}>
        <p className={sectionHeaderClass}>Defaults</p>
        <div className="space-y-3">
          <label className="block text-xs text-slate-400">
            Startup space
            <select
              value={settings.startupSpaceId}
              onChange={(event) => onSettingsChange({ ...settings, startupSpaceId: event.target.value })}
              className="mt-1 h-9 w-full rounded-md border border-slate-700/70 bg-slate-950/50 px-2 text-sm text-slate-100"
            >
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>{space.title}</option>
              ))}
            </select>
          </label>

          <label className="block text-xs text-slate-400">
            Pomodoro minutes: {settings.pomodoroMinutes}
            <Slider value={[settings.pomodoroMinutes]} min={15} max={60} step={5} onValueChange={([value]) => onSettingsChange({ ...settings, pomodoroMinutes: value })} />
          </label>

          <label className="block text-xs text-slate-400">
            Countdown minutes: {settings.countdownMinutes}
            <Slider value={[settings.countdownMinutes]} min={15} max={120} step={5} onValueChange={([value]) => onSettingsChange({ ...settings, countdownMinutes: value })} />
          </label>

          <Button variant={settings.reducedMotion ? "subtle" : "ghost"} onClick={() => onSettingsChange({ ...settings, reducedMotion: !settings.reducedMotion })}>
            {settings.reducedMotion ? "Reduced motion on" : "Reduced motion off"}
          </Button>
        </div>
      </div>

      <div className={panelCardClass}>
        <p className={sectionHeaderClass}>Storage Status</p>
        <div className="space-y-2 rounded-md border border-slate-700/70 bg-slate-950/45 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-300">Saved on this device</span>
            <Badge
              variant="outline"
              className={cn(
                "capitalize",
                persistenceStatus === "error" ? "border-rose-500/40 text-rose-300" : "border-emerald-500/30 text-emerald-300",
              )}
            >
              {persistenceStatus}
            </Badge>
          </div>
          {lastSavedAt && <p className="text-xs text-slate-500">Last saved {new Date(lastSavedAt).toLocaleString()}</p>}
          {persistenceError && <p className="text-xs text-rose-300">{persistenceError}</p>}
        </div>
      </div>

      <div className={panelCardClass}>
        <p className={sectionHeaderClass}>Local Workspace</p>
        <div className="flex gap-2">
          <Button variant="hero" className="flex-1" onClick={onExport}>
            Export JSON
          </Button>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-slate-700/70 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 hover:bg-slate-900/80">
            Import
            <input type="file" accept="application/json" className="hidden" onChange={onImport} />
          </label>
        </div>
      </div>

      <div className={panelCardClass}>
        <p className={sectionHeaderClass}>Workspace</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onResetLayout}>
            Reset layout
          </Button>
          <Button variant="outline" className="border-rose-900/40 text-rose-300 hover:text-rose-200" onClick={onClearLocalData}>
            Clear data
          </Button>
        </div>
      </div>

      <div className={panelCardClass}>
        <p className={sectionHeaderClass}>About</p>
        <p className="text-sm leading-relaxed text-slate-300">
          Stillio is an offline-ready local focus workspace. Tasks, notes, events, sessions, layout, and ambience settings stay on this device unless you export a backup.
        </p>
      </div>
    </div>
  );
}

export function SessionPanel({
  sessions,
  tasks,
  dailyFocus,
  weeklyFocus,
  onAddSession,
  onDeleteSession,
}: {
  sessions: FocusSession[];
  tasks: Task[];
  dailyFocus: string;
  weeklyFocus: string;
  onAddSession: (session: Omit<FocusSession, "id">) => void;
  onDeleteSession: (id: string) => void;
}) {
  const [filterMode, setFilterMode] = useState<FocusSession["mode"] | "all">("all");
  const [filterTaskId, setFilterTaskId] = useState<string | "all">("all");
  const [showManualLog, setShowManualLog] = useState(false);

  // Manual Log State
  const [logMode, setLogMode] = useState<FocusSession["mode"]>("pomodoro");
  const [logTaskId, setLogTaskId] = useState<string>("");
  const [logDuration, setLogDuration] = useState(25);
  const [logDate, setLogDate] = useState(toLocalDateKey(new Date()));

  const filtered = useMemo(() => {
    return sessions
      .filter((s) => (filterMode === "all" || s.mode === filterMode) && (filterTaskId === "all" || s.taskId === filterTaskId))
      .slice()
      .sort((a, b) => {
        const startedAtA = new Date(a.startedAt).getTime();
        const startedAtB = new Date(b.startedAt).getTime();
        return (Number.isFinite(startedAtB) ? startedAtB : 0) - (Number.isFinite(startedAtA) ? startedAtA : 0);
      });
  }, [sessions, filterMode, filterTaskId]);

  const recent = filtered.slice(0, 10);

  return (
    <div className="space-y-3">
      <div className={panelCardClass}>
        <p className={sectionHeaderClass}>Performance Totals</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-md border border-slate-700/70 bg-slate-950/45 p-2 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Today</p>
            <p className="text-xl font-semibold text-slate-100">{dailyFocus}</p>
          </div>
          <div className="rounded-md border border-slate-700/70 bg-slate-950/45 p-2 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Week</p>
            <p className="text-xl font-semibold text-slate-100">{weeklyFocus}</p>
          </div>
        </div>
      </div>

      <div className={panelCardClass}>
        <div className="mb-2 flex items-center justify-between">
          <p className={sectionHeaderClass}>Filtering</p>
          <Button size="sm" variant="ghost" className="h-7 text-[10px] uppercase" onClick={() => setShowManualLog(!showManualLog)}>
            {showManualLog ? "Close Log" : "Manual Log"}
          </Button>
        </div>

        {showManualLog && (
          <div className="mb-4 space-y-2 rounded-md border border-slate-700/50 bg-slate-950/30 p-2">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={logMode}
                onChange={(e) => setLogMode(e.target.value as FocusSession["mode"])}
                className="h-8 rounded-md border border-slate-700/70 bg-slate-950/50 px-2 text-xs text-slate-100"
              >
                <option value="pomodoro">Pomodoro</option>
                <option value="stopwatch">Stopwatch</option>
                <option value="countdown">Countdown</option>
              </select>
              <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="h-8 border-slate-700/70 bg-slate-950/50 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={logTaskId}
                onChange={(e) => setLogTaskId(e.target.value)}
                className="h-8 rounded-md border border-slate-700/70 bg-slate-950/50 px-2 text-xs text-slate-100"
              >
                <option value="">No task</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={logDuration}
                  onChange={(e) => setLogDuration(Math.max(1, Number(e.target.value)))}
                  className="h-8 border-slate-700/70 bg-slate-950/50 text-xs"
                />
                <span className="text-[10px] text-slate-500 uppercase">min</span>
              </div>
            </div>
            <Button
              variant="hero"
              size="sm"
              className="w-full h-8"
              onClick={() => {
                const safeDate = normalizeDateKey(logDate, getTodayDateKey());
                const safeDuration = Math.max(1, Math.round(logDuration));
                const start = new Date(`${safeDate}T09:00:00`);
                const end = new Date(start.getTime() + safeDuration * 60000);

                onAddSession(createFocusSessionPayload({
                  mode: logMode,
                  taskId: logTaskId || undefined,
                  startedAtMs: start.getTime(),
                  endedAtMs: end.getTime(),
                  activeSeconds: safeDuration * 60,
                  pausedSeconds: 0,
                  completed: true,
                }));
                setLogDate(safeDate);
                setLogDuration(safeDuration);
                setShowManualLog(false);
              }}
            >
              Save Manual Log
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as FocusSession["mode"] | "all")}
            className="h-8 rounded-md border border-slate-700/70 bg-slate-950/50 px-2 text-xs text-slate-100"
          >
            <option value="all">All Modes</option>
            <option value="pomodoro">Pomodoro</option>
            <option value="stopwatch">Stopwatch</option>
            <option value="countdown">Countdown</option>
          </select>
          <select
            value={filterTaskId}
            onChange={(e) => setFilterTaskId(e.target.value)}
            className="h-8 rounded-md border border-slate-700/70 bg-slate-950/50 px-2 text-xs text-slate-100"
          >
            <option value="all">All Tasks</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={panelCardClass}>
        <p className={sectionHeaderClass}>Recent History</p>
        <div className="space-y-2">
          {recent.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500 italic">No sessions found</p>
          ) : (
            recent.map((session) => {
              const task = tasks.find((t) => t.id === session.taskId);
              return (
                <div key={session.id} className="group relative flex items-center justify-between rounded-md border border-slate-700/70 bg-slate-950/45 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {session.mode === "pomodoro" ? (
                      <Flame className="h-4 w-4 text-orange-400" />
                    ) : session.mode === "countdown" ? (
                      <Clock3 className="h-4 w-4 text-cyan-400" />
                    ) : (
                      <Waves className="h-4 w-4 text-indigo-400" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-100 capitalize">{session.mode}</p>
                        {task && <span className="truncate text-[10px] text-slate-500">- {task.title}</span>}
                      </div>
                      <p className="text-[10px] text-slate-400">{new Date(session.startedAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-100 whitespace-nowrap">{formatSeconds(session.activeSeconds)}</p>
                      <p className="text-[10px] text-slate-500 whitespace-nowrap">
                        elapsed {formatSeconds(session.wallClockSeconds)} / paused {formatSeconds(session.pausedSeconds)}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 text-rose-400 hover:text-rose-300"
                      onClick={() => onDeleteSession(session.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
