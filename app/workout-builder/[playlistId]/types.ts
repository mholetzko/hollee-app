export interface Track {
  id: string
  name: string
  duration_ms: number
  artists: { name: string }[]
  album?: { images?: { url: string }[] }
}

export interface Segment {
  id: string
  startTime: number
  endTime: number
  title: string
  type: WorkoutType
  intensity: number
}

export type WorkoutType = 
  | 'PLS'
  | 'SEATED_ROAD'
  | 'SEATED_CLIMB'
  | 'STANDING_CLIMB'
  | 'STANDING_JOGGING'
  | 'JUMPS'
  | 'WAVES'
  | 'PUSHES'

export interface PlaybackState {
  isPlaying: boolean
  position: number
  duration: number
}

export interface TrackBPM {
  tempo: number
  isManual: boolean
} 