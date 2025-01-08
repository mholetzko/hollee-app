import { EXAMPLE_CONFIGS, EXAMPLE_PLAYLISTS } from '@/app/config/example-workouts';
import { WorkoutConfigStorage } from './WorkoutConfigStorage';

export const ExampleWorkoutStorage = {
  isExamplePlaylist(playlistId: string): boolean {
    return Object.values(EXAMPLE_PLAYLISTS).some(playlist => playlist.id === playlistId);
  },

  hasConfig(playlistId: string): boolean {
    // Use the existing WorkoutConfigStorage.hasConfig method
    return WorkoutConfigStorage.hasConfig(playlistId);
  },

  async initializeIfExample(playlistId: string): Promise<boolean> {
    if (!this.isExamplePlaylist(playlistId)) {
      return false;
    }

    // Check if this example playlist has already been initialized
    const hasExistingConfig = this.hasConfig(playlistId);
    if (hasExistingConfig) {
      return false;
    }

    // Get the example config
    const exampleConfig = EXAMPLE_CONFIGS[playlistId];
    if (!exampleConfig) {
      return false;
    }

    // Initialize the workout configuration
    try {
      await WorkoutConfigStorage.importConfigData(playlistId, exampleConfig);
      return true;
    } catch (error) {
      console.error('Failed to initialize example workout:', error);
      return false;
    }
  }
}; 