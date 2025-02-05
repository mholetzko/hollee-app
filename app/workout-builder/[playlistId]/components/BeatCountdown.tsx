'use client'

import { useEffect, useRef, useState } from 'react'
import { Segment } from '../types'
import { SEGMENT_COLORS, WORKOUT_LABELS } from '../constants'
import { ChevronUpIcon, ChevronDownIcon } from "@radix-ui/react-icons"

interface BeatCountdownProps {
  currentPosition: number
  nextSegmentStart: number
  bpm: number
  nextSegment?: Segment
  currentSegment?: Segment
}

// Audio pool helper class
class AudioPool {
  private pool: HTMLAudioElement[] = []
  private index = 0

  constructor(src: string, poolSize: number = 3) {
    for (let i = 0; i < poolSize; i++) {
      const audio = new Audio()
      // Add error handling for audio loading
      audio.addEventListener('error', (e) => {
        console.warn(`Audio loading error for ${src}:`, e.error)
      })
      // Set source after adding error listener
      audio.src = src
      audio.volume = 0.5
      this.pool.push(audio)
    }
  }

  play() {
    const audio = this.pool[this.index]
    // Check if audio is actually loaded before playing
    if (audio.readyState >= 2) {
      audio.currentTime = 0
      audio.play().catch(err => {
        console.warn('Audio play failed:', err)
        // Try to reload the audio
        audio.load()
      })
    }
    this.index = (this.index + 1) % this.pool.length
  }

  setVolume(volume: number) {
    this.pool.forEach(audio => audio.volume = volume)
  }

  cleanup() {
    this.pool.forEach(audio => {
      audio.pause()
      audio.src = ''
    })
  }
}

