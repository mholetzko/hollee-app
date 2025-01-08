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

export interface Segment {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
  type: WorkoutType;
  intensity: number;
}

export interface TrackBPM {
  tempo: number;
  isManual: boolean;
}

export interface TrackData {
  segments: Segment[];
  bpm: TrackBPM | null;
}