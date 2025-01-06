import { TrackStorage } from '../../../workout-builder/[playlistId]/utils/storage';
import { WorkoutType } from '../../../workout-builder/[playlistId]/types';
import workoutConfig from '../../../test/fixtures/workout-configs-30.json';
import { transformWorkoutConfig } from './helpers/transformConfig';

interface WorkoutConfig {
  playlistId: string;
  tracks: {
    [key: string]: {
      track: {
        id: string;
        name: string;
        artists: string[];
        duration_ms: number;
      };
      bpm: {
        tempo: number;
        isManual: boolean;
      };
      segments: Array<{
        id: string;
        startTime: number;
        endTime: number;
        title: string;
        type: WorkoutType;
        intensity: number;
      }>;
    };
  };
}

describe('TrackStorage', () => {
  const typedConfig = transformWorkoutConfig(workoutConfig) as WorkoutConfig;
  
  beforeEach(() => {
    localStorage.clear();
  });

  describe('segments', () => {
    const playlistId = typedConfig.playlistId;
    const trackId = Object.keys(typedConfig.tracks)[0].split('_')[1];
    const segments = typedConfig.tracks[`${playlistId}_${trackId}`].segments;

    it('should save and load segments correctly', () => {
      // Save segments
      TrackStorage.segments.save(playlistId, trackId, segments);

      // Load segments
      const loadedSegments = TrackStorage.segments.load(playlistId, trackId);

      // Verify
      expect(loadedSegments).toEqual(segments);
    });

    it('should detect if track has segments', () => {
      // Initially should have no data
      expect(TrackStorage.segments.hasData(playlistId, trackId)).toBe(false);

      // Save segments
      TrackStorage.segments.save(playlistId, trackId, segments);

      // Should now have data
      expect(TrackStorage.segments.hasData(playlistId, trackId)).toBe(true);
    });

    it('should handle empty segments array', () => {
      TrackStorage.segments.save(playlistId, trackId, []);
      expect(TrackStorage.segments.hasData(playlistId, trackId)).toBe(false);
    });
  });

  describe('bpm', () => {
    const playlistId = typedConfig.playlistId;
    const trackId = Object.keys(typedConfig.tracks)[0].split('_')[1];
    const bpmData = typedConfig.tracks[`${playlistId}_${trackId}`].bpm;

    it('should save and load BPM correctly', () => {
      // Save BPM
      TrackStorage.bpm.save(playlistId, trackId, bpmData.tempo);

      // Load BPM
      const loadedBPM = TrackStorage.bpm.load(playlistId, trackId);

      // Verify
      expect(loadedBPM).toEqual({
        tempo: bpmData.tempo,
        isManual: true
      });
    });

    it('should load all BPMs for a playlist', () => {
      // Save multiple BPMs
      const tracks = Object.entries(typedConfig.tracks).slice(0, 3);
      tracks.forEach(([key, data]) => {
        const trackId = key.split('_')[1];
        TrackStorage.bpm.save(playlistId, trackId, data.bpm.tempo);
      });

      // Load all BPMs
      const allBPMs = TrackStorage.bpm.loadAll(playlistId);

      // Verify
      tracks.forEach(([key, data]) => {
        const trackId = key.split('_')[1];
        expect(allBPMs[trackId]).toEqual({
          bpm: data.bpm.tempo,
          source: "manual"
        });
      });
    });
  });

  describe('combined operations', () => {
    const playlistId = typedConfig.playlistId;
    const trackKey = Object.keys(typedConfig.tracks)[0];
    const trackData = typedConfig.tracks[trackKey];
    const trackId = trackKey.split('_')[1];

    it('should save and load complete track data', () => {
      // Save track data
      TrackStorage.saveTrackData(playlistId, trackId, {
        segments: trackData.segments,
        bpm: {
          tempo: trackData.bpm.tempo,
          isManual: true
        }
      });

      // Load track data
      const loadedData = TrackStorage.loadTrackData(playlistId, trackId);

      // Verify
      expect(loadedData).toEqual({
        segments: trackData.segments,
        bpm: {
          tempo: trackData.bpm.tempo,
          isManual: true
        }
      });
    });
  });
}); 