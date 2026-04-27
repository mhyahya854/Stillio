import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAmbientAudio } from "@/hooks/use-ambient-audio";
import { AudioTrack } from "@/types/workspace";

class MockAudio {
  public loop = false;
  public preload = "";
  public volume = 1;
  public src: string;
  public play = vi.fn(() => Promise.resolve());
  public pause = vi.fn();
  public addEventListener = vi.fn();

  constructor(src: string) {
    this.src = src;
  }
}

const tracks: AudioTrack[] = [
  { id: "rain", name: "Rain", icon: "CloudRain", src: "/audio/rain.wav", volume: 50, active: true },
  { id: "wind", name: "Wind", icon: "Wind", src: "/audio/wind.wav", volume: 20, active: false },
];

describe("useAmbientAudio", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("unlocks audio and plays active local tracks", async () => {
    const audioFactory = vi.fn((src: string) => new MockAudio(src));
    vi.stubGlobal("Audio", audioFactory);

    const { result } = renderHook(() => useAmbientAudio(tracks, { masterVolume: 80, muted: false }));

    await act(async () => {
      await result.current.unlockAudio();
    });

    expect(result.current.isUnlocked).toBe(true);
    expect(audioFactory).toHaveBeenCalledWith("/audio/rain.wav");
    expect((audioFactory.mock.results[0].value as MockAudio).play).toHaveBeenCalled();
    expect((audioFactory.mock.results[0].value as MockAudio).volume).toBeCloseTo(0.4);
  });

  it("pauses all tracks when muted", async () => {
    const audioFactory = vi.fn((src: string) => new MockAudio(src));
    vi.stubGlobal("Audio", audioFactory);

    const { result, rerender } = renderHook(
      ({ muted }) => useAmbientAudio(tracks, { masterVolume: 100, muted }),
      { initialProps: { muted: false } },
    );

    await act(async () => {
      await result.current.unlockAudio();
    });

    rerender({ muted: true });

    expect((audioFactory.mock.results[0].value as MockAudio).pause).toHaveBeenCalled();
  });
});
