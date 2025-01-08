import { WorkoutType } from "../workout-builder/[playlistId]/types";
import enduranceWorkout from "./endurance-workout.json";

export const EXAMPLE_PLAYLISTS = {
  INTERVAL_1: {
    id: "4Ez60VYkFSjjlAFoVKu0tG",
    name: "Extensive Interval Workout 1",
    description: "High-intensity interval training with varied segments",
  },
  INTERVAL_2: {
    id: "0CcFnTwaImNpq7ycqAam8I",
    name: "Extensive Interval Workout 2",
    description:
      "A 60-minute journey from warm-up over sprints to high intensity climbs",
  },
} as const;

// Example workout configurations
export const EXAMPLE_CONFIGS = {
  [EXAMPLE_PLAYLISTS.INTERVAL_1.id]: {
    // ... your HIIT configuration
  },
  [EXAMPLE_PLAYLISTS.INTERVAL_2.id]: enduranceWorkout,
};
