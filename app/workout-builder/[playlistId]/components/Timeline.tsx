import { forwardRef } from 'react';
import { Segment, Track, PlaybackState, TrackBPM } from '../types';
import { WORKOUT_LABELS } from '../constants';
import { getIntensityColor } from '../utils';

interface TimelineProps {
  segments: Segment[];
  track: Track;
  playbackState: PlaybackState;
  trackBPM: TrackBPM;
  onDragStart: (e: React.MouseEvent, segmentId: string, type: "start" | "end") => void;
  formatDuration: (ms: number) => string;
  clipStart?: number;
  clipEnd?: number;
}

export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(({
  segments,
  track,
  playbackState,
  trackBPM,
  onDragStart,
  formatDuration,
  clipStart = 0,
  clipEnd,
}, ref) => {
  const effectiveClipEnd = clipEnd || track.duration_ms;

  return (
    <div 
      ref={ref}
      className="relative h-32 bg-white/10 rounded overflow-hidden"
    >
      {/* Clip region */}
      <div 
        className="absolute top-0 bottom-0 bg-white/5 border-x border-white/20"
        style={{
          left: `${(clipStart / track.duration_ms) * 100}%`,
          width: `${((effectiveClipEnd - clipStart) / track.duration_ms) * 100}%`,
        }}
      />

      {/* Clip markers */}
      {clipStart > 0 && (
        <div 
          className="absolute top-0 bottom-0 w-2 bg-white cursor-ew-resize group hover:bg-white/80 transition-colors"
          style={{ left: `${(clipStart / track.duration_ms) * 100}%` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black/80 text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {formatDuration(clipStart)}
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black text-2xl font-black">
            &#x226B;
          </div>
        </div>
      )}
      {clipEnd && clipEnd < track.duration_ms && (
        <div 
          className="absolute top-0 bottom-0 w-2 bg-white cursor-ew-resize group hover:bg-white/80 transition-colors"
          style={{ left: `${(clipEnd / track.duration_ms) * 100}%` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black/80 text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {formatDuration(clipEnd)}
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black text-2xl font-black">
            &#x226A;
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-20 transition-all duration-100"
        style={{
          left: `${(playbackState.position / track.duration_ms) * 100}%`,
        }}
      />

      {/* Beat markers */}
      {trackBPM && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({
            length: Math.floor(track.duration_ms / (60000 / trackBPM.tempo)),
          }).map((_, i) => {
            const position = ((i * (60000 / trackBPM.tempo)) / track.duration_ms) * 100;
            const isMeasureStart = i % 4 === 0;
            const isHalfBeat = i % 2 === 0;
            
            return (
              <div
                key={`beat-${i}-${position}`}
                className={`absolute top-0 bottom-0 w-px ${
                  isMeasureStart
                    ? "bg-white/20"
                    : isHalfBeat
                    ? "bg-white/15"
                    : "bg-white/5"
                }`}
                style={{ 
                  left: `${position}%`,
                  height: isMeasureStart ? "100%" : isHalfBeat ? "75%" : "50%",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Playhead */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-glow 
          transition-all duration-100 -translate-x-1/2 z-20"
        style={{
          left: `${(playbackState.position / track.duration_ms) * 100}%`,
        }}
      />

      {/* Segments */}
      {segments
        .sort((a, b) => a.startTime - b.startTime)
        .map((segment) => (
          <div
            key={segment.id}
            className={`absolute h-full group transition-all duration-300
              ${getIntensityColor(segment.intensity)}
              ${playbackState.position >= segment.startTime && 
                playbackState.position < segment.endTime
                ? "ring-2 ring-white ring-offset-2 ring-offset-black/50 z-10"
                : ""
              }`}
            style={{
              left: `${(segment.startTime / track.duration_ms) * 100}%`,
              width: `${((segment.endTime - segment.startTime) / track.duration_ms) * 100}%`,
            }}
          >
            {/* Drag handles */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-2 bg-white/20 cursor-ew-resize 
                hover:bg-white/60 group-hover:bg-white/40 transition-colors"
              onMouseDown={(e) => onDragStart(e, segment.id, "start")}
            >
              <div className="h-8 w-1 bg-white/60 rounded hidden group-hover:block 
                absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2" />
            </div>
            <div 
              className="absolute right-0 top-0 bottom-0 w-2 bg-white/20 cursor-ew-resize 
                hover:bg-white/60 group-hover:bg-white/40 transition-colors"
              onMouseDown={(e) => onDragStart(e, segment.id, "end")}
            >
              <div className="h-8 w-1 bg-white/60 rounded hidden group-hover:block 
                absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* Segment content */}
            <div className="p-2 text-xs">
              <div className="font-medium truncate">
                {segment.title}
              </div>
              <div className="opacity-75">
                {WORKOUT_LABELS[segment.type]} •{" "}
                {segment.intensity === -1 ? "BURN" : `${segment.intensity}%`}
              </div>
              <div>
                {formatDuration(segment.startTime)} -{" "}
                {formatDuration(segment.endTime)}
              </div>
              <div>
                Duration:{" "}
                {formatDuration(segment.endTime - segment.startTime)}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
});

Timeline.displayName = 'Timeline'; 