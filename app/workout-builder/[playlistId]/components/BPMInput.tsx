interface BPMInputProps {
  value: number;
  onChange: (bpm: number) => void;
}

export const BPMInput: React.FC<BPMInputProps> = ({ value, onChange }) => {
  const handleBPMChange = (newValue: number) => {
    if (isNaN(newValue)) return;
    onChange(newValue);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex items-center gap-4 w-full">
        <input
          type="number"
          min="60"
          max="200"
          value={value}
          onChange={(e) => handleBPMChange(parseInt(e.target.value))}
          className="bg-white/5 rounded px-4 py-3 w-32 text-center text-2xl font-mono"
        />
        <span className="text-xl text-gray-400 font-mono">BPM</span>
      </div>
      <a 
        href={`https://songbpm.com`}
        target="_blank" 
        rel="noopener noreferrer"
        className="text-sm text-blue-400 hover:text-blue-300 underline"
      >
        Look up on SongBPM
      </a>
    </div>
  );
}; 