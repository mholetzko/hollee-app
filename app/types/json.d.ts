import { Segment } from "../workout-builder/[playlistId]/types";

declare module '*.json' {
  const value: {
    segments: Segment[];
    bpm?: {
      tempo: number;
      isManual: boolean;
    };
  };
  export default value;
} 