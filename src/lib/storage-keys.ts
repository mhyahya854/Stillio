export const WORKSPACE_STORAGE_KEY = "stillio.workspace.v1";
export const DESKTOP_UI_STORAGE_KEY = "stillio.desktop-ui.v1";
export const ONBOARDING_STORAGE_KEY = "stillio.onboarded.v1";
export const PRE_IMPORT_BACKUP_STORAGE_KEY = `${WORKSPACE_STORAGE_KEY}-pre-import-backup`;

// Legacy keys kept for migration from older product names (do not delete silently)
export const LEGACY_WORKSPACE_KEY = "northstar-local-workspace";
export const LEGACY_DESKTOP_UI_KEY = "northstar-desktop-ui";
export const LEGACY_ONBOARDING_KEY = "northstar-onboarded";

export const LEGACY_KEY_MAP: Record<string, string[]> = {
  [WORKSPACE_STORAGE_KEY]: [LEGACY_WORKSPACE_KEY],
  [DESKTOP_UI_STORAGE_KEY]: [LEGACY_DESKTOP_UI_KEY],
  [ONBOARDING_STORAGE_KEY]: [LEGACY_ONBOARDING_KEY],
};

export const MANAGED_LOCAL_STORAGE_KEYS = [
  WORKSPACE_STORAGE_KEY,
  DESKTOP_UI_STORAGE_KEY,
  ONBOARDING_STORAGE_KEY,
  PRE_IMPORT_BACKUP_STORAGE_KEY,
  LEGACY_WORKSPACE_KEY,
  LEGACY_DESKTOP_UI_KEY,
  LEGACY_ONBOARDING_KEY,
] as const;
