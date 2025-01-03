import React, { useState, useEffect } from 'react'

interface BeatCountdownProps {
  currentPosition: number
  nextSegmentStart: number
  bpm: number
  nextSegment?: {
    title: string
    type: string
  }
}

export const BeatCountdown = ({ 
  currentPosition, 
  nextSegmentStart,
  bpm,
  nextSegment 
}: BeatCountdownProps) => {
  const timeUntilNext = nextSegmentStart - currentPosition
  const beatsUntilNext = Math.ceil(timeUntilNext / (60000 / bpm))
  const [beatFlash, setBeatFlash] = useState(false)
  
  useEffect(() => {
    const beatInterval = 60000 / bpm
    const currentBeat = Math.floor(currentPosition / beatInterval)
    
    setBeatFlash(true)
    const timeout = setTimeout(() => setBeatFlash(false), 100)
    
    return () => clearTimeout(timeout)
  }, [Math.floor(currentPosition / (60000 / bpm)), bpm])

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-black/20 rounded-lg relative overflow-hidden">
      <div 
        className={`absolute inset-0 bg-white/5 transition-opacity duration-200
          ${beatFlash ? 'opacity-100' : 'opacity-0'}`}
      />
      
      <div 
        className={`text-7xl font-mono font-bold mb-2 transition-all duration-100
          ${beatsUntilNext <= 4 ? 'text-red-400' : 'text-white/90'}
          ${beatFlash ? 'scale-110' : 'scale-100'}`}
      >
        {beatsUntilNext}
      </div>
      
      <div className="text-sm text-gray-400 text-center">
        <div>beats until</div>
        <div className="font-medium text-white/80">
          {nextSegment ? nextSegment.title : 'end'}
        </div>
      </div>

      <div className="absolute bottom-2 right-2 text-xs text-gray-500">
        {Math.round(bpm)} BPM
      </div>
    </div>
  )
}