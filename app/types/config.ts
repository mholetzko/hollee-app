export interface WorkoutConfig {
  tracks: {
    [key: string]: {
      segments: Array<{
        id: string;
        startTime: number;
        endTime: number;
        title: string;
        type: string;
        intensity: number;
      }>;
      bpm?: {
        tempo: number;
        isManual: boolean;
      } | null;
    };
  };
} 