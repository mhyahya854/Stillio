import { ReactNode, useEffect, useRef } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DesktopPanelState } from "@/types/desktop";
import { WindowControls } from "@/components/workspace-desktop/WindowControls";

interface FloatingPanelProps {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  state: DesktopPanelState;
  dockedTop: number;
  compact: boolean;
  children: ReactNode;
  className?: string;
  disableDock?: boolean;
  disableClose?: boolean;
  hideWindowControls?: boolean;
  onFocus: () => void;
  onUpdate: (patch: Partial<DesktopPanelState>) => void;
  onClose: () => void;
  onToggleCollapsed: () => void;
  onToggleMinimized: () => void;
  onToggleDocked: () => void;
}

export function FloatingPanel({
  id,
  title,
  subtitle,
  icon: Icon,
  state,
  dockedTop,
  compact,
  children,
  className,
  disableDock = false,
  disableClose = false,
  hideWindowControls = false,
  onFocus,
  onUpdate,
  onClose,
  onToggleCollapsed,
  onToggleMinimized,
  onToggleDocked,
}: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragActiveRef = useRef(false);
  const pointerMoveHandlerRef = useRef<((event: PointerEvent) => void) | null>(null);
  const pointerUpHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!panelRef.current || compact || state.docked || state.minimized || !state.open) return;

    const observer = new ResizeObserver(() => {
      const element = panelRef.current;
      if (!element) return;
      const width = Math.round(element.offsetWidth);
      const height = Math.round(element.offsetHeight);
      if (Math.abs(width - state.size.width) > 1 || Math.abs(height - state.size.height) > 1) {
        onUpdate({
          size: {
            width: Math.max(280, width),
            height: Math.max(180, height),
          },
        });
      }
    });

    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, [compact, onUpdate, state.docked, state.minimized, state.open, state.size.height, state.size.width]);

  useEffect(() => {
    return () => {
      if (pointerMoveHandlerRef.current) {
        window.removeEventListener("pointermove", pointerMoveHandlerRef.current);
      }
      if (pointerUpHandlerRef.current) {
        window.removeEventListener("pointerup", pointerUpHandlerRef.current);
      }
    };
  }, []);

  if (!state.open || state.minimized) return null;

  const style: React.CSSProperties = compact
    ? {
        position: "fixed",
        left: 12,
        right: 12,
        top: 84,
        maxHeight: "calc(100vh - 164px)",
        zIndex: state.zIndex + 80,
      }
    : state.docked
      ? {
          position: "fixed",
          right: 20,
          top: dockedTop,
          width: Math.min(460, state.size.width),
          height: state.collapsed ? "auto" : Math.max(180, state.size.height),
          zIndex: state.zIndex + 60,
        }
      : {
          position: "fixed",
          left: state.position.x,
          top: state.position.y,
          width: state.size.width,
          height: state.collapsed ? "auto" : state.size.height,
          zIndex: state.zIndex + 60,
        };

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (state.docked || compact) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-window-control]")) return;
    if (target.closest("input, textarea, button, select, [role='slider']")) return;

    const element = panelRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    dragActiveRef.current = true;

    const handleMove = (moveEvent: PointerEvent) => {
      if (!dragActiveRef.current) return;
      const nextX = moveEvent.clientX - dragOffsetRef.current.x;
      const nextY = moveEvent.clientY - dragOffsetRef.current.y;
      const boundedX = Math.max(8, Math.min(window.innerWidth - state.size.width - 8, nextX));
      const boundedY = Math.max(56, Math.min(window.innerHeight - 90, nextY));
      onUpdate({ position: { x: boundedX, y: boundedY } });
    };

    const handleUp = () => {
      dragActiveRef.current = false;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      pointerMoveHandlerRef.current = null;
      pointerUpHandlerRef.current = null;
    };

    pointerMoveHandlerRef.current = handleMove;
    pointerUpHandlerRef.current = handleUp;
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <section
      id={`panel-${id}`}
      ref={panelRef}
      style={style}
      onMouseDown={onFocus}
      className={cn(
        "desktop-panel group glass-panel rounded-2xl overflow-hidden",
        !compact && !state.docked && !state.collapsed && "resize",
        className,
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-3 border-b border-slate-700/30 bg-slate-900/40 px-4 py-3",
          !state.docked && !compact && "cursor-grab active:cursor-grabbing",
          state.collapsed && "border-b-0",
        )}
        onPointerDown={handlePointerDown}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-600/30 bg-slate-800/40 text-cyan-300 shadow-inner">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-slate-100">{title}</p>
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{subtitle}</p>
          </div>
        </div>

        {!hideWindowControls && (
          <WindowControls
            collapsed={state.collapsed}
            docked={state.docked}
            showDockButton={!disableDock}
            showCloseButton={!disableClose}
            onToggleCollapsed={onToggleCollapsed}
            onToggleMinimized={onToggleMinimized}
            onToggleDocked={disableDock ? () => undefined : onToggleDocked}
            onClose={disableClose ? () => undefined : onClose}
          />
        )}
      </header>

      {!state.collapsed && (
        <div className="h-[calc(100%-61px)] overflow-auto bg-slate-950/20 p-4 custom-scrollbar">
          {children}
        </div>
      )}
    </section>
  );
}
