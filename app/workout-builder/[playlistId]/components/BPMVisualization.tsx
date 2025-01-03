'use client'

interface BPMVisualizationProps {
  bpm: number
  duration: number
  currentPosition: number
  isPlaying: boolean
}

export const BPMVisualization = ({ 
  bpm, 
  duration,
  currentPosition,
  isPlaying 
}: BPMVisualizationProps) => {
  const beatInterval = 60000 / bpm
  const totalBeats = Math.floor(duration / beatInterval)
  const currentBeat = Math.floor(currentPosition / beatInterval)
  
  return (
    <div className="relative h-12 mb-4 bg-black/20 rounded">
      {/* BPM Display */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 px-3 py-1 rounded-full text-sm font-mono">
        {Math.round(bpm)} BPM
      </div>
      
      {/* Beat markers */}
      <div className="absolute left-0 right-0 bottom-0 top-0">
        {Array.from({ length: totalBeats }).map((_, i) => {
          const position = (i * beatInterval / duration) * 100
          const isMeasureStart = i % 4 === 0
          const isHalfBeat = i % 2 === 0
          const isCurrentBeat = i === currentBeat
          
          return (
            <div
              key={`bpm-beat-${i}-${position}`}
              className={`absolute top-0 bottom-0 w-px transition-opacity
                ${isMeasureStart ? 'bg-white/40' : 
                  isHalfBeat ? 'bg-white/30' : 'bg-white/10'}
                ${isCurrentBeat && isPlaying ? 'animate-pulse' : ''}
              `}
              style={{ 
                left: `${position}%`,
                height: isMeasureStart ? '100%' : 
                  isHalfBeat ? '75%' : '50%',
                marginTop: 'auto',
                marginBottom: 'auto',
              }}
            />
          )
        })}
      </div>

      {/* Current position indicator */}
      {isPlaying && (
        <div 
          className={`absolute top-0 bottom-0 w-0.5 bg-white z-10 transition-all duration-100
            ${currentBeat % 2 === 0 ? 'opacity-100' : 'opacity-50'}`}
          style={{
            left: `${(currentPosition / duration) * 100}%`,
          }}
        />
      )}
    </div>
  )
} 