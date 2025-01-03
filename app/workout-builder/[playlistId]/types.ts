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
  track_window: {
    current_track: {
      id: string
    }
  }
}

export interface TrackBPM {
  tempo: number
  isManual: boolean
}

// Add a helper function to generate storage keys
export const getStorageKey = (playlistId: string, songId: string, type: 'segments' | 'bpm') => {
  return `playlist_${playlistId}_${type}_${songId}`;
}; 