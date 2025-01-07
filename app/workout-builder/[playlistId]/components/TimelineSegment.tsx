import { Segment, Track, PlaybackState } from '../types';
import { WORKOUT_LABELS } from '../constants';
import { getIntensityColor } from '../utils';

interface TimelineSegmentProps {
  segment: Segment;
  track: Track;
  playbackState: PlaybackState;
  onDragStart: (e: React.MouseEvent, segmentId: string, type: "start" | "end") => void;
  formatDuration: (ms: number) => string;
}

export const TimelineSegment: React.FC<TimelineSegmentProps> = ({
  segment,
  track,
  playbackState,
  onDragStart,
  formatDuration,
}) => {
  const isCurrentSegment =
    playbackState.isPlaying &&
    playbackState.position >= segment.startTime && 
    playbackState.position < segment.endTime;

  return (
    <div
      className={`absolute h-full group
        transition-all duration-300
        ${getIntensityColor(segment.intensity)}
        ${
          isCurrentSegment
            ? "ring-2 ring-white ring-offset-2 ring-offset-black/50 z-10"
            : ""
        }
      `}
      style={{
        left: `${(segment.startTime / track.duration_ms) * 100}%`,
        width: `${
          ((segment.endTime - segment.startTime) / track.duration_ms) * 100
        }%`,
      }}
    >
      {/* Drag handles */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-2 bg-white/20 cursor-ew-resize 
          hover:bg-white/60 group-hover:bg-white/40 transition-colors"
        onMouseDown={(e) => onDragStart(e, segment.id, "start")}
      >
        <div className="h-8 w-1 bg-white/60 rounded hidden group-hover:block" />
      </div>
      <div 
        className="absolute right-0 top-0 bottom-0 w-2 bg-white/20 cursor-ew-resize 
          hover:bg-white/60 group-hover:bg-white/40 transition-colors"
        onMouseDown={(e) => onDragStart(e, segment.id, "end")}
      >
        <div className="h-8 w-1 bg-white/60 rounded hidden group-hover:block" />
      </div>

      {/* Segment content */}
      <div className={`p-2 text-xs ${isCurrentSegment ? "text-white" : ""}`}>
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
  );
}; 