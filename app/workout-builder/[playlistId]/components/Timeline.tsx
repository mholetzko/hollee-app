import { useRef } from 'react';
import { Segment, Track } from '../types';
import { WORKOUT_LABELS } from '../constants';
import { getIntensityColor } from '../utils';
import { TimelineSegment } from './TimelineSegment';

interface TimelineProps {
  segments: Segment[];
  track: Track;
  playbackState: PlaybackState;
  trackBPM: TrackBPM;
  onDragStart: (e: React.MouseEvent, segmentId: string, type: "start" | "end") => void;
  formatDuration: (ms: number) => string;
}

export const Timeline: React.FC<TimelineProps> = ({
  segments,
  track,
  playbackState,
  trackBPM,
  onDragStart,
  formatDuration,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={timelineRef}
      className="relative h-32 bg-white/10 rounded"
    >
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

      {/* Segments */}
      {segments
        .sort((a, b) => a.startTime - b.startTime)
        .map((segment) => (
          <TimelineSegment
            key={segment.id}
            segment={segment}
            track={track}
            playbackState={playbackState}
            onDragStart={onDragStart}
            formatDuration={formatDuration}
          />
        ))}
    </div>
  );
}; 