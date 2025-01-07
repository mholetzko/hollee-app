'use client'

import { Segment } from '../types'
import { SEGMENT_COLORS, WORKOUT_LABELS } from '../constants'
import { getIntensityColor } from '../utils'

interface WorkoutDisplayProps {
  segment?: Segment
  isNext?: boolean
}

export const WorkoutDisplay = ({ segment, isNext = false }: WorkoutDisplayProps) => {
  if (!segment) return null;

  const intensityColor = getIntensityColor(segment.intensity);
  const segmentColor = SEGMENT_COLORS[segment.type];

  return (
    <div className={`flex-1 p-6 rounded-lg transition-all duration-300 relative overflow-hidden
      ${isNext ? 'opacity-50' : ''}`}
    >
      {/* Background with workout type color */}
      <div className={`absolute inset-0 ${segmentColor} opacity-30`} />
      
      {/* Intensity overlay */}
      <div className={`absolute inset-0 ${intensityColor} opacity-40`} />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="text-lg font-bold mb-1">
          {isNext ? 'Next:' : 'Current:'} {segment.title}
        </div>
        <div className="text-2xl font-bold mb-2">
          {WORKOUT_LABELS[segment.type]}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm opacity-75">
            Duration: {((segment.endTime - segment.startTime) / 1000).toFixed(0)}s
          </div>
          <div className={`text-sm font-bold ${
            segment.intensity === -1 ? 'text-red-300 animate-pulse' : ''
          }`}>
            {segment.intensity === -1 ? 'BURN' : `${segment.intensity}%`}
          </div>
        </div>
      </div>
    </div>
  );
}; 