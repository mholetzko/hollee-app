import { useEffect, useRef, useState } from 'react'
import { Segment } from '../types'

interface BeatCountdownProps {
  currentPosition: number
  nextSegmentStart: number
  bpm: number
  nextSegment: Segment
}

export function BeatCountdown({ 
  currentPosition, 
  nextSegmentStart, 
  bpm, 
  nextSegment 
}: BeatCountdownProps) {
  const [beatsLeft, setBeatsLeft] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio element once
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/click.mp3') // Make sure this file exists
      audioRef.current.volume = 0.5
    }
  }, [])

  useEffect(() => {
    const beatDuration = 60000 / bpm // Duration of one beat in ms
    const timeToNext = nextSegmentStart - currentPosition
    const beats = Math.floor(timeToNext / beatDuration)

    // Only count down the last 8 beats
    setBeatsLeft(beats <= 8 ? beats : 0)

    // Play sound if we're counting down and on a beat
    if (beats <= 8 && beats >= 0 && timeToNext % beatDuration < 50) {
      try {
        if (audioRef.current) {
          audioRef.current.currentTime = 0
          audioRef.current.play().catch(error => {
            console.log('Audio play failed:', error)
          })
        }
      } catch (error) {
        console.log('Audio error:', error)
      }
    }
  }, [currentPosition, nextSegmentStart, bpm])

  if (beatsLeft <= 0 || beatsLeft > 8) return null

  return (
    <div className="flex items-center gap-4 bg-white/5 rounded-lg p-4">
      <div className="text-4xl font-mono font-bold">
        {beatsLeft}
      </div>
      <div>
        <div className="text-sm text-white/50">Coming up</div>
        <div className="font-semibold">{nextSegment.title}</div>
      </div>
    </div>
  )
} 