'use client'

import { Segment } from '../types'
import { SEGMENT_COLORS, WORKOUT_LABELS } from '../constants'
import { formatDuration } from '../utils'

interface SegmentListProps {
  segments: Segment[]
  currentPosition: number
}

export const SegmentList = ({ segments, currentPosition }: SegmentListProps) => {
  const sortedSegments = [...segments].sort((a, b) => a.startTime - b.startTime)
  const currentSegmentIndex = sortedSegments.findIndex(
    segment => currentPosition >= segment.startTime && currentPosition < segment.endTime
  )

  return (
    <div className="bg-black/20 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Workout Segments</h3>
      <div className="space-y-2">
        {sortedSegments.map((segment, index) => {
          const isCurrent = index === currentSegmentIndex
          const isPast = currentPosition > segment.endTime
          
          return (
            <div 
              key={segment.id}
              className={`flex items-center gap-3 p-2 rounded transition-colors
                ${isCurrent ? 'bg-white/10' : 'hover:bg-white/5'}
                ${isPast ? 'opacity-50' : ''}`}
            >
              {/* Progress indicator */}
              {isCurrent && (
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
              {!isCurrent && (
                <div className={`w-1.5 h-1.5 rounded-full 
                  ${isPast ? 'bg-white/30' : 'bg-white/10'}`} 
                />
              )}

              {/* Segment color indicator */}
              <div className={`w-2 h-full rounded ${SEGMENT_COLORS[segment.type]}`} />

              {/* Segment info */}
              <div className="flex-1">
                <div className="flex justify-between items-baseline">
                  <div className="font-medium">
                    {segment.title}
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatDuration(segment.endTime - segment.startTime)}
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {WORKOUT_LABELS[segment.type]}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 