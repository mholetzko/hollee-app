import { EXAMPLE_CONFIGS, EXAMPLE_PLAYLISTS } from '@/app/config/example-workouts';
import { WorkoutConfigStorage } from './WorkoutConfigStorage';
import { TrackStorage } from './TrackStorage';
import { TracklistStorage } from './TracklistStorage';

export const ExampleWorkoutStorage = {
  isExamplePlaylist(playlistId: string): boolean {
    return Object.values(EXAMPLE_PLAYLISTS).some(playlist => playlist.id === playlistId);
  },

  hasConfig(playlistId: string): boolean {
    // Use the existing WorkoutConfigStorage.hasConfig method
    return WorkoutConfigStorage.hasConfig(playlistId);
  },

  initializeIfExample: (playlistId: string) => {
    // Check if we've already initialized this playlist
    const initKey = `playlist:${playlistId}:initialized`;
    if (localStorage.getItem(initKey)) {
      return;
    }

    // Check if there are any existing segments for any tracks
    const hasExistingWorkouts = TracklistStorage.load(playlistId) > 0;
    if (hasExistingWorkouts) {
      localStorage.setItem(initKey, 'true');
      return;
    }

    // Initialize example workouts only if this is an example playlist
    if (playlistId === EXAMPLE_PLAYLIST_ID) {
      console.log('[Example Storage] Initializing example workouts');
      
      // Load example configurations
      const exampleConfigs = EXAMPLE_WORKOUT_CONFIGS;
      
      // Store configurations
      Object.entries(exampleConfigs).forEach(([trackId, config]) => {
        if (config.segments) {
          TrackStorage.segments.save(playlistId, trackId, config.segments);
        }
        if (config.bpm) {
          TrackStorage.bpm.save(playlistId, trackId, config.bpm);
        }
      });

      // Mark as initialized
      localStorage.setItem(initKey, 'true');
    }
  },
}; 