import { DesktopPanelId, DesktopUiState } from "@/types/desktop";

const panelIds: DesktopPanelId[] = ["notes", "calendar", "tasks", "timer", "audio", "settings", "sessions"];
const MIN_VISIBLE_PANEL_WIDTH = 160;
const MIN_VISIBLE_PANEL_HEIGHT = 72;

const defaultPanelLayout: Record<DesktopPanelId, Omit<DesktopUiState["panels"][DesktopPanelId], "zIndex">> = {
  notes: {
    open: true,
    collapsed: false,
    minimized: false,
    docked: false,
    size: { width: 420, height: 360 },
    position: { x: 56, y: 108 },
  },
  calendar: {
    open: false,
    collapsed: false,
    minimized: false,
    docked: false,
    size: { width: 390, height: 440 },
    position: { x: 512, y: 90 },
  },
  tasks: {
    open: true,
    collapsed: false,
    minimized: false,
    docked: false,
    size: { width: 440, height: 430 },
    position: { x: 122, y: 486 },
  },
  timer: {
    open: true,
    collapsed: false,
    minimized: false,
    docked: true,
    size: { width: 340, height: 320 },
    position: { x: 0, y: 0 },
  },
  audio: {
    open: false,
    collapsed: false,
    minimized: false,
    docked: true,
    size: { width: 360, height: 390 },
    position: { x: 0, y: 0 },
  },
  settings: {
    open: false,
    collapsed: false,
    minimized: false,
    docked: false,
    size: { width: 390, height: 430 },
    position: { x: 880, y: 108 },
  },
  sessions: {
    open: false,
    collapsed: false,
    minimized: false,
    docked: false,
    size: { width: 360, height: 350 },
    position: { x: 930, y: 560 },
  },
};

export function createDefaultDesktopUiState(): DesktopUiState {
  const panels = panelIds.reduce((acc, id, index) => {
    acc[id] = {
      ...defaultPanelLayout[id],
      zIndex: index + 1,
    };
    return acc;
  }, {} as DesktopUiState["panels"]);

  return {
    activePanelId: "notes",
    panels,
    scene: {
      mode: "expanded",
      collapsed: false,
      size: { width: 560, height: 320 },
      position: { x: 56, y: 70 },
    },
    launcherCollapsed: false,
  };
}

function getFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getViewportSize() {
  if (typeof window === "undefined") return { width: 1440, height: 900 };
  return {
    width: Math.max(320, window.innerWidth),
    height: Math.max(320, window.innerHeight),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function clampPanelToViewport<T extends { position: { x: number; y: number } }>(
  panel: T,
  viewport = getViewportSize(),
): T {
  return {
    ...panel,
    position: {
      x: clamp(panel.position.x, 0, Math.max(0, viewport.width - MIN_VISIBLE_PANEL_WIDTH)),
      y: clamp(panel.position.y, 0, Math.max(0, viewport.height - MIN_VISIBLE_PANEL_HEIGHT)),
    },
  };
}

function sanitizePanel(
  panel: Partial<DesktopUiState["panels"][DesktopPanelId]> | undefined,
  fallback: DesktopUiState["panels"][DesktopPanelId],
  viewport = getViewportSize(),
) {
  const width = getFiniteNumber(panel?.size?.width, fallback.size.width);
  const height = getFiniteNumber(panel?.size?.height, fallback.size.height);
  const x = getFiniteNumber(panel?.position?.x, fallback.position.x);
  const y = getFiniteNumber(panel?.position?.y, fallback.position.y);

  return clampPanelToViewport({
    open: typeof panel?.open === "boolean" ? panel.open : fallback.open,
    collapsed: typeof panel?.collapsed === "boolean" ? panel.collapsed : fallback.collapsed,
    minimized: typeof panel?.minimized === "boolean" ? panel.minimized : fallback.minimized,
    docked: typeof panel?.docked === "boolean" ? panel.docked : fallback.docked,
    size: {
      width: Math.max(280, width),
      height: Math.max(180, height),
    },
    position: {
      x: x,
      y: y,
    },
    zIndex: Math.max(1, Math.round(getFiniteNumber(panel?.zIndex, fallback.zIndex))),
  }, viewport);
}

export function normalizeDesktopUiState(value: unknown): DesktopUiState {
  const fallback = createDefaultDesktopUiState();
  if (!value || typeof value !== "object") return fallback;

  const maybeState = value as Partial<DesktopUiState>;
  const viewport = getViewportSize();
  const panels = panelIds.reduce((acc, id) => {
    acc[id] = sanitizePanel(maybeState.panels?.[id], fallback.panels[id], viewport);
    return acc;
  }, {} as DesktopUiState["panels"]);

  return {
    activePanelId: panelIds.includes(maybeState.activePanelId as DesktopPanelId)
      ? (maybeState.activePanelId as DesktopPanelId)
      : fallback.activePanelId,
    panels,
    scene: clampPanelToViewport({
      mode: maybeState.scene?.mode === "docked" || maybeState.scene?.mode === "minimized" ? maybeState.scene.mode : "expanded",
      collapsed: typeof maybeState.scene?.collapsed === "boolean" ? maybeState.scene.collapsed : fallback.scene.collapsed,
      size: {
        width: Math.max(360, getFiniteNumber(maybeState.scene?.size?.width, fallback.scene.size.width)),
        height: Math.max(210, getFiniteNumber(maybeState.scene?.size?.height, fallback.scene.size.height)),
      },
      position: {
        x: getFiniteNumber(maybeState.scene?.position?.x, fallback.scene.position.x),
        y: getFiniteNumber(maybeState.scene?.position?.y, fallback.scene.position.y),
      },
    }, viewport),
    launcherCollapsed: typeof maybeState.launcherCollapsed === "boolean" ? maybeState.launcherCollapsed : fallback.launcherCollapsed,
  };
}
