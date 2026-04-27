import { ReactNode } from "react";

interface WorkspaceShellProps {
  immersiveViewport: ReactNode;
  toolbar: ReactNode;
  floatingPanels: ReactNode;
  dock: ReactNode;
}

export function WorkspaceShell({ immersiveViewport, toolbar, floatingPanels, dock }: WorkspaceShellProps) {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {immersiveViewport}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(8,145,178,0.08),transparent_28%),radial-gradient(circle_at_78%_12%,rgba(22,163,74,0.08),transparent_30%)]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pt-4 md:px-6 md:pt-6">
        <div className="pointer-events-auto">{toolbar}</div>
      </div>

      <div className="absolute inset-0 z-30">{floatingPanels}</div>
      {dock}
    </div>
  );
}
