import { useRef, forwardRef, ForwardRefRenderFunction } from 'react'
import { Segment } from '../../../types'
import { SEGMENT_COLORS, WORKOUT_LABELS, SEGMENT_COLORS_HOVER } from '../../../constants'
import { formatDuration } from '../../../utils'

interface SegmentTimelineProps {
  segments: Segment[]
  duration: number
  position: number
  isPlaying: boolean
  onSeek?: (position: number) => void
  onDragStart?: (e: React.MouseEvent, segmentId: string, type: 'start' | 'end') => void
  onDragEnd?: () => void
  showBeats?: boolean
  bpm?: number
}

interface SegmentItemProps {
  segment: Segment
  duration: number
  position: number
  onDragStart?: (e: React.MouseEvent, segmentId: string, type: 'start' | 'end') => void
}

const SegmentItem = ({ segment, duration, position, onDragStart }: SegmentItemProps) => {
  const isActive = position >= segment.startTime && position < segment.endTime

  return (
    <div
      className={`absolute top-0 bottom-0 
        ${SEGMENT_COLORS[segment.type]} 
        ${SEGMENT_COLORS_HOVER[segment.type]}
        transition-all duration-200 group
        ${isActive ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
      style={{
        left: `${(segment.startTime / duration) * 100}%`,
        width: `${((segment.endTime - segment.startTime) / duration) * 100}%`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-black/80 px-2 py-1 rounded text-sm">
          {WORKOUT_LABELS[segment.type]} - {formatDuration(segment.endTime - segment.startTime)}
        </div>
      </div>

      {onDragStart && (
        <>
          {/* Drag handles */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/50"
            onMouseDown={(e) => onDragStart(e, segment.id, 'start')}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/50"
            onMouseDown={(e) => onDragStart(e, segment.id, 'end')}
          />
        </>
      )}
    </div>
  )
}

const SegmentTimelineBase: ForwardRefRenderFunction<HTMLDivElement, SegmentTimelineProps> = (
  { 
    segments = [], 
    duration = 0,
    position = 0,
    isPlaying = false,
    onSeek,
    onDragStart,
    onDragEnd,
    showBeats = false,
    bpm
  }, 
  ref
) => {
  const handleClick = (e: React.MouseEvent) => {
    if (!onSeek) return
    
    const timeline = ref as React.RefObject<HTMLDivElement>
    if (!timeline.current) return
    
    const rect = timeline.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clickPosition = (x / rect.width) * duration
    onSeek(clickPosition)
  }

  return (
    <div 
      ref={ref}
      className="relative h-16 bg-black/20 rounded-lg overflow-hidden"
      onClick={handleClick}
    >
      {/* Beat grid */}
      {showBeats && bpm && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: Math.floor(duration / (60000 / bpm)) }).map((_, i) => {
            const beatPosition = (i * (60000 / bpm) / duration) * 100
            const isMeasureStart = i % 4 === 0
            const isHalfBeat = i % 2 === 0
            
            return (
              <div
                key={`beat-${i}-${beatPosition}`}
                className={`absolute top-0 bottom-0 w-px ${
                  isMeasureStart ? 'bg-white/20' : 
                  isHalfBeat ? 'bg-white/15' : 'bg-white/5'
                }`}
                style={{ 
                  left: `${beatPosition}%`,
                  height: isMeasureStart ? '100%' : 
                    isHalfBeat ? '75%' : '50%',
                }}
              />
            )
          })}
        </div>
      )}

      {/* Segments */}
      {segments
        .sort((a, b) => a.startTime - b.startTime)
        .map((segment) => (
          <SegmentItem
            key={segment.id}
            segment={segment}
            duration={duration}
            position={position}
            onDragStart={onDragStart}
          />
        ))}

      {/* Playhead */}
      <div 
        className="absolute top-0 bottom-0 w-px bg-white pointer-events-none"
        style={{ left: `${(position / duration) * 100}%` }}
      />
    </div>
  )
}

export const SegmentTimeline = forwardRef(SegmentTimelineBase)
SegmentTimeline.displayName = 'SegmentTimeline' 