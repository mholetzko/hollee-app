'use client';

import { useMemo } from 'react';
import { TrackStorage } from '../../../utils/storage/TrackStorage';
import { Segment, WorkoutType } from '../types';
import { WORKOUT_LABELS } from '../constants';

interface PlaylistOverviewProps {
  playlistId: string;
  tracks: Array<{ id: string; duration_ms: number }>;
}

export function PlaylistOverview({ playlistId, tracks }: PlaylistOverviewProps) {
  const workoutData = useMemo(() => {
    const allSegments: Array<{ segment: Segment; trackStart: number }> = [];
    let totalDuration = 0;
    
    tracks.forEach(track => {
      const trackData = TrackStorage.loadTrackData(playlistId, track.id);
      if (trackData.segments) {
        trackData.segments.forEach(segment => {
          allSegments.push({
            segment,
            trackStart: totalDuration
          });
        });
      }
      totalDuration += track.duration_ms;
    });

    return {
      segments: allSegments,
      totalDuration
    };
  }, [playlistId, tracks]);

  const stats = useMemo(() => {
    const types = new Set<WorkoutType>();
    let maxIntensity = 0;
    let totalIntensity = 0;
    let segmentCount = 0;
    
    let minBPM = Infinity;
    let maxBPM = -Infinity;
    
    tracks.forEach(track => {
      const trackBPM = TrackStorage.bpm.load(playlistId, track.id)?.tempo;
      if (trackBPM) {
        minBPM = Math.min(minBPM, trackBPM);
        maxBPM = Math.max(maxBPM, trackBPM);
      }
    });

    workoutData.segments.forEach(({ segment }) => {
      types.add(segment.type);
      if (segment.intensity > maxIntensity) maxIntensity = segment.intensity;
      if (segment.intensity !== -1) {
        totalIntensity += segment.intensity;
        segmentCount++;
      }
    });

    return {
      uniqueTypes: Array.from(types),
      maxIntensity,
      avgIntensity: segmentCount ? Math.round(totalIntensity / segmentCount) : 0,
      bpmRange: minBPM === Infinity ? null : { min: Math.floor(minBPM), max: Math.ceil(maxBPM) }
    };
  }, [workoutData, tracks, playlistId]);

  // Helper function to get intensity-based color (matching the player)
  const getIntensityColor = (intensity: number) => {
    if (intensity === -1) return "bg-red-500";
    if (intensity > 80) return "bg-orange-500";
    if (intensity > 60) return "bg-yellow-500";
    if (intensity > 40) return "bg-green-500";
    return "bg-blue-500";
  };

  return (
    <div className="bg-black/20 border-y border-white/10 w-full">
      <div className="px-8 py-6">
        <div className="flex items-start justify-between w-full mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">Workout Overview</h2>
            <div className="text-sm text-gray-400">
              {Math.round(workoutData.totalDuration / 60000)} minutes • 
              {stats.uniqueTypes.length} workout types • 
              Avg. {stats.avgIntensity}% intensity
            </div>
          </div>

          <div className="bg-white/5 px-4 py-2 rounded-lg flex-shrink-0">
            <div className="text-xs text-gray-400 mb-1">BPM Range</div>
            <div className="font-mono font-medium">
              {stats.bpmRange 
                ? `${stats.bpmRange.min}-${stats.bpmRange.max}`
                : '--'} <span className="text-xs text-gray-400">BPM</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 w-full">
          {stats.uniqueTypes.map(type => (
            <div 
              key={type}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm"
            >
              {WORKOUT_LABELS[type]}
            </div>
          ))}
        </div>

        <div className="h-32 relative rounded-lg overflow-hidden bg-black/20 w-full">
          {/* Intensity grid lines */}
          <div className="absolute inset-0 grid grid-rows-4 gap-0">
            {[80, 60, 40, 20].map((intensity) => (
              <div key={intensity} className="border-t border-white/5 relative">
                <span className="absolute -top-2 right-0 text-[10px] text-white/30">
                  {intensity}%
                </span>
              </div>
            ))}
          </div>

          {/* Segments visualization with updated colors */}
          {workoutData.segments.map(({ segment, trackStart }, index) => {
            const startPercent = ((trackStart + segment.startTime) / workoutData.totalDuration) * 100;
            const widthPercent = ((segment.endTime - segment.startTime) / workoutData.totalDuration) * 100;
            const heightPercent = segment.intensity === -1 ? 100 : segment.intensity;

            return (
              <div
                key={index}
                className={`absolute bottom-0 ${getIntensityColor(segment.intensity)} transition-opacity`}
                style={{
                  left: `${startPercent}%`,
                  width: `${widthPercent}%`,
                  height: `${heightPercent}%`,
                  opacity: 0.75,
                  transition: 'all 0.3s ease'
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
} 