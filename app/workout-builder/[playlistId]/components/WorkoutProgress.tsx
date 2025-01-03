'use client'

import { Segment } from '../types'
import { SEGMENT_COLORS, WORKOUT_LABELS } from '../constants'

interface WorkoutProgressProps {
  segments: Segment[]
  currentPosition: number
  duration: number
}

// Helper function for intensity colors
const getIntensityColor = (intensity: number) => {
  if (intensity === -1) return 'bg-red-500/50' // BURN mode
  if (intensity > 90) return 'bg-red-500/50'    // 90-100%
  if (intensity > 75) return 'bg-yellow-500/50'  // 75-90%
  if (intensity > 55) return 'bg-green-500/50'   // 55-75%
  if (intensity > 25) return 'bg-blue-500/50'    // 25-55%
  return 'bg-white/50'                           // 0-25%
}

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export const WorkoutProgress = ({ segments, currentPosition, duration }: WorkoutProgressProps) => {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="h-3 bg-white/5 rounded-full relative group">
        {/* Segments */}
        {segments.sort((a, b) => a.startTime - b.startTime).map((segment) => (
          <div
            key={segment.id}
            className="absolute top-0 bottom-0 overflow-hidden group/segment"
            style={{
              left: `${(segment.startTime / duration) * 100}%`,
              width: `${((segment.endTime - segment.startTime) / duration) * 100}%`,
            }}
          >
            {/* Workout type background */}
            <div className={`absolute inset-0 ${SEGMENT_COLORS[segment.type]} opacity-30`} />
            
            {/* Intensity overlay */}
            <div className={`absolute inset-0 ${getIntensityColor(segment.intensity)} opacity-40`} />
            
            {/* Hover info */}
            <div className="opacity-0 group-hover/segment:opacity-100 absolute top-full mt-2 left-1/2 -translate-x-1/2 
              bg-black/90 px-3 py-2 rounded text-sm whitespace-nowrap z-20 pointer-events-none">
              <div className="font-medium">{segment.title}</div>
              <div className="text-xs text-gray-400">
                {WORKOUT_LABELS[segment.type]} • 
                {segment.intensity === -1 ? ' BURN!' : ` ${segment.intensity}%`}
              </div>
              <div className="text-xs text-gray-500">
                {formatDuration(segment.startTime)} - {formatDuration(segment.endTime)}
              </div>
            </div>
          </div>
        ))}

        {/* Progress overlay */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-white/30 backdrop-blur-sm 
            transition-all duration-1000 rounded-l-full"
          style={{
            width: `${(currentPosition / duration) * 100}%`,
          }}
        />

        {/* Current position marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-glow 
            transition-all duration-100 -translate-x-1/2 z-10"
          style={{
            left: `${(currentPosition / duration) * 100}%`,
          }}
        />
      </div>

      {/* Time indicators */}
      <div className="flex justify-between mt-2 text-sm text-gray-400">
        <div>{formatDuration(currentPosition)}</div>
        <div>{formatDuration(duration)}</div>
      </div>
    </div>
  )
} 