'use client';

import React from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  PlusIcon, 
  ScissorsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RowSpacingIcon
} from "@radix-ui/react-icons";
import { Button } from '@/components/ui/button';

interface TransportControlsProps {
  isPlaying: boolean;
  position: number;
  duration: number;
  onPlay: () => void;
  onStop: () => void;
  onNextSegment: () => void;
  onPreviousSegment: () => void;
  onAddSegment: () => void;
  onSplitSegment: () => void;
  isReady: boolean;
  canSplit: boolean;
  onMergeSegment: () => void;
  canMerge: boolean;
}

export const TransportControls: React.FC<TransportControlsProps> = ({
  isPlaying,
  position,
  duration,
  onPlay,
  onStop,
  onNextSegment,
  onPreviousSegment,
  onAddSegment,
  onSplitSegment,
  isReady,
  canSplit,
  onMergeSegment,
  canMerge,
}) => {
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-4">
      {/* Navigation and playback controls */}
      <div className="flex items-center gap-2">
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
      </div>

      {/* Time display */}
      <div className="font-mono text-sm">
        {formatTime(position)} / {formatTime(duration)}
      </div>

      {/* Segment controls */}
      <div className="flex items-center gap-2 ml-auto">
        <Button
          onClick={onSplitSegment}
          disabled={!canSplit}
          size="sm"
          variant="ghost"
          className="flex items-center gap-1"
        >
          <ScissorsIcon className="w-4 h-4" />
          Split
        </Button>
        <Button
          onClick={onMergeSegment}
          disabled={!canMerge}
          size="sm"
          variant="ghost"
          className="flex items-center gap-1"
        >
          <RowSpacingIcon className="w-4 h-4" />
          Merge
        </Button>
        <Button
          onClick={onAddSegment}
          size="sm"
          variant="ghost"
          className="flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" />
          Add
        </Button>
      </div>
    </div>
  );
}; 