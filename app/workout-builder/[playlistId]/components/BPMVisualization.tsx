'use client'

import {  useRef } from 'react';

interface BPMVisualizationProps {
  bpm: number;
  duration: number;
  currentPosition: number;
  isPlaying: boolean;
  onSeek?: (position: number) => void;
}

export const BPMVisualization: React.FC<BPMVisualizationProps> = ({
  bpm,
  duration,
  currentPosition,
  isPlaying,
  onSeek
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !onSeek) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const position = percentage * duration;
    onSeek(position);
  };

  return (
    <div 
      ref={containerRef}
      className="relative h-12 bg-white/5 rounded cursor-pointer group"
      onClick={handleClick}
    >
      {/* Progress bar */}
      <div 
        className="absolute h-full bg-white/10 transition-all duration-100"
        style={{ width: `${(currentPosition / duration) * 100}%` }}
      />

      {/* Beat markers */}
      <div className="absolute inset-0">
        {Array.from({
          length: Math.floor(duration / (60000 / bpm)),
        }).map((_, i) => {
          const position = ((i * (60000 / bpm)) / duration) * 100;
          const isMeasureStart = i % 4 === 0;
          const isHalfBeat = i % 2 === 0;
          
          return (
            <div
              key={`beat-${i}`}
              className={`absolute top-0 bottom-0 w-px transition-opacity
                ${isMeasureStart 
                  ? "bg-white/30" 
                  : isHalfBeat 
                  ? "bg-white/20" 
                  : "bg-white/10"
                }
                ${isPlaying ? "opacity-100" : "opacity-50"}
              `}
              style={{ 
                left: `${position}%`,
                height: isMeasureStart ? "100%" : isHalfBeat ? "75%" : "50%"
              }}
            />
          );
        })}
      </div>

      {/* Hover time indicator */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100">
        <div className="absolute top-0 bottom-0 w-px bg-white/50 pointer-events-none"
          style={{ 
            left: `${(currentPosition / duration) * 100}%`,
          }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 
            bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {formatTime(currentPosition)}
          </div>
        </div>
      </div>
    </div>
  );
};

const formatTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}; 