'use client'

import { useRef } from 'react'
import { Segment } from '../types'
import { SEGMENT_COLORS, WORKOUT_LABELS } from '../constants'

interface SegmentTimelineProps {
  segments: Segment[]
  duration: number
  position: number
  isPlaying: boolean
  showBeats?: boolean
  bpm?: number
}

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
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

export const SegmentTimeline = ({ 
  segments,
  duration,
  position,
  isPlaying,
  showBeats,
  bpm = 128
}: SegmentTimelineProps) => {
  const timelineRef = useRef<HTMLDivElement>(null)

  return (
    <div className="w-full space-y-2">
      {/* Timeline */}
      <div 
        ref={timelineRef}
        className="h-12 bg-black/20 rounded-lg relative group"
      >
        {/* Beat markers */}
        {showBeats && bpm && (
          <div className="absolute inset-0">
            {Array.from({ length: Math.ceil((duration / 60000) * bpm) }).map((_, i) => {
              const beatPosition = (i * 60000) / bpm
              const beatPercent = (beatPosition / duration) * 100
              
              // Only render if within timeline bounds
              if (beatPercent <= 100) {
                return (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 w-px bg-white/10"
                    style={{ left: `${beatPercent}%` }}
                  />
                )
              }
            })}
          </div>
        )}

        {/* Segments */}
        {segments.sort((a, b) => a.startTime - b.startTime).map((segment) => (
          <div
            key={segment.id}
            className="absolute top-0 bottom-0 group/segment"
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

        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-glow 
            transition-all duration-100 -translate-x-1/2 z-10"
          style={{
            left: `${(position / duration) * 100}%`,
          }}
        />
      </div>

      {/* Time indicators */}
      <div className="flex justify-between text-sm text-gray-400">
        <div>{formatDuration(position)}</div>
        <div>{formatDuration(duration)}</div>
      </div>
    </div>
  )
} 