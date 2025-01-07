'use client';

import React from 'react';
import { PlayIcon, PauseIcon, StopIcon, ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

interface TransportControlsProps {
  isPlaying: boolean;
  position: number;
  duration: number;
  onPlay: () => void;
  onStop: () => void;
  onNextSegment: () => void;
  onPreviousSegment: () => void;
  isReady: boolean;
}

export const TransportControls: React.FC<TransportControlsProps> = ({
  isPlaying,
  position,
  duration,
  onPlay,
  onStop,
  onNextSegment,
  onPreviousSegment,
  isReady,
}) => {
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-4">
      {/* Previous Segment button */}
      <button
        onClick={onPreviousSegment}
        disabled={!isReady}
        className={`p-2 rounded-full transition-colors
          ${isReady 
            ? 'hover:bg-white/10 active:bg-white/20' 
            : 'opacity-50 cursor-not-allowed'
          }`}
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>

      {/* Play/Pause button */}
      <button
        onClick={onPlay}
        disabled={!isReady}
        className={`p-2 rounded-full transition-colors
          ${isReady 
            ? 'hover:bg-white/10 active:bg-white/20' 
            : 'opacity-50 cursor-not-allowed'
          }`}
      >
        {isPlaying ? (
          <PauseIcon className="w-8 h-8" />
        ) : (
          <PlayIcon className="w-8 h-8" />
        )}
      </button>

      {/* Stop button */}
      <button
        onClick={onStop}
        disabled={!isReady}
        className={`p-2 rounded-full transition-colors
          ${isReady 
            ? 'hover:bg-white/10 active:bg-white/20' 
            : 'opacity-50 cursor-not-allowed'
          }`}
      >
        <StopIcon className="w-8 h-8" />
      </button>

      {/* Next Segment button */}
      <button
        onClick={onNextSegment}
        disabled={!isReady}
        className={`p-2 rounded-full transition-colors
          ${isReady 
            ? 'hover:bg-white/10 active:bg-white/20' 
            : 'opacity-50 cursor-not-allowed'
          }`}
      >
        <ChevronRightIcon className="w-6 h-6" />
      </button>

      {/* Time display */}
      <div className="font-mono text-sm">
        {formatTime(position)} / {formatTime(duration)}
      </div>
    </div>
  );
}; 