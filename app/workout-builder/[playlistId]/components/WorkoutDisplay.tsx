'use client'

import { useEffect } from 'react'
import { Segment, WorkoutType } from '../types'
import { SEGMENT_COLORS, WORKOUT_LABELS } from '../constants'

interface WorkoutDisplayProps {
  segments: Segment[]
  position: number
  onComplete?: () => void
}

export const WorkoutDisplay = ({ 
  segments, 
  position,
  onComplete
}: WorkoutDisplayProps) => {
  const sortedSegments = [...segments].sort((a, b) => a.startTime - b.startTime)
  const currentSegmentIndex = sortedSegments.findIndex(
    segment => position >= segment.startTime && position < segment.endTime
  )
  const currentSegment = currentSegmentIndex !== -1 ? sortedSegments[currentSegmentIndex] : undefined
  const nextSegment = currentSegmentIndex !== -1 ? sortedSegments[currentSegmentIndex + 1] : undefined

  // Add effect to handle segment transitions
  useEffect(() => {
    if (!currentSegment && position > 0 && sortedSegments.length > 0) {
      const lastSegment = sortedSegments[sortedSegments.length - 1]
      if (position >= lastSegment.endTime) {
        onComplete?.()
      }
    }
  }, [position, currentSegment, sortedSegments, onComplete])

  return (
    <div className="flex gap-4 p-4">
      <WorkoutSegment segment={currentSegment} />
      <WorkoutSegment segment={nextSegment} isNext />
    </div>
  )
}

const WorkoutSegment = ({ 
  segment, 
  isNext = false 
}: { 
  segment?: Segment
  isNext?: boolean 
}) => {
  if (!segment) return null

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