export function BeatCountdown({ 
  currentPosition, 
  nextSegmentStart, 
  bpm, 
  nextSegment,
  currentSegment 
}: BeatCountdownProps) {
  const [smoothPosition, setSmoothPosition] = useState(currentPosition)
  const lastUpdateTime = useRef(Date.now())
  const animationFrameRef = useRef<number>(0)
  
  // Use refs for audio pools
  const lowClickPool = useRef<AudioPool | null>(null)
  const highClickPool = useRef<AudioPool | null>(null)
  const countPool = useRef<{ [key: number]: AudioPool }>({})

  // Initialize audio pools
  useEffect(() => {
    lowClickPool.current = new AudioPool('/sounds/click-low.mp3', 3)
    lowClickPool.current.setVolume(0.3)

    highClickPool.current = new AudioPool('/sounds/click-high.mp3', 3)
    highClickPool.current.setVolume(0.5)

    // Initialize countdown voice pools
    for (let i = 1; i <= 4; i++) {
      countPool.current[i] = new AudioPool(`/sounds/count-${i}.mp3`, 2)
      countPool.current[i].setVolume(0.7)
    }

    return () => {
      lowClickPool.current?.cleanup()
      highClickPool.current?.cleanup()
      Object.values(countPool.current).forEach(pool => pool.cleanup())
    }
  }, [])

  // Position update logic...
  useEffect(() => {
    const updatePosition = () => {
      const now = Date.now()
      const delta = now - lastUpdateTime.current
      lastUpdateTime.current = now
      setSmoothPosition(prev => 
        Math.abs(prev + delta - currentPosition) > 1000 
          ? currentPosition 
          : prev + delta
      )
      animationFrameRef.current = requestAnimationFrame(updatePosition)
    }
    
    animationFrameRef.current = requestAnimationFrame(updatePosition)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [currentPosition])

  const beatDuration = 60000 / bpm
  const timeToNext = nextSegmentStart - smoothPosition
  const beatsUntilNext = Math.ceil(timeToNext / beatDuration)

  // Enhanced audio cues with pooling
  useEffect(() => {
    if (timeToNext % beatDuration < 50) {
      if (beatsUntilNext <= 4) {
        highClickPool.current?.play()
        if (beatsUntilNext > 0) {
          countPool.current[beatsUntilNext]?.play()
        }
      } else if (beatsUntilNext <= 8) {
        lowClickPool.current?.play()
      }
    }
  }, [beatsUntilNext, timeToNext, beatDuration])

  const getIntensityChange = () => {
    if (!currentSegment || !nextSegment) return null
    if (nextSegment.intensity === -1 || currentSegment.intensity === -1) return 'max'
    return nextSegment.intensity - currentSegment.intensity
  }

  const getPositionChange = () => {
    if (!currentSegment || !nextSegment) return false
    return nextSegment.type.includes('STANDING') !== currentSegment.type.includes('STANDING')
  }

  // Get styles based on countdown phase with fine-grained linear steps
  const getCountdownStyles = (beats: number) => {
    // Ultra linear scaling with 0.25 beat precision
    const getScaleForBeats = (beats: number): number => {
      if (beats <= 4) {
        // Final countdown phase: 100 -> 150 in 0.25 steps
        const stepsRemaining = beats * 4  // 16 total steps for last 4 beats
        return 100 + ((16 - stepsRemaining) * 3.125)  // Linear increase to 150
      }
      if (beats <= 8) {
        // Warning phase: scale slightly (100 -> 105)
        const stepsRemaining = (beats - 4) * 4  // 16 steps for beats 8-4
        return 100 + ((16 - stepsRemaining) * 0.3125)  // Linear increase to 105
      }
      return 100  // Default scale
    }

    // Get precise opacity based on beats
    const getOpacity = (beats: number): number => {
      if (beats <= 4) {
        return 100 - (beats * 25)  // 100% -> 0% linearly
      }
      if (beats <= 8) {
        return 50 - ((beats - 4) * 12.5)  // 50% -> 0% linearly
      }
      return 0
    }

    const scale = getScaleForBeats(beats)
    const opacity = getOpacity(beats)

    if (beats <= 4) {
      return {
        text: `text-red-400 scale-${Math.round(scale)}`,
        ring: `border-red-400/${Math.round(opacity)}`,
        glow: `shadow-lg shadow-red-400/${Math.round(opacity)}`,
        background: `bg-red-400/${Math.round(opacity / 5)}`,
        animate: 'animate-pulse-fast'
      }
    }
    
    if (beats <= 8) {
      return {
        text: `text-yellow-400 scale-${Math.round(scale)}`,
        ring: `border-yellow-400/${Math.round(opacity)}`,
        glow: `shadow-md shadow-yellow-400/${Math.round(opacity)}`,
        background: `bg-yellow-400/${Math.round(opacity / 5)}`,
        animate: 'animate-pulse'
      }
    }

    return {
      text: 'text-white/90',
      ring: 'border-white/20',
      glow: '',
      background: '',
      animate: ''
    }
  }

  const intensityChange = getIntensityChange()
  const positionChange = getPositionChange()
  const styles = getCountdownStyles(beatsUntilNext)

  return (
    <div className={`flex-1 p-6 rounded-lg flex flex-col items-center justify-center 
      relative overflow-hidden transition-all duration-300 
      ${styles.background}`}
    >
      {/* Rings animation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`absolute w-72 h-72 rounded-full border-4 
          transition-all duration-300 ${styles.ring} ${styles.animate}`} 
        />
        <div className={`absolute w-64 h-64 rounded-full border-2 
          transition-all duration-300 ${styles.ring} ${styles.animate} delay-75`} 
        />
        <div className={`absolute w-56 h-56 rounded-full border 
          transition-all duration-300 ${styles.ring} ${styles.animate} delay-150`} 
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-4">
        {/* Early warning for instructors (16-8 beats) */}
        {beatsUntilNext <= 16 && beatsUntilNext > 8 && nextSegment && (
          <div className="text-blue-400 text-xl font-medium animate-pulse">
            Get Ready
          </div>
        )}

        {/* Large countdown number */}
        <div className={`text-[12rem] font-bold font-mono leading-none
          transition-all duration-300 
          ${styles.text} ${styles.glow}`}
        >
          {beatsUntilNext}
        </div>
        
        {/* Enhanced transition info for instructors */}
        {nextSegment && beatsUntilNext <= 8 && (
          <div className="space-y-3">
            {/* Position change indicator */}
            {positionChange && (
              <div className="text-yellow-400 text-xl font-bold animate-pulse">
                {nextSegment.type.includes('STANDING') ? 'Standing Up!' : 'Taking it Down!'}
              </div>
            )}

            {/* Intensity change indicator */}
            {intensityChange && (
              <div className="flex items-center justify-center gap-2 text-xl">
                {intensityChange > 0 ? (
                  <ChevronUpIcon className="w-6 h-6 text-red-400" />
                ) : (
                  <ChevronDownIcon className="w-6 h-6 text-green-400" />
                )}
                <span className="font-bold">
                  {intensityChange === 'max' ? 'MAX EFFORT!' : `${Math.abs(intensityChange)}%`}
                </span>
              </div>
            )}

            {/* Next segment info */}
            <div className={`text-2xl px-6 py-3 rounded-full backdrop-blur-sm
              transition-all duration-300 transform
              ${SEGMENT_COLORS[nextSegment.type]} 
              ${styles.glow}
              ${beatsUntilNext <= 4 ? 'scale-110' : 'scale-100'}`}
            >
              <span className="font-bold">
                {WORKOUT_LABELS[nextSegment.type]}
                {nextSegment.intensity === -1 ? ' BURN!' : ` ${nextSegment.intensity}%`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}