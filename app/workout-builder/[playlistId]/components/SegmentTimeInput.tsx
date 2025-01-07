interface SegmentTimeInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (time: number) => void;
  formatDuration: (ms: number) => string;
}

export const SegmentTimeInput: React.FC<SegmentTimeInputProps> = ({
  label,
  value,
  min,
  max,
  onChange,
  formatDuration,
}) => {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400">{label}</label>
      <input
        type="text"
        className="bg-white/5 rounded px-2 py-1 text-sm font-mono"
        value={formatDuration(value)}
        onChange={(e) => {
          const [minutes, seconds] = e.target.value.split(":").map(Number);
          if (isNaN(minutes) || isNaN(seconds)) return;
          
          const newTime = (minutes * 60 + seconds) * 1000;
          if (newTime >= min && newTime <= max) {
            onChange(newTime);
          }
        }}
      />
    </div>
  );
}; 