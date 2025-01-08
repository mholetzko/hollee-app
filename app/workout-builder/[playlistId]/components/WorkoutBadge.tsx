'use client';

import { WorkoutType } from '../types';
import { WORKOUT_LABELS } from '../constants';
import { WORKOUT_COLORS } from '../constants/colors';

interface WorkoutBadgeProps {
  type: WorkoutType;
}

export function WorkoutBadge({ type }: WorkoutBadgeProps) {
  const { bg, text } = WORKOUT_COLORS[type];
  
  return (
    <div className={`px-4 py-2 rounded-lg ${bg} flex flex-col items-center justify-center`}>
      <div className={`text-2xl font-bold ${text}`}>
        {WORKOUT_LABELS[type]}
      </div>
    </div>
  );
} 