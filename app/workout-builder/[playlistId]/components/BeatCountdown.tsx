'use client'

import { useState, useRef, useEffect } from 'react'
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

  // Position update logic
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

  const getIntensityChange = () => {
    if (!currentSegment || !nextSegment) return null
    if (nextSegment.intensity === -1 || currentSegment.intensity === -1) return 'max'
    return nextSegment.intensity - currentSegment.intensity
  }

  const getPositionChange = () => {
    if (!currentSegment || !nextSegment) return false
    return nextSegment.type.includes('STANDING') !== currentSegment.type.includes('STANDING')
  }

  const intensityChange = getIntensityChange()
  const positionChange = getPositionChange()

  return (
    <div className="flex-1 p-6 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Content */}
      <div className="relative z-10 text-center space-y-4">
        {/* Large beat counter */}
        <div className="text-[12rem] font-bold font-mono leading-none text-white/90">
          {beatsUntilNext}
        </div>
        
        {/* Next segment info */}
        {nextSegment && (
          <div className="space-y-3">
            {/* Position change indicator */}
            {positionChange && (
              <div className="text-yellow-400 text-xl font-bold">
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
              ${SEGMENT_COLORS[nextSegment.type]}`}
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