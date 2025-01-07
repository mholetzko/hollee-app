'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon, StopIcon } from "@radix-ui/react-icons";
import { formatDuration } from '../utils';

interface TransportControlsProps {
  isPlaying: boolean;
  position: number;
  duration: number;
  onPlay: () => void;
  onStop: () => void;
  onSeek: (position: number) => void;
  isReady: boolean;
}

export const TransportControls: React.FC<TransportControlsProps> = ({
  isPlaying,
  position,
  duration,
  onPlay,
  onStop,
  onSeek,
  isReady,
}) => {
  // Add dragging state for the progress bar
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(position);
  const progressRef = useRef<HTMLDivElement>(null);

  const handleStartDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = progressRef.current?.getBoundingClientRect();
    if (rect) {
      const percent = (e.clientX - rect.left) / rect.width;
      setDragPosition(percent * duration);
    }
  };

  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );
    setDragPosition(percent * duration);
  }, [isDragging, duration]);

  const handleEndDrag = useCallback(() => {
    if (isDragging) {
      onSeek(dragPosition);
      setIsDragging(false);
    }
  }, [isDragging, dragPosition, onSeek]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDrag);
      window.addEventListener("mouseup", handleEndDrag);
      return () => {
        window.removeEventListener("mousemove", handleDrag);
        window.removeEventListener("mouseup", handleEndDrag);
      };
    }
  }, [isDragging, handleDrag, handleEndDrag]);

  // Update dragPosition when not dragging
  useEffect(() => {
    if (!isDragging) {
      setDragPosition(position);
    }
  }, [position, isDragging]);

  return (
    <div className="flex items-center gap-4 bg-black/20 p-4 rounded-lg">
      <div className="flex gap-2">
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full w-10 h-10"
          onClick={onPlay}
          disabled={!isReady}
        >
          {!isReady ? (
            <div className="animate-spin h-4 w-4 border-2 border-white/50 rounded-full border-t-transparent" />
          ) : isPlaying ? (
            <PauseIcon className="w-5 h-5" />
          ) : (
            <PlayIcon className="w-5 h-5" />
          )}
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full w-10 h-10"
          onClick={onStop}
          disabled={!isReady}
        >
          <StopIcon className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex items-center gap-2">
        <div className="text-sm font-mono">
          {formatDuration(isDragging ? dragPosition : position)}
        </div>
        <div 
          ref={progressRef}
          className="flex-1 h-2 bg-white/10 rounded-full cursor-pointer group"
          onMouseDown={handleStartDrag}
        >
          <div 
            className="h-full bg-white/50 rounded-full relative"
            style={{
              width: `${
                ((isDragging ? dragPosition : position) / duration) * 100
              }%`,
            }}
          >
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full 
              opacity-0 group-hover:opacity-100 transition-opacity" 
            />
          </div>
        </div>
        <div className="text-sm font-mono">{formatDuration(duration)}</div>
      </div>
    </div>
  );
}; 