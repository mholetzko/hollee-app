import { useRef, forwardRef, ForwardRefRenderFunction } from 'react'
import { Segment, Track, PlaybackState, TrackBPM } from '../types'
import { SEGMENT_COLORS, WORKOUT_LABELS, SEGMENT_COLORS_HOVER } from '../constants'
import { formatDuration } from '../utils'

interface SegmentTimelineProps {
  segments: Segment[]
  track: Track
  playbackState: PlaybackState
  trackBPM: TrackBPM | null
  onDragStart: (e: React.MouseEvent, segmentId: string, type: 'start' | 'end') => void
}

// Add SegmentItem component
interface SegmentItemProps {
  segment: Segment
  track: Track
  playbackState: PlaybackState
  onDragStart: (e: React.MouseEvent, segmentId: string, type: 'start' | 'end') => void
}

function SegmentItem({ segment, track, playbackState, onDragStart }: SegmentItemProps) {
  const isActive = playbackState.position >= segment.startTime && 
                  playbackState.position < segment.endTime

  // Get color based on intensity
  const getIntensityColor = (intensity: number) => {
    if (intensity === -1) return 'bg-red-500/50 animate-pulse' // BURN mode
    if (intensity > 90) return 'bg-red-600/70'    // 90-100%
    if (intensity > 75) return 'bg-orange-500/70'  // 75-90%
    if (intensity > 55) return 'bg-yellow-500/70'   // 55-75%
    if (intensity > 25) return 'bg-green-500/70'    // 25-55%
    return 'bg-blue-500/70'                         // 0-25%
  }

  const getIntensityHoverColor = (intensity: number) => {
    if (intensity === -1) return 'hover:bg-red-400' // BURN mode
    if (intensity > 90) return 'hover:bg-red-500'    // 90-100%
    if (intensity > 75) return 'hover:bg-orange-400'  // 75-90%
    if (intensity > 55) return 'hover:bg-yellow-400'   // 55-75%
    if (intensity > 25) return 'hover:bg-green-400'    // 25-55%
    return 'hover:bg-blue-400'                         // 0-25%
  }

  return (
    <div
      className={`absolute top-0 bottom-0 
        ${getIntensityColor(segment.intensity)} 
        transition-all duration-200 group
        ${isActive ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
      style={{
        left: `${(segment.startTime / track.duration_ms) * 100}%`,
        width: `${((segment.endTime - segment.startTime) / track.duration_ms) * 100}%`,
      }}
    >
      {/* Drag handles with improved visibility and interaction */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize 
          flex items-center justify-start group/handle
          hover:bg-gradient-to-r hover:from-black/20 hover:to-transparent"
        onMouseDown={(e) => onDragStart(e, segment.id, 'start')}
      >
        <div className="h-full w-1 mx-1.5 rounded-full bg-white/20 
          group-hover/handle:bg-white/40 group-hover/handle:shadow-glow
          transition-all duration-150" />
      </div>

      <div 
        className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize 
          flex items-center justify-end group/handle
          hover:bg-gradient-to-l hover:from-black/20 hover:to-transparent"
        onMouseDown={(e) => onDragStart(e, segment.id, 'end')}
      >
        <div className="h-full w-1 mx-1.5 rounded-full bg-white/20 
          group-hover/handle:bg-white/40 group-hover/handle:shadow-glow
          transition-all duration-150" />
      </div>

      {/* Segment label */}
      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
        {WORKOUT_LABELS[segment.type]}
      </div>
    </div>
  )
}

// Create the base component as a regular function
const SegmentTimelineBase: ForwardRefRenderFunction<HTMLDivElement, SegmentTimelineProps> = (
  { segments, track, playbackState, trackBPM, onDragStart }, 
  ref
) => {
  const handleDragStart = (e: React.MouseEvent, segmentId: string, type: 'start' | 'end') => {
    const timeline = ref as React.RefObject<HTMLDivElement>
    if (!timeline.current) {
      console.log('Timeline ref not available')
      return
    }

    const rect = timeline.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = (x / rect.width) * track.duration_ms

    console.log('Timeline drag start:', {
      segmentId,
      type,
      x,
      clientX: e.clientX,
      rectLeft: rect.left,
      time,
      rect
    })

    onDragStart(e, segmentId, type)
  }

  return (
    <div 
      ref={ref}
      className="relative h-16 bg-black/20 rounded-lg overflow-hidden"
    >
      {/* Beat grid */}
      {trackBPM && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: Math.floor(track.duration_ms / (60000 / trackBPM.tempo)) }).map((_, i) => {
            const position = (i * (60000 / trackBPM.tempo) / track.duration_ms) * 100
            const isMeasureStart = i % 4 === 0
            const isHalfBeat = i % 2 === 0
            
            return (
              <div
                key={`beat-${i}-${position}`}
                className={`absolute top-0 bottom-0 w-px ${
                  isMeasureStart ? 'bg-white/20' : 
                  isHalfBeat ? 'bg-white/15' : 'bg-white/5'
                }`}
                style={{ 
                  left: `${position}%`,
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
            track={track}
            playbackState={playbackState}
            onDragStart={handleDragStart}
          />
        ))}

      {/* Playhead */}
      <div 
        className="absolute top-0 bottom-0 w-px bg-white pointer-events-none"
        style={{ left: `${(playbackState.position / track.duration_ms) * 100}%` }}
      />
    </div>
  )
}

// Create the forwarded ref component
export const SegmentTimeline = forwardRef(SegmentTimelineBase)

// Add display name
SegmentTimeline.displayName = 'SegmentTimeline' 