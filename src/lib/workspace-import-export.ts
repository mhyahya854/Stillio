import { WorkspaceState } from "@/types/workspace";
import { normalizeWorkspaceState } from "./workspace-data";
import { toast } from "@/hooks/use-toast";

export const CURRENT_SCHEMA_VERSION = 1;
export const BACKUP_APP_NAME = "Northstar Focus Workspace";
const LEGACY_BACKUP_APP_NAMES = ["Lifeatio Clone"] as const;

export interface WorkspaceBackup {
  app: typeof BACKUP_APP_NAME;
  schemaVersion: number;
  exportedAt: string;
  workspace: WorkspaceState;
}

export interface ImportSummary {
  tasks: number;
  notes: number;
  events: number;
  sessions: number;
}

export interface ImportResult {
  success: boolean;
  data?: WorkspaceState;
  summary?: ImportSummary;
  error?: string;
}

export function createWorkspaceBackup(state: WorkspaceState): WorkspaceBackup {
  return {
    app: BACKUP_APP_NAME,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    workspace: normalizeWorkspaceState(state),
  };
}

function formatBackupTimestamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

function summarizeWorkspace(state: WorkspaceState): ImportSummary {
  return {
    tasks: state.tasks.length,
    notes: state.notes.length,
    events: state.calendarEvents.length,
    sessions: state.focusSessions.length,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isSupportedBackupAppName(value: unknown): value is WorkspaceBackup["app"] | (typeof LEGACY_BACKUP_APP_NAMES)[number] {
  return value === BACKUP_APP_NAME || LEGACY_BACKUP_APP_NAMES.includes(value as (typeof LEGACY_BACKUP_APP_NAMES)[number]);
}

export function migrateWorkspaceBackup(raw: unknown): WorkspaceState {
  if (!isObject(raw)) {
    throw new Error("This file is not a valid workspace backup");
  }

  if ("schemaVersion" in raw || "workspace" in raw || "app" in raw) {
    if (!isSupportedBackupAppName(raw.app) || typeof raw.schemaVersion !== "number" || !("workspace" in raw)) {
      throw new Error("This file is not a valid workspace backup");
    }

    if (raw.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      throw new Error("Backup version is unsupported");
    }

    return normalizeWorkspaceState(raw.workspace);
  }

  if ("spaces" in raw && "settings" in raw) {
    return normalizeWorkspaceState(raw);
  }

  throw new Error("This file is not a valid workspace backup");
}

export function exportWorkspace(state: WorkspaceState): void {
  try {
    const backup = createWorkspaceBackup(state);
    const data = JSON.stringify(backup, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `northstar-workspace-backup-${formatBackupTimestamp()}.json`;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);

    toast({
      title: "Backup exported",
      description: "Your local workspace backup was created.",
    });
  } catch {
    toast({
      title: "Export failed",
      description: "Could not create a backup file. Check browser permissions.",
      variant: "destructive",
    });
  }
}

export async function validateAndImportWorkspace(file: File): Promise<ImportResult> {
  try {
    const text = await file.text();
    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      return { success: false, error: "Invalid JSON file" };
    }

    try {
      const data = migrateWorkspaceBackup(parsed);
      return { success: true, data, summary: summarizeWorkspace(data) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "This file is not a valid workspace backup",
      };
    }
  } catch {
    return { success: false, error: "Import failed; your current workspace was not changed" };
  }
}
