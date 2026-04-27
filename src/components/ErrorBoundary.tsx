import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Copy, Download, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { MANAGED_LOCAL_STORAGE_KEYS, WORKSPACE_STORAGE_KEY } from "@/lib/storage-keys";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleExportBackup = () => {
    try {
      const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (!raw) {
        toast({ title: "No saved workspace found", description: "There is no local workspace data to export." });
        return;
      }

      const blob = new Blob([raw], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `northstar-recovery-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast({ title: "Recovery backup exported", description: "The raw local workspace data was downloaded." });
    } catch {
      toast({ title: "Recovery export failed", description: "The browser could not export local data.", variant: "destructive" });
    }
  };

  private handleHardReset = () => {
    if (confirm("This will permanently delete all your local data and reset the app. Are you sure?")) {
      try {
        MANAGED_LOCAL_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
        window.location.reload();
      } catch {
        toast({
          title: "Reset failed",
          description: "The browser could not clear this workspace's local data.",
          variant: "destructive",
        });
      }
    }
  };

  private handleCopyError = async () => {
    const details = this.state.error?.stack || this.state.error?.message || "Unknown error";
    try {
      await navigator.clipboard.writeText(details);
      toast({ title: "Error details copied", description: "Paste them into a bug report or recovery note." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard access is unavailable.", variant: "destructive" });
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
          <div className="w-full max-w-md rounded-2xl border border-red-900/50 bg-red-950/10 p-8 text-center backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/20 text-red-500">
              <AlertCircle size={32} />
            </div>
            
            <h1 className="mb-2 text-2xl font-bold tracking-tight">Something went wrong</h1>
            <p className="mb-8 text-slate-400">
              The application encountered an unexpected error. Your data is still stored locally.
            </p>

            <div className="space-y-3">
              <Button onClick={this.handleReload} className="w-full gap-2 bg-slate-100 text-slate-950 hover:bg-slate-200">
                <RefreshCcw size={16} />
                Reload Application
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={this.handleExportBackup} variant="outline" className="gap-2 border-slate-700 bg-slate-900/50 hover:bg-slate-800">
                  <Download size={16} />
                  Backup Data
                </Button>
                <Button onClick={this.handleCopyError} variant="outline" className="gap-2 border-slate-700 bg-slate-900/50 hover:bg-slate-800">
                  <Copy size={16} />
                  Copy Error
                </Button>
              </div>

              <Button onClick={this.handleHardReset} variant="outline" className="w-full gap-2 border-red-900/30 bg-red-950/20 text-red-400 hover:bg-red-950/40 hover:text-red-300">
                  <Trash2 size={16} />
                  Reset Local Workspace
              </Button>
            </div>

            {this.state.error && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-xs uppercase tracking-widest text-slate-500 hover:text-slate-400">
                  Error Details
                </summary>
                <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-slate-900/80 p-4 text-[10px] font-mono text-red-400/80">
                  {this.state.error.stack || this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
