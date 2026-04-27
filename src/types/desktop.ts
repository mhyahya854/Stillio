export type DesktopPanelId =
  | "notes"
  | "calendar"
  | "tasks"
  | "timer"
  | "audio"
  | "settings"
  | "sessions";

export type SceneViewportMode = "expanded" | "docked" | "minimized";

export interface PanelSize {
  width: number;
  height: number;
}

export interface PanelPosition {
  x: number;
  y: number;
}

export interface DesktopPanelState {
  open: boolean;
  collapsed: boolean;
  minimized: boolean;
  docked: boolean;
  size: PanelSize;
  position: PanelPosition;
  zIndex: number;
}

export interface SceneViewportState {
  mode: SceneViewportMode;
  collapsed: boolean;
  size: PanelSize;
  position: PanelPosition;
}

export interface DesktopUiState {
  activePanelId?: DesktopPanelId;
  panels: Record<DesktopPanelId, DesktopPanelState>;
  scene: SceneViewportState;
  launcherCollapsed: boolean;
}
