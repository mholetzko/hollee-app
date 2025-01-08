'use client';

import { WorkoutType } from '../types';
import { WORKOUT_LABELS } from '../constants';
import { WORKOUT_COLORS } from '../constants/colors';

interface SmallWorkoutBadgeProps {
  type: WorkoutType;
}

export function SmallWorkoutBadge({ type }: SmallWorkoutBadgeProps) {
  const { bg, text } = WORKOUT_COLORS[type];
  
  return (
    <div className={`px-3 py-1.5 rounded-md ${bg} ${text} text-sm font-medium`}>
      {WORKOUT_LABELS[type]}
    </div>
  );
} 