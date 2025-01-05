'use client'

import { useEffect, useRef, useState } from 'react'
import { Segment } from '../types'
import { SEGMENT_COLORS, WORKOUT_LABELS } from '../constants'

interface BeatCountdownProps {
  currentPosition: number
  nextSegmentStart: number
  bpm: number
  nextSegment?: Segment
}

export function BeatCountdown({ 
  currentPosition, 
  nextSegmentStart, 
  bpm, 
  nextSegment 
}: BeatCountdownProps) {
  const [smoothPosition, setSmoothPosition] = useState(currentPosition)
  const lastUpdateTime = useRef(Date.now())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animationFrameRef = useRef<number>(0)

  // Create audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/click.mp3')
      audioRef.current.volume = 0.5
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  // Smooth position update using requestAnimationFrame
  useEffect(() => {
    const updatePosition = () => {
      const now = Date.now()
      const delta = now - lastUpdateTime.current
      lastUpdateTime.current = now

      setSmoothPosition((prev) => {
        const newPosition = prev + delta
        return Math.abs(newPosition - currentPosition) > 1000 
          ? currentPosition 
          : newPosition
      })
      
      animationFrameRef.current = requestAnimationFrame(updatePosition)
    }
    
    animationFrameRef.current = requestAnimationFrame(updatePosition)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [currentPosition])

  const beatDuration = 60000 / bpm
  const timeToNext = nextSegmentStart - smoothPosition
  const beatsUntilNext = Math.ceil(timeToNext / beatDuration)

  // Play click on each beat
  useEffect(() => {
    if (beatsUntilNext <= 8 && timeToNext % beatDuration < 50) {
      try {
        if (audioRef.current) {
          audioRef.current.currentTime = 0
          audioRef.current.play().catch(console.error)
        }
      } catch (error) {
        console.error('Audio error:', error)
      }
    }
  }, [beatsUntilNext, timeToNext, beatDuration])

  if (beatsUntilNext > 8) return null

  return (
    <div className="flex-1 p-6 bg-black/20 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`absolute w-64 h-64 rounded-full border-4 opacity-20
          ${beatsUntilNext <= 4 ? 'border-red-400' : 
            beatsUntilNext <= 8 ? 'border-yellow-400' : 
            'border-white'} 
          animate-ping-slow`}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        <div className={`text-8xl font-bold font-mono mb-2
          ${beatsUntilNext <= 4 ? 'text-red-400' : 
            beatsUntilNext <= 8 ? 'text-yellow-400' : 
            'text-white'}`}
        >
          {beatsUntilNext}
        </div>
        <div className="text-xl text-gray-400 mb-4">
          {formatTime(timeToNext)} left
        </div>
        {nextSegment && (
          <div className={`text-lg px-3 py-1 rounded-full backdrop-blur-sm
            ${SEGMENT_COLORS[nextSegment.type]} shadow-glow`}
          >
            Next: {WORKOUT_LABELS[nextSegment.type]}
            {nextSegment.intensity === -1 ? ' BURN!' : ` ${nextSegment.intensity}%`}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to format time
const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
}