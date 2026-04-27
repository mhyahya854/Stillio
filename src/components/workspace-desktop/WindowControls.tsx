import { Minus, PanelBottom, PanelTop, Pin, PinOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WindowControlsProps {
  collapsed: boolean;
  docked: boolean;
  showDockButton?: boolean;
  showCloseButton?: boolean;
  onToggleCollapsed: () => void;
  onToggleMinimized: () => void;
  onToggleDocked: () => void;
  onClose: () => void;
}

export function WindowControls({
  collapsed,
  docked,
  showDockButton = true,
  showCloseButton = true,
  onToggleCollapsed,
  onToggleMinimized,
  onToggleDocked,
  onClose,
}: WindowControlsProps) {
  return (
    <div className="flex items-center gap-1" data-window-control>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expand panel" : "Collapse panel"}
      >
        {collapsed ? <PanelBottom className="h-4 w-4" /> : <PanelTop className="h-4 w-4" />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onToggleMinimized}
        aria-label="Minimize panel"
      >
        <Minus className="h-4 w-4" />
      </Button>
      {showDockButton && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleDocked}
          aria-label={docked ? "Undock panel" : "Dock panel"}
        >
          {docked ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
        </Button>
      )}
      {showCloseButton && (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-rose-200 hover:text-rose-100" onClick={onClose} aria-label="Close panel">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
