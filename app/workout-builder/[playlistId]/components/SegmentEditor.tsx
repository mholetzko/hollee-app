import { Button } from '@/components/ui/button';
import { Segment, Track, WorkoutType } from '../types';
import { WORKOUT_LABELS } from '../constants';
import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface SegmentEditorProps {
  segments: Segment[];
  onSegmentsChange: (segments: Segment[]) => void;
  track: Track;
}

export const SegmentEditor: React.FC<SegmentEditorProps> = ({
  segments,
  onSegmentsChange,
  track,
}) => {
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const updateSegment = (id: string, updates: Partial<Segment>) => {
    onSegmentsChange(
      segments.map(s => s.id === id ? { ...s, ...updates } : s)
    );
  };

  const removeSegment = (id: string) => {
    onSegmentsChange(segments.filter(s => s.id !== id));
  };

  useEffect(() => {
    if (track.duration_ms && segments.length === 0) {
      // Create initial full-length segment
      const initialSegment: Segment = {
        id: uuidv4(),
        type: 'SEATED_ROAD',
        startTime: 0,
        endTime: track.duration_ms,
        intensity: 70,
        title: 'Base Ride'
      };
      onSegmentsChange([initialSegment]);
    }
  }, [track.duration_ms, segments.length, onSegmentsChange]);

  return (
    <div className="space-y-2">
      {segments
        .sort((a, b) => a.startTime - b.startTime)
        .map((segment) => (
          <div
            key={segment.id}
            className="group flex items-center gap-2 bg-white/5 p-2 rounded hover:bg-white/10 transition-colors"
          >
            {/* Main segment info */}
            <div className="flex-1 min-w-0">
              {/* Title and duration */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={segment.title}
                  onChange={(e) => updateSegment(segment.id, { title: e.target.value })}
                  className="flex-1 min-w-0 bg-transparent text-sm font-medium focus:outline-none focus:bg-white/5 rounded px-1"
                  placeholder="Segment Title"
                />
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatDuration(segment.startTime)} - {formatDuration(segment.endTime)}
                </span>
              </div>

              {/* Type and intensity */}
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={segment.type}
                  onChange={(e) => updateSegment(segment.id, { 
                    type: e.target.value as WorkoutType 
                  })}
                  className="bg-transparent text-xs text-gray-400 focus:outline-none cursor-pointer"
                >
                  {(Object.entries(WORKOUT_LABELS)).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-400">•</span>
                <div className="flex items-center gap-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={segment.intensity === -1 ? 100 : segment.intensity}
                    onChange={(e) => updateSegment(segment.id, { 
                      intensity: parseInt(e.target.value) 
                    })}
                    className="w-20 h-1 rounded-full bg-white/10 appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-2
                      [&::-webkit-slider-thumb]:h-2
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-white"
                  />
                  <button
                    onClick={() => updateSegment(segment.id, { 
                      intensity: segment.intensity === -1 ? 75 : -1 
                    })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium
                      ${segment.intensity === -1 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white/10 hover:bg-white/20'
                      }`}
                  >
                    {segment.intensity === -1 ? "BURN" : `${segment.intensity}%`}
                  </button>
                </div>
              </div>
            </div>

            {/* Remove button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeSegment(segment.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        ))}
    </div>
  );
}; 