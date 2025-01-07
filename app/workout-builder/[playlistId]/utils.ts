export const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export const formatTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(0)
  return `${minutes}:${seconds.padStart(2, '0')}`
}

export const getIntensityColor = (intensity: number) => {
  if (intensity === -1) return 'bg-red-500/50'; // BURN mode
  if (intensity > 90) return 'bg-red-500/50';    // 90-100%
  if (intensity > 75) return 'bg-yellow-500/50';  // 75-90%
  if (intensity > 55) return 'bg-green-500/50';   // 55-75%
  if (intensity > 25) return 'bg-blue-500/50';    // 25-55%
  return 'bg-white/50';                           // 0-25%
};

export const getIntensityLabel = (intensity: number) => {
  if (intensity === -1) return "BURN";
  return `${intensity}%`;
}; 