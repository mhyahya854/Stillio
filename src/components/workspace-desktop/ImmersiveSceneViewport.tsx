import { Maximize2, Minimize2, Pause, Play, PictureInPicture2, Sparkles, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FloatingPanel } from "@/components/workspace-desktop/FloatingPanel";
import { PanelPosition, PanelSize, SceneViewportMode } from "@/types/desktop";
import { Space } from "@/types/workspace";
import { cn } from "@/lib/utils";

interface ImmersiveSceneViewportProps {
  activeSpace: Space;
  spaces: Space[];
  mode: SceneViewportMode;
  collapsed: boolean;
  position: PanelPosition;
  size: PanelSize;
  reducedMotion: boolean;
  onModeChange: (mode: SceneViewportMode) => void;
  onCollapsedChange: (value: boolean) => void;
  onPositionChange: (position: PanelPosition) => void;
  onSizeChange: (size: PanelSize) => void;
  onSpaceSelect: (id: string) => void;
}

export function ImmersiveSceneViewport({
  activeSpace,
  spaces,
  mode,
  collapsed,
  position,
  size,
  reducedMotion,
  onModeChange,
  onCollapsedChange,
  onPositionChange,
  onSizeChange,
  onSpaceSelect,
}: ImmersiveSceneViewportProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setVideoError(false);
    setIsLoading(activeSpace.mediaType === "video");
    setIsPlaying(true);
  }, [activeSpace.id, activeSpace.mediaType]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => setVideoError(true));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const togglePlayback = () => setIsPlaying(!isPlaying);

  const renderMedia = (isDocked = false) => {
    const isVideo = activeSpace.mediaType === "video" && !reducedMotion && !videoError;

    if (isVideo) {
      return (
        <div className="relative h-full w-full">
          <video
            ref={videoRef}
            src={activeSpace.videoSrc}
            poster={activeSpace.posterImage || activeSpace.image}
            autoPlay
            muted
            loop
            playsInline
            onLoadStart={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            onError={() => {
              setVideoError(true);
              setIsLoading(false);
            }}
            className={cn(
              "h-full w-full object-cover transition-all duration-700",
              isDocked ? "h-[220px]" : ""
            )}
            style={{
              opacity: mode === "minimized" ? 0.08 : mode === "docked" && !isDocked ? 0.32 : 1,
              transform: mode === "expanded" && !reducedMotion && !isDocked ? "scale(1.03)" : "scale(1)",
            }}
          />
          {isLoading && !isDocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            </div>
          )}
        </div>
      );
    }

    return (
      <img
        src={videoError ? (activeSpace.fallbackImage || activeSpace.image) : activeSpace.image}
        alt={activeSpace.title}
        width={1920}
        height={1080}
        className={cn(
          "h-full w-full object-cover transition-all duration-700",
          isDocked ? "h-[220px]" : ""
        )}
        style={{
          opacity: mode === "minimized" ? 0.08 : mode === "docked" && !isDocked ? 0.32 : 1,
          transform: mode === "expanded" && !reducedMotion && !isDocked ? "scale(1.03)" : "scale(1)",
        }}
      />
    );
  };

  return (
    <>
      <div className="absolute inset-0 overflow-hidden bg-slate-950">
        {renderMedia()}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.2),transparent_34%),radial-gradient(circle_at_85%_12%,rgba(94,234,212,0.12),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.18),rgba(2,6,23,0.9))]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.44)_0%,rgba(2,6,23,0.8)_55%,rgba(2,6,23,0.9)_100%)]" />
      </div>

      <div className="pointer-events-none absolute left-5 top-5 z-10 flex max-w-2xl flex-wrap items-center gap-3">
        <div className="pointer-events-auto rounded-xl border border-slate-700/80 bg-slate-950/72 px-4 py-3 backdrop-blur-lg">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Immersive Workspace</p>
          <div className="mt-1 flex items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-100">{activeSpace.title}</h2>
            {activeSpace.mediaType === "video" && !reducedMotion && !videoError && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-slate-400 hover:text-slate-100"
                onClick={togglePlayback}
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
            )}
            {videoError && (
              <div className="flex items-center gap-1.5 text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Video Error</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-300">{activeSpace.ambienceLabel}</p>
        </div>

        <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-950/74 p-1 backdrop-blur-lg">
          <Button size="icon" variant={mode === "expanded" ? "subtle" : "ghost"} className="h-8 w-8" onClick={() => onModeChange("expanded")}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant={mode === "docked" ? "subtle" : "ghost"} className="h-8 w-8" onClick={() => onModeChange("docked")}>
            <PictureInPicture2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant={mode === "minimized" ? "subtle" : "ghost"} className="h-8 w-8" onClick={() => onModeChange("minimized")}>
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="pointer-events-none absolute right-5 top-5 z-10">
        <div className="pointer-events-auto flex max-w-[58vw] items-center gap-2 overflow-auto rounded-xl border border-slate-700/80 bg-slate-950/72 p-2 backdrop-blur-lg">
          {spaces.map((space) => (
            <button
              key={space.id}
              type="button"
              onClick={() => onSpaceSelect(space.id)}
              className={cn(
                "rounded-md px-3 py-2 text-left text-xs transition",
                activeSpace.id === space.id ? "bg-cyan-400/18 text-cyan-100" : "text-slate-300 hover:bg-slate-800/80 hover:text-slate-100"
              )}
            >
              <div className="flex items-center gap-2">
                <p className="font-medium">{space.title}</p>
                {space.mediaType === "video" && (
                  <div className="h-1 w-1 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{space.category}</p>
            </button>
          ))}
        </div>
      </div>

      {mode === "minimized" && (
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
          <div className="rounded-xl border border-slate-700/70 bg-slate-950/68 px-5 py-3 text-sm text-slate-300 backdrop-blur-xl">
            Scene minimized. Reopen from dock when you want full immersion.
          </div>
        </div>
      )}

      {mode === "docked" && (
        <FloatingPanel
          id="scene"
          title="Scene"
          subtitle="Docked viewport"
          icon={Sparkles}
          compact={false}
          dockedTop={72}
          state={{
            open: true,
            collapsed,
            minimized: false,
            docked: false,
            position,
            size,
            zIndex: 2,
          }}
          disableDock
          hideWindowControls={false}
          onFocus={() => undefined}
          onUpdate={(patch) => {
            if (patch.position) onPositionChange(patch.position);
            if (patch.size) onSizeChange(patch.size);
            if (typeof patch.collapsed === "boolean") onCollapsedChange(patch.collapsed);
          }}
          onClose={() => onModeChange("minimized")}
          onToggleCollapsed={() => onCollapsedChange(!collapsed)}
          onToggleMinimized={() => onModeChange("minimized")}
          onToggleDocked={() => undefined}
        >
          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border border-slate-700/70 bg-slate-950">
              {renderMedia(true)}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="subtle" onClick={() => onModeChange("expanded")}>
                Expand scene
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onModeChange("minimized")}>
                Minimize
              </Button>
            </div>
          </div>
        </FloatingPanel>
      )}
    </>
  );
}
