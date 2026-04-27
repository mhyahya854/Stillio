import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DesktopPanelId, DesktopUiState } from "@/types/desktop";

interface LauncherItem {
  id: DesktopPanelId;
  label: string;
  icon: LucideIcon;
}

interface PanelLauncherProps {
  title: string;
  subtitle: string;
  items: LauncherItem[];
  panels: DesktopUiState["panels"];
  onOpenPanel: (id: DesktopPanelId) => void;
}

export function PanelLauncher({ title, subtitle, items, panels, onOpenPanel }: PanelLauncherProps) {
  return (
    <div className="glass-panel rounded-2xl px-5 py-5 shadow-2xl transition-all duration-300">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">{subtitle}</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-100">{title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) => {
          const panel = panels[item.id];
          const active = panel.open && !panel.minimized;
          return (
            <Button
              key={item.id}
              variant={active ? "subtle" : "ghost"}
              size="sm"
              className={cn("h-9 gap-2 px-4 transition-all duration-300", active && "bg-slate-800/60 ring-1 ring-cyan-500/40 text-cyan-200")}
              onClick={() => onOpenPanel(item.id)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
