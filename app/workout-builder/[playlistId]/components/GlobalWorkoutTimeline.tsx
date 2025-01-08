'use client';

import { Track, Segment } from '../types';
import { WORKOUT_LABELS } from '../constants';
import { TrackStorage } from '../../../utils/storage/TrackStorage';

interface GlobalWorkoutTimelineProps {
  tracks: Track[];
  segments: Segment[];
  playlistId: string;
  currentTrackIndex: number;
  currentPosition: number;
  currentTrackStartTime: number;
}

export function GlobalWorkoutTimeline({
  tracks,
  segments: currentTrackSegments,
  playlistId,
  currentTrackIndex,
  currentPosition,
  currentTrackStartTime,
}: GlobalWorkoutTimelineProps) {
  const trackStartTimes = tracks.reduce<number[]>((acc, _, index) => {
    if (index === 0) return [0];
    const prevTrack = tracks[index - 1];
    return [...acc, acc[index - 1] + prevTrack.duration_ms];
  }, []);

  const totalDuration =
    trackStartTimes[trackStartTimes.length - 1] +
    tracks[tracks.length - 1]?.duration_ms || 0;

  // Get all segments from all tracks and sort them by start time
  const allSegments = tracks
    .map((track, index) => {
      const trackSegments =
        track.id === tracks[currentTrackIndex].id
          ? currentTrackSegments
          : TrackStorage.segments.load(playlistId, track.id);

      return trackSegments.map((segment: Segment) => ({
        ...segment,
        absoluteStartTime: trackStartTimes[index] + segment.startTime,
        absoluteEndTime: trackStartTimes[index] + segment.endTime,
        trackIndex: index,
      }));
    })
    .flat()
    .sort((a, b) => a.absoluteStartTime - b.absoluteStartTime);

  return (
    <div className="relative h-32 bg-black/20 rounded-lg overflow-hidden">
      {/* Grid lines */}
      <div className="absolute inset-0 grid grid-rows-5 gap-0">
        {[...Array(5)].map((_, i) => (
          <div key={`grid-${i}`} className="border-t border-white/10 relative">
            <span className="absolute right-0 -top-3 px-2 text-xs text-white/40">
              {100 - i * 20}%
            </span>
          </div>
        ))}
      </div>

      {/* Track boundaries */}
      {trackStartTimes.map((startTime, index) => (
        <div
          key={`track-boundary-${index}`}
          className="absolute top-0 bottom-0 w-px bg-white/20"
          style={{
            left: `${(startTime / totalDuration) * 100}%`,
          }}
        />
      ))}

      {/* Intensity bars */}
      <div className="absolute inset-0">
        {allSegments.map((segment, index) => {
          const startPercent = (segment.absoluteStartTime / totalDuration) * 100;
          const widthPercent =
            ((segment.absoluteEndTime - segment.absoluteStartTime) / totalDuration) * 100;
          const heightPercent = segment.intensity === -1 ? 100 : segment.intensity;
          const isCurrentTrack = segment.trackIndex === currentTrackIndex;

          // Calculate intensity-based color
          const intensityColor =
            segment.intensity === -1
              ? "bg-red-500"
              : segment.intensity > 80
              ? "bg-orange-500"
              : segment.intensity > 60
              ? "bg-yellow-500"
              : segment.intensity > 40
              ? "bg-green-500"
              : "bg-blue-500";

          const uniqueSegmentKey = `segment-${segment.trackIndex}-${segment.id}-${index}`;

          return (
            <div
              key={uniqueSegmentKey}
              className={`absolute ${intensityColor} transition-opacity
                ${isCurrentTrack ? "opacity-80" : "opacity-30"}`}
              style={{
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
                height: `${heightPercent}%`,
                bottom: "0",
              }}
            >
              {/* Enhanced tooltip */}
              <div className="absolute inset-0 flex items-center justify-center group">
                <div
                  className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                  bg-black/90 text-white text-sm rounded px-3 py-2 whitespace-nowrap z-30 shadow-lg"
                >
                  <div className="font-bold mb-1">
                    {WORKOUT_LABELS[segment.type]}
                  </div>
                  <div className="text-xs text-gray-300">
                    Intensity: {heightPercent}%<br />
                    Duration:{" "}
                    {((segment.absoluteEndTime - segment.absoluteStartTime) / 1000).toFixed(0)}s
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current position indicator */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white z-30"
        style={{
          left: `${((currentTrackStartTime + currentPosition) / totalDuration) * 100}%`,
          transition: "left 0.1s linear",
        }}
      />

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-white/30"
          style={{
            width: `${((currentTrackStartTime + currentPosition) / totalDuration) * 100}%`,
            transition: "width 0.1s linear",
          }}
        />
      </div>
    </div>
  );
} 