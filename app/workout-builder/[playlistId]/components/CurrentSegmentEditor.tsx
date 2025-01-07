import { Segment, WorkoutType } from '../types';
import { WORKOUT_LABELS } from '../constants';
import { SegmentTimeInput } from './SegmentTimeInput';

interface CurrentSegmentEditorProps {
  segment?: Segment;
  onSegmentChange: (updates: Partial<Segment>) => void;
  track: Track;
  formatDuration: (ms: number) => string;
}

export const CurrentSegmentEditor: React.FC<CurrentSegmentEditorProps> = ({
  segment,
  onSegmentChange,
  track,
  formatDuration,
}) => {
  if (!segment) {
    return (
      <div className="bg-white/5 rounded-lg p-4">
        <div className="text-sm text-gray-400 text-center">
          No active segment
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Current Segment</h3>
        <span className="text-sm text-gray-400">
          Duration: {formatDuration(segment.endTime - segment.startTime)}
        </span>
      </div>

      {/* Title input */}
      <input
        type="text"
        value={segment.title}
        onChange={(e) => onSegmentChange({ title: e.target.value })}
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
            onChange={(time) => onSegmentChange({ startTime: time })}
            formatDuration={formatDuration}
          />
          <SegmentTimeInput
            label="End Time"
            value={segment.endTime}
            min={segment.startTime}
            max={track.duration_ms}
            onChange={(time) => onSegmentChange({ endTime: time })}
            formatDuration={formatDuration}
          />
        </div>

        {/* Workout type dropdown */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Type</label>
          <select
            value={segment.type}
            onChange={(e) => onSegmentChange({ 
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
            onChange={(e) => onSegmentChange({ 
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
            onClick={() => onSegmentChange({ 
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
  );
}; 