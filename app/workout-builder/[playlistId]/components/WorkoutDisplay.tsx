'use client'

import { Segment } from '../types'
import { SEGMENT_COLORS, WORKOUT_LABELS } from '../constants'

interface WorkoutDisplayProps {
  segments?: Segment[] // For playlist view
  segment?: Segment   // For single segment view
  position?: number   // For playlist view
  isNext?: boolean    // For single segment view
}

export const WorkoutDisplay = ({ 
  segments,
  segment,
  position = 0,
  isNext = false 
}: WorkoutDisplayProps) => {
  // If we're displaying a single segment
  if (segment) {
    return (
      <div className={`flex-1 p-6 rounded-lg ${SEGMENT_COLORS[segment.type]} 
        ${isNext ? 'opacity-50' : ''} transition-all duration-300`}
      >
        <div className="text-lg font-bold mb-1">
          {isNext ? 'Next:' : 'Current:'} {segment.title}
        </div>
        <div className="text-2xl font-bold mb-2">
          {WORKOUT_LABELS[segment.type]}
        </div>
        <div className="text-sm opacity-75">
          Duration: {((segment.endTime - segment.startTime) / 1000).toFixed(0)}s
        </div>
      </div>
    )
  }

  // If we're displaying multiple segments (playlist view)
  if (segments) {
    const sortedSegments = [...segments].sort((a, b) => a.startTime - b.startTime)
    const currentSegmentIndex = sortedSegments.findIndex(
      segment => position >= segment.startTime && position < segment.endTime
    )
    const currentSegment = currentSegmentIndex !== -1 ? sortedSegments[currentSegmentIndex] : undefined
    const nextSegment = currentSegmentIndex !== -1 ? sortedSegments[currentSegmentIndex + 1] : undefined

    return (
      <div className="flex gap-4 p-4">
        {currentSegment && (
          <div className={`flex-1 p-6 rounded-lg ${SEGMENT_COLORS[currentSegment.type]}`}>
            <div className="text-lg font-bold mb-1">Current: {currentSegment.title}</div>
            <div className="text-2xl font-bold mb-2">{WORKOUT_LABELS[currentSegment.type]}</div>
            <div className="text-sm opacity-75">
              Duration: {((currentSegment.endTime - currentSegment.startTime) / 1000).toFixed(0)}s
            </div>
          </div>
        )}
        {nextSegment && (
          <div className={`flex-1 p-6 rounded-lg ${SEGMENT_COLORS[nextSegment.type]} opacity-50`}>
            <div className="text-lg font-bold mb-1">Next: {nextSegment.title}</div>
            <div className="text-2xl font-bold mb-2">{WORKOUT_LABELS[nextSegment.type]}</div>
            <div className="text-sm opacity-75">
              Duration: {((nextSegment.endTime - nextSegment.startTime) / 1000).toFixed(0)}s
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
} 