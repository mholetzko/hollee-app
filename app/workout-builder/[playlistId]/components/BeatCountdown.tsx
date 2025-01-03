import React from 'react';
import { Segment } from '../types';
import { SEGMENT_COLORS } from '../constants';

interface BeatCountdownProps {
  currentPosition: number;
  nextSegmentStart: number;
  bpm: number;
  nextSegment?: Segment;
}

export const BeatCountdown = ({ 
  currentPosition, 
  nextSegmentStart,
  bpm,
  nextSegment 
}: BeatCountdownProps) => {
  const timeToNext = nextSegmentStart - currentPosition;
  const beatsToNext = Math.ceil((timeToNext / 60000) * bpm);

  const getCountdownColor = (beats: number) => {
    if (beats <= 4) return 'text-red-400';
    if (beats <= 8) return 'text-yellow-400';
    return 'text-white';
  };

  return (
    <div className="flex-1 p-6 bg-black/20 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={`absolute w-64 h-64 rounded-full border-4 opacity-20
            ${getCountdownColor(beatsToNext)}
            animate-ping-slow`}
        />
        <div 
          className={`absolute w-48 h-48 rounded-full border-2 opacity-30
            ${getCountdownColor(beatsToNext)}
            animate-spin-slow`}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        <div className={`text-8xl font-bold font-mono mb-2 ${getCountdownColor(beatsToNext)}`}>
          {beatsToNext}
        </div>
        <div className="text-xl text-gray-400 mb-4">
          {formatTime(nextSegmentStart - currentPosition)} left
        </div>
        {nextSegment && (
          <div className={`text-lg px-3 py-1 rounded-full backdrop-blur-sm
            ${SEGMENT_COLORS[nextSegment.type]} 
            ${getIntensityColor(nextSegment.intensity)}
            shadow-glow`}
          >
            Next: {WORKOUT_LABELS[nextSegment.type]}
            {nextSegment.intensity === -1 ? ' BURN!' : ` ${nextSegment.intensity}%`}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format time
const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
};

// Helper function for intensity colors
const getIntensityColor = (intensity: number) => {
  if (intensity === -1) return 'bg-red-500/50'; // BURN mode
  if (intensity > 90) return 'bg-red-500/50';    // 90-100%
  if (intensity > 75) return 'bg-yellow-500/50';  // 75-90%
  if (intensity > 55) return 'bg-green-500/50';   // 55-75%
  if (intensity > 25) return 'bg-blue-500/50';    // 25-55%
  return 'bg-white/50';                           // 0-25%
};

// Workout labels
const WORKOUT_LABELS: Record<string, string> = {
  PLS: 'PLS',
  SEATED_ROAD: 'SeRo',
  SEATED_CLIMB: 'SeCl',
  STANDING_CLIMB: 'StCl',
  STANDING_JOGGING: 'StJo',
  JUMPS: 'Jump',
  WAVES: 'Wave',
  PUSHES: 'Push',
};