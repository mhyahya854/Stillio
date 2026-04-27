import { LucideIcon, Maximize2, Minimize2, PictureInPicture2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DesktopPanelId, DesktopUiState, SceneViewportMode } from "@/types/desktop";

interface DockItem {
  id: DesktopPanelId;
  label: string;
  icon: LucideIcon;
}

interface DockBarProps {
  items: DockItem[];
  panels: DesktopUiState["panels"];
  activePanelId?: DesktopPanelId;
  sceneMode: SceneViewportMode;
  launcherCollapsed: boolean;
  onToggleLauncher: () => void;
  onSceneModeChange: (mode: SceneViewportMode) => void;
  onPanelToggle: (id: DesktopPanelId) => void;
}

export function DockBar({
  items,
  panels,
  activePanelId,
  sceneMode,
  launcherCollapsed,
  onToggleLauncher,
  onSceneModeChange,
  onPanelToggle,
}: DockBarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 glass-panel rounded-2xl px-3 py-2 shadow-2xl transition-all duration-300">
        <Button variant="ghost" size="sm" className="h-9 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-100" onClick={onToggleLauncher}>
          {launcherCollapsed ? "Open Workspace" : "Collapse"}
        </Button>

        {!launcherCollapsed && (
          <>
            <div className="mx-1 h-7 w-px bg-slate-700/70" />
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant={sceneMode === "expanded" ? "subtle" : "ghost"}
                className="h-9 w-9"
                onClick={() => onSceneModeChange("expanded")}
                aria-label="Expand scene"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={sceneMode === "docked" ? "subtle" : "ghost"}
                className="h-9 w-9"
                onClick={() => onSceneModeChange("docked")}
                aria-label="Dock scene"
              >
                <PictureInPicture2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={sceneMode === "minimized" ? "subtle" : "ghost"}
                className="h-9 w-9"
                onClick={() => onSceneModeChange("minimized")}
                aria-label="Minimize scene"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="mx-1 h-7 w-px bg-slate-700/70" />
            <div className="flex items-center gap-1">
              {items.map((item) => {
                const panel = panels[item.id];
                const active = panel.open && !panel.minimized;
                return (
                  <Button
                    key={item.id}
                    size="sm"
                    variant={active ? "subtle" : "ghost"}
                    className={cn(
                      "h-9 gap-2 px-3 transition-all duration-300",
                      activePanelId === item.id && "bg-slate-800/60 ring-1 ring-cyan-500/40 text-cyan-200",
                    )}
                    onClick={() => onPanelToggle(item.id)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden text-xs md:inline">{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
