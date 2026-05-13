"use client";

import { Pause, Play, Volume2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type RosaryAudioPlayerProps = {
  src: string;
};

function formatAudioTime(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function RosaryAudioPlayer({ src }: RosaryAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackError(null);
  }, [src]);

  const progressMax = duration > 0 ? duration : 1;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = volume * 100;

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    setPlaybackError(null);

    if (isPlaying) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
    } catch {
      setPlaybackError("Audio could not be played right now.");
      setIsPlaying(false);
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    setVolume(audio.volume);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentTime(audio.currentTime);
  };

  const handleSeek = (value: string) => {
    const nextTime = Number(value);
    const audio = audioRef.current;
    if (!Number.isFinite(nextTime) || !audio) return;

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleVolumeChange = (value: string) => {
    const nextVolume = Number(value);
    const audio = audioRef.current;
    if (!Number.isFinite(nextVolume) || !audio) return;

    audio.volume = nextVolume;
    setVolume(nextVolume);
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto w-full max-w-4xl rounded-[1.25rem] border border-[rgba(168,129,81,0.42)] bg-[linear-gradient(180deg,rgba(255,248,235,0.94),rgba(238,222,193,0.9))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_22px_42px_-22px_rgba(42,25,15,0.9)] backdrop-blur-md dark:bg-[linear-gradient(180deg,rgba(49,34,23,0.94),rgba(32,24,19,0.92))] sm:p-5">
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onError={() => setPlaybackError("Rosary audio is temporarily unavailable.")}
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 sm:contents">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label={isPlaying ? "Pause Rosary Audio" : "Play Rosary Audio"}
              aria-pressed={isPlaying}
              onClick={togglePlayback}
              className="h-12 w-12 shrink-0 rounded-full border-[rgba(138,95,50,0.52)] bg-[linear-gradient(180deg,#f6ead5,#ddc39a)] text-[#5e3a1d] shadow-[inset_0_1px_0_rgba(255,255,255,0.58),0_12px_18px_-16px_rgba(42,25,15,0.82)] hover:bg-[linear-gradient(180deg,#fff3dd,#e5cfa8)] dark:bg-[linear-gradient(180deg,#4e3724,#35261b)] dark:text-[#f0dec1]"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <div className="min-w-0 sm:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b5430] dark:text-[#dcc39c]">
                Rosary Audio
              </p>
              <p className="mt-1 text-xs tabular-nums text-monastic-1">
                {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="hidden items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#7b5430] dark:text-[#dcc39c] sm:flex">
              <span>Rosary Audio</span>
              <span className="tabular-nums text-monastic-1">
                {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={progressMax}
              step={1}
              value={Math.min(currentTime, progressMax)}
              aria-label="Rosary audio progress"
              aria-valuetext={`${formatAudioTime(currentTime)} of ${formatAudioTime(duration)}`}
              onChange={(event) => handleSeek(event.target.value)}
              className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-full border border-[rgba(138,95,50,0.22)] bg-[rgba(168,129,81,0.18)] accent-[#8a5f32] sm:mt-3"
              style={{
                background: `linear-gradient(90deg, #8a5f32 ${progressPercent}%, rgba(168,129,81,0.18) ${progressPercent}%)`,
              }}
            />
          </div>

          <label className="flex items-center gap-2 text-monastic-1 sm:w-36">
            <Volume2 className="h-4 w-4 shrink-0 text-[#8a5f32] dark:text-[#d8bd91]" />
            <span className="sr-only">Rosary audio volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              aria-label="Rosary audio volume"
              onChange={(event) => handleVolumeChange(event.target.value)}
              className="h-2 w-full cursor-pointer appearance-none rounded-full border border-[rgba(138,95,50,0.22)] bg-[rgba(168,129,81,0.18)] accent-[#8a5f32]"
              style={{
                background: `linear-gradient(90deg, #8a5f32 ${volumePercent}%, rgba(168,129,81,0.18) ${volumePercent}%)`,
              }}
            />
          </label>

          <Link
            href="/today"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-[rgba(138,95,50,0.42)] bg-[rgba(255,248,235,0.62)] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#6d4729] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:bg-[rgba(255,248,235,0.84)] hover:text-[#4d3019] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:bg-[rgba(49,34,23,0.64)] dark:text-[#f0dec1]"
          >
            Today
          </Link>
        </div>

        {playbackError ? (
          <p className="mt-3 text-sm leading-6 text-monastic-1">{playbackError}</p>
        ) : null}
      </div>
    </div>
  );
}
