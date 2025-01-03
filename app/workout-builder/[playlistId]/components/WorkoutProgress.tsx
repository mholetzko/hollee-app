'use client'

import { Segment } from '../types'
import { SEGMENT_COLORS, WORKOUT_LABELS } from '../constants'
import { formatDuration } from '../utils'

interface WorkoutProgressProps {
  segments: Segment[]
  currentPosition: number
  duration: number
}

export const WorkoutProgress = ({ segments, currentPosition, duration }: WorkoutProgressProps) => {
  const sortedSegments = [...segments].sort((a, b) => a.startTime - b.startTime)
  const currentSegmentIndex = sortedSegments.findIndex(
    segment => currentPosition >= segment.startTime && currentPosition < segment.endTime
  )

  return (
    <div className="bg-black/20 rounded-lg p-4 space-y-4">
      {/* Progress bar with segments */}
      <div className="h-28 bg-black/20 rounded-lg overflow-hidden relative">
        {/* Segments */}
        {sortedSegments.map((segment) => (
          <div
            key={segment.id}
            className={`absolute top-0 bottom-0 group ${SEGMENT_COLORS[segment.type]} transition-opacity
              ${currentPosition >= segment.endTime ? 'opacity-50' : 
                currentPosition >= segment.startTime ? 'opacity-100' : 'opacity-70'}`}
            style={{
              left: `${(segment.startTime / duration) * 100}%`,
              width: `${((segment.endTime - segment.startTime) / duration) * 100}%`,
            }}
          >
            {/* Segment label */}
            <div className="absolute inset-x-0 top-3 text-center font-medium truncate px-2">
              <div className="text-sm mb-1 text-white/90">
                {segment.title}
              </div>
              <div className="text-sm font-bold text-white/80">
                {WORKOUT_LABELS[segment.type]}
              </div>
              <div className="text-xs text-white/60 mt-1">
                {formatDuration(segment.endTime - segment.startTime)}
              </div>
            </div>

            {/* Hover info */}
            <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-black/90 px-4 py-3 rounded-lg
              opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20
              shadow-lg shadow-black/50">
              <div className="text-lg font-medium mb-1">{segment.title}</div>
              <div className="text-sm text-white/80 font-bold mb-1">
                {WORKOUT_LABELS[segment.type]}
              </div>
              <div className="text-sm text-gray-400">
                Duration: {formatDuration(segment.endTime - segment.startTime)}
              </div>
              <div className="text-sm text-gray-400">
                Time: {formatDuration(segment.startTime)} - {formatDuration(segment.endTime)}
              </div>
            </div>
          </div>
        ))}

        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white z-10 transition-all duration-100"
          style={{ left: `${(currentPosition / duration) * 100}%` }}
        />
      </div>

      {/* Overall progress */}
      <div className="flex justify-between text-sm text-gray-400">
        <div>{formatDuration(currentPosition)}</div>
        <div>{formatDuration(duration)}</div>
      </div>
    </div>
  )
} 