import { WorkoutType } from '../../../../workout-builder/[playlistId]/types';

export function transformSegmentType(type: string): WorkoutType {
  switch (type.toUpperCase()) {
    case 'SEATED_ROAD': return WorkoutType.SEATED_ROAD;
    case 'PLS': return WorkoutType.PLS;
    case 'SEATED_CLIMB': return WorkoutType.SEATED_CLIMB;
    case 'STANDING_CLIMB': return WorkoutType.STANDING_CLIMB;
    case 'STANDING_JOGGING': return WorkoutType.STANDING_JOGGING;
    case 'JUMPS': return WorkoutType.JUMPS;
    case 'WAVES': return WorkoutType.WAVES;
    case 'PUSHES': return WorkoutType.PUSHES;
    default: return WorkoutType.SEATED_ROAD;
  }
}

interface WorkoutConfigTrack {
  track: {
    id: string;
    name: string;
    artists: string[];
    duration_ms: number;
  };
  bpm: {
    tempo: number;
    isManual: boolean;
  };
  segments: Array<{
    id: string;
    startTime: number;
    endTime: number;
    title: string;
    type: string;
    intensity: number;
  }>;
}

interface WorkoutConfigInput {
  playlistId: string;
  tracks: Record<string, WorkoutConfigTrack>;
}

export function transformWorkoutConfig(config: WorkoutConfigInput) {
  return {
    ...config,
    tracks: Object.fromEntries(
      Object.entries(config.tracks).map(([key, value]) => [
        key,
        {
          ...value,
          segments: value.segments.map((segment) => ({
            ...segment,
            type: transformSegmentType(segment.type)
          }))
        }
      ])
    )
  };
} 