import { useCallback, useEffect, useRef, useState } from "react";
import { AudioTrack } from "@/types/workspace";

interface AmbientAudioOptions {
  masterVolume: number;
  muted: boolean;
}

export function useAmbientAudio(tracks: AudioTrack[], { masterVolume, muted }: AmbientAudioOptions) {
  const audioByIdRef = useRef(new Map<string, HTMLAudioElement>());
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getOrCreateAudio = useCallback((track: AudioTrack) => {
    const existing = audioByIdRef.current.get(track.id);
    if (existing && existing.src.endsWith(track.src)) return existing;

    if (existing) {
      existing.pause();
      audioByIdRef.current.delete(track.id);
    }

    const audio = new Audio(track.src);
    audio.loop = true;
    audio.preload = "none";
    audio.addEventListener("error", () => {
      setErrors((current) => ({
        ...current,
        [track.id]: "Missing or unsupported local audio file.",
      }));
    });
    audioByIdRef.current.set(track.id, audio);
    return audio;
  }, []);

  useEffect(() => {
    const knownIds = new Set(tracks.map((track) => track.id));
    audioByIdRef.current.forEach((audio, id) => {
      if (!knownIds.has(id)) {
        audio.pause();
        audioByIdRef.current.delete(id);
      }
    });

    tracks.forEach((track) => {
      const audio = getOrCreateAudio(track);
      audio.volume = muted ? 0 : Math.max(0, Math.min(1, (track.volume / 100) * (masterVolume / 100)));

      if (!isUnlocked || !track.active || muted) {
        audio.pause();
        return;
      }

      audio.play().catch(() => {
        setErrors((current) => ({
          ...current,
          [track.id]: "Audio playback was blocked or the local file could not be played.",
        }));
      });
    });
  }, [getOrCreateAudio, isUnlocked, masterVolume, muted, tracks]);

  useEffect(() => {
    const audioById = audioByIdRef.current;
    return () => {
      audioById.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioById.clear();
    };
  }, []);

  const unlockAudio = useCallback(async () => {
    setIsUnlocked(true);
    setErrors({});

    await Promise.allSettled(
      tracks
        .filter((track) => track.active && !muted)
        .map(async (track) => {
          const audio = getOrCreateAudio(track);
          audio.volume = Math.max(0, Math.min(1, (track.volume / 100) * (masterVolume / 100)));
          await audio.play();
        }),
    );
  }, [getOrCreateAudio, masterVolume, muted, tracks]);

  const muteAll = useCallback(() => {
    audioByIdRef.current.forEach((audio) => audio.pause());
  }, []);

  const setMasterVolume = useCallback(
    (volume: number) => {
      tracks.forEach((track) => {
        const audio = audioByIdRef.current.get(track.id);
        if (!audio) return;
        audio.volume = muted ? 0 : Math.max(0, Math.min(1, (track.volume / 100) * (volume / 100)));
      });
    },
    [muted, tracks],
  );

  return {
    isUnlocked,
    unlockAudio,
    setMasterVolume,
    muteAll,
    errors,
  };
}
