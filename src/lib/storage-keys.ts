export const WORKSPACE_STORAGE_KEY = "northstar-local-workspace";
export const DESKTOP_UI_STORAGE_KEY = "northstar-desktop-ui";
export const ONBOARDING_STORAGE_KEY = "northstar-onboarded";
export const PRE_IMPORT_BACKUP_STORAGE_KEY = `${WORKSPACE_STORAGE_KEY}-pre-import-backup`;

export const MANAGED_LOCAL_STORAGE_KEYS = [
  WORKSPACE_STORAGE_KEY,
  DESKTOP_UI_STORAGE_KEY,
  ONBOARDING_STORAGE_KEY,
  PRE_IMPORT_BACKUP_STORAGE_KEY,
] as const;
