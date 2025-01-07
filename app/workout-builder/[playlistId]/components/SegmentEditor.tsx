import { Button } from '@/components/ui/button';
import { Segment, WorkoutType } from '../types';
import { WORKOUT_LABELS } from '../constants';
import { SegmentTimeInput } from './SegmentTimeInput';

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
  const updateSegment = (id: string, updates: Partial<Segment>) => {
    onSegmentsChange(
      segments.map(s => s.id === id ? { ...s, ...updates } : s)
    );
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
            {/* Segment editor content */}
            {/* ... rest of the segment editor UI ... */}
          </div>
        ))}
    </div>
  );
}; 