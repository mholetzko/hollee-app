import { WorkoutType } from './types'

export const SEGMENT_COLORS: Record<WorkoutType, string> = {
  PLS: 'bg-purple-500/50',
  SEATED_ROAD: 'bg-blue-500/50',
  SEATED_CLIMB: 'bg-green-500/50',
  STANDING_CLIMB: 'bg-yellow-500/50',
  STANDING_JOGGING: 'bg-orange-500/50',
  JUMPS: 'bg-red-500/50',
  WAVES: 'bg-pink-500/50',
  PUSHES: 'bg-indigo-500/50',
} as const

export const SEGMENT_COLORS_HOVER: Record<WorkoutType, string> = {
  PLS: 'hover:bg-purple-500/70',
  SEATED_ROAD: 'hover:bg-blue-500/70',
  SEATED_CLIMB: 'hover:bg-green-500/70',
  STANDING_CLIMB: 'hover:bg-yellow-500/70',
  STANDING_JOGGING: 'hover:bg-orange-500/70',
  JUMPS: 'hover:bg-red-500/70',
  WAVES: 'hover:bg-pink-500/70',
  PUSHES: 'hover:bg-indigo-500/70',
} as const

export const WORKOUT_LABELS: Record<string, string> = {
  PLS: 'PLS',
  SEATED_ROAD: 'SeRo',
  SEATED_CLIMB: 'SeCl',
  STANDING_CLIMB: 'StCl',
  STANDING_JOGGING: 'StJo',
  JUMPS: 'Jump',
  WAVES: 'Wave',
  PUSHES: 'Push',
} as const 