import { WorkoutType } from '../types';

export const WORKOUT_COLORS: Record<WorkoutType, { bg: string; text: string }> = {
  PLS: { bg: "bg-purple-500/20", text: "text-purple-300" },
  SEATED_ROAD: { bg: "bg-blue-500/20", text: "text-blue-300" },
  SEATED_CLIMB: { bg: "bg-green-500/20", text: "text-green-300" },
  STANDING_CLIMB: { bg: "bg-yellow-500/20", text: "text-yellow-300" },
  STANDING_JOGGING: { bg: "bg-orange-500/20", text: "text-orange-300" },
  JUMPS: { bg: "bg-red-500/20", text: "text-red-300" },
  WAVES: { bg: "bg-pink-500/20", text: "text-pink-300" },
  PUSHES: { bg: "bg-indigo-500/20", text: "text-indigo-300" },
}; 