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

export enum WorkoutType {
  SEATED_ROAD = 'SEATED_ROAD',
  PLS = 'PLS',
  SEATED_CLIMB = 'SEATED_CLIMB',
  STANDING_CLIMB = 'STANDING_CLIMB',
  STANDING_JOGGING = 'STANDING_JOGGING',
  JUMPS = 'JUMPS',
  WAVES = 'WAVES',
  PUSHES = 'PUSHES'
}

export interface PlaybackState {
  isPlaying: boolean
  position: number
  duration: number
  hasStarted: boolean
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
export const getStorageKey = (playlistId: string, songId: string, type: 'segments' | 'bpm', position?: number) => {
  const baseKey = `playlist_${playlistId}_${type}_${songId}`;
  return position !== undefined ? `${baseKey}_pos_${position}` : baseKey;
};

export const getTrackBPMKey = (playlistId: string, songId: string, position?: number) => {
  const baseKey = `${playlistId}_${songId}`;
  return position !== undefined ? `${baseKey}_pos_${position}` : baseKey;
};

export const WORKOUT_LABELS: Record<WorkoutType, string> = {
  PLS: 'PLS',
  SEATED_ROAD: 'SeRo',
  SEATED_CLIMB: 'SeCl',
  STANDING_CLIMB: 'StCl',
  STANDING_JOGGING: 'StJo',
  JUMPS: 'Jump',
  WAVES: 'Wave',
  PUSHES: 'Push',
} as const;

export const SEGMENT_COLORS: Record<WorkoutType, string> = {
  PLS: 'bg-purple-500/50',
  SEATED_ROAD: 'bg-blue-500/50',
  SEATED_CLIMB: 'bg-green-500/50',
  STANDING_CLIMB: 'bg-yellow-500/50',
  STANDING_JOGGING: 'bg-orange-500/50',
  JUMPS: 'bg-red-500/50',
  WAVES: 'bg-pink-500/50',
  PUSHES: 'bg-indigo-500/50',
} as const;