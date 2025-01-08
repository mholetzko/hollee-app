
import enduranceWorkout from "./endurance-workout.json";

export const EXAMPLE_PLAYLISTS = {

  INTERVAL: {
    id: "0CcFnTwaImNpq7ycqAam8I",
    name: "Extensive Interval Workout",
    description:
      "A 60-minute journey from warm-up over sprints to high intensity climbs",
  },
} as const;

// Example workout configurations
export const EXAMPLE_CONFIGS = {

  [EXAMPLE_PLAYLISTS.INTERVAL.id]: enduranceWorkout,
};
