import { Button } from '@/components/ui/button';
import { Segment, Track, WorkoutType } from '../types';
import { WORKOUT_LABELS } from '../constants';
import { SegmentTimeInput } from './SegmentTimeInput';
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

  const addSegment = () => {
    const lastSegment = [...segments].sort((a, b) => b.endTime - a.endTime)[0];
    const startTime = lastSegment ? lastSegment.endTime : 0;
    const endTime = Math.min(startTime + 60000, track.duration_ms);

    const newSegment: Segment = {
      id: uuidv4(),
      startTime,
      endTime,
      title: "New Segment",
      type: "SEATED_ROAD",
      intensity: 75,
    };

    onSegmentsChange([...segments, newSegment]);
  };

  return (
    <div className="space-y-4">
      {segments
        .sort((a, b) => a.startTime - b.startTime)
        .map((segment) => (
          <div
            key={segment.id}
            className="flex items-center gap-4 bg-white/5 p-4 rounded"
          >
            <div className="flex-1 space-y-4">
              {/* Title input */}
              <input
                type="text"
                value={segment.title}
                onChange={(e) => updateSegment(segment.id, { title: e.target.value })}
                className="w-full bg-white/5 rounded px-2 py-1"
                placeholder="Segment Title"
              />

              <div className="grid grid-cols-3 gap-4">
                {/* Time inputs */}
                <div className="col-span-2 flex gap-4">
                  <SegmentTimeInput
                    label="Start Time"
                    value={segment.startTime}
                    min={0}
                    max={segment.endTime}
                    onChange={(time) => updateSegment(segment.id, { startTime: time })}
                    formatDuration={formatDuration}
                  />
                  <SegmentTimeInput
                    label="End Time"
                    value={segment.endTime}
                    min={segment.startTime}
                    max={track.duration_ms}
                    onChange={(time) => updateSegment(segment.id, { endTime: time })}
                    formatDuration={formatDuration}
                  />
                </div>

                {/* Workout type dropdown */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Type</label>
                  <select
                    value={segment.type}
                    onChange={(e) => updateSegment(segment.id, { 
                      type: e.target.value as WorkoutType 
                    })}
                    className="w-full bg-white/5 rounded px-2 py-1.5 text-sm
                      border border-white/10 focus:border-white/20 focus:outline-none
                      appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    {(Object.entries(WORKOUT_LABELS)).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Intensity slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-400">Intensity</label>
                  <span className="text-sm font-mono">
                    {segment.intensity === -1 ? "BURN" : `${segment.intensity}%`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={segment.intensity === -1 ? 100 : segment.intensity}
                    onChange={(e) => updateSegment(segment.id, { 
                      intensity: parseInt(e.target.value) 
                    })}
                    className="w-full h-2 rounded-full bg-white/10 appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-4
                      [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-white
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:transition-all
                      [&::-webkit-slider-thumb]:hover:scale-110"
                  />
                  <button
                    onClick={() => updateSegment(segment.id, { 
                      intensity: segment.intensity === -1 ? 75 : -1 
                    })}
                    className={`px-2 py-1 rounded text-xs font-semibold
                      ${segment.intensity === -1 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white/10 hover:bg-white/20'
                      }`}
                  >
                    BURN
                  </button>
                </div>
              </div>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => removeSegment(segment.id)}
            >
              Remove
            </Button>
          </div>
        ))}
    </div>
  );
}; 