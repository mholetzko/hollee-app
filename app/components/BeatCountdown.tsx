import React from 'react';
import { Segment } from '../workout-builder/[playlistId]/types';
import { WORKOUT_LABELS } from '../workout-builder/[playlistId]/constants';

interface BeatCountdownProps {
  currentPosition: number;
  nextSegmentStart: number;
  bpm: number;
  nextSegment?: Segment;
}

export const BeatCountdown: React.FC<BeatCountdownProps> = ({
  currentPosition,
  nextSegmentStart,
  bpm,
  nextSegment
}) => {
  // Simple calculations without state or effects
  const timeUntilNext = nextSegmentStart - currentPosition;
  const beatDuration = 60000 / bpm;
  const beatsUntilNext = Math.ceil(timeUntilNext / beatDuration);
  
  if (!nextSegment) {
    return null;
  }

  return (
    <div className="flex items-center justify-center px-8 py-4 bg-white/5 rounded-lg">
      <div className={`text-4xl font-mono font-bold ${beatsUntilNext <= 8 ? 'text-red-400' : ''}`}>
        {beatsUntilNext}
      </div>
      <div className="ml-3 text-sm text-gray-400">
        beats until<br />
        {WORKOUT_LABELS[nextSegment.type]}
      </div>
    </div>
  );
}; 