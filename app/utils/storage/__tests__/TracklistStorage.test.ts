import { TracklistStorage } from '../TracklistStorage';
import workoutConfig from '../../../test/fixtures/workout-configs-30.json';

interface WorkoutConfig {
  playlistId: string;
  tracks: Record<string, unknown>;
}

describe('TracklistStorage', () => {
  const typedConfig = workoutConfig as WorkoutConfig;
  
  beforeEach(() => {
    localStorage.clear();
  });

  const playlistId = typedConfig.playlistId;
  const trackCount = Object.keys(typedConfig.tracks).length;

  it('should save and load tracklist length', () => {
    // Save length
    TracklistStorage.save(playlistId, trackCount);

    // Load length
    const loadedLength = TracklistStorage.load(playlistId);

    // Verify
    expect(loadedLength).toBe(trackCount);
  });

  it('should return null for non-existent playlist', () => {
    const length = TracklistStorage.load('non-existent-playlist');
    expect(length).toBeNull();
  });

  it('should handle invalid stored data', () => {
    // Manually set invalid data
    localStorage.setItem(TracklistStorage.getKey(playlistId), 'not-a-number');

    // Should handle error and return null
    const length = TracklistStorage.load(playlistId);
    expect(length).toBeNull();
  });
}); 