import { Segment, Track } from '../../workout-builder/[playlistId]/types';
import { TrackStorage } from './TrackStorage';

interface TrackData {
  segments?: Array<{
    id: string;
    startTime: number;
    endTime: number;
    title: string;
    type: string;
    intensity: number;
  }>;
  bpm?: {
    tempo: number;
    isManual: boolean;
  } | null;
  clip?: {
    startTime: number;
    endTime: number;
  };
}

interface ConfigData {
  tracks: Record<string, TrackData>;
}

export const WorkoutConfigStorage = {
  importConfig: async (playlistId: string, configFile: File) => {
    try {
      const text = await configFile.text();
      const data = JSON.parse(text) as ConfigData;
      
      if (!data.tracks || typeof data.tracks !== 'object') {
        throw new Error('Invalid configuration file format');
      }

      Object.entries(data.tracks).forEach(([key, config]: [string, TrackData]) => {
        const songId = key.includes('_') ? key.split('_')[1] : key;
        
        if (!songId || !config) {
          console.warn(`[Config Import] Skipping invalid entry: ${key}`);
          return;
        }

        // Save segments
        if (config.segments) {
          TrackStorage.segments.save(playlistId, songId, config.segments as Segment[]);
        }

        // Save BPM
        if (config.bpm?.tempo) {
          TrackStorage.bpm.save(playlistId, songId, config.bpm.tempo, config.bpm.isManual);
        }

        // Save clip boundaries
        if (config.clip) {
          TrackStorage.clip.save(playlistId, songId, config.clip);
        }

        console.log(`[Config Import] Saved data for track: ${songId}`, {
          segments: config.segments?.length || 0,
          bpm: config.bpm?.tempo || null,
          clip: config.clip || null
        });
      });

      return { success: true, message: 'Configuration imported successfully' };
    } catch (error) {
      console.error('[Config Import] Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import configuration'
      };
    }
  },

  exportConfig: (playlistId: string, tracks: Track[]) => {
    const config = {
      exportDate: new Date().toISOString(),
      playlistId,
      tracks: {} as Record<string, TrackData>
    };

    tracks.forEach(track => {
      const trackData = TrackStorage.loadTrackData(playlistId, track.id);
      const clipData = TrackStorage.clip.load(playlistId, track.id);
      
      config.tracks[`${playlistId}_${track.id}`] = {
        segments: trackData.segments,
        bpm: trackData.bpm,
        clip: clipData || { startTime: 0, endTime: track.duration_ms }
      };
    });

    return config;
  },

  hasConfig(playlistId: string): boolean {
    try {
      // Check if we have any segments stored for this playlist
      const allSegments = localStorage.getItem(`playlist_${playlistId}_segments`);
      if (!allSegments) return false;

      // Parse the segments to verify it's valid data
      const parsedSegments = JSON.parse(allSegments);
      return Object.keys(parsedSegments).length > 0;
    } catch (error) {
      console.error('Error checking config existence:', error);
      return false;
    }
  },

  importConfigData: async (playlistId: string, config: any) => {
    try {
      // Validate the config structure
      if (!config.tracks || typeof config.tracks !== 'object') {
        throw new Error('Invalid configuration format');
      }

      // Import each track's data
      Object.entries(config.tracks).forEach(([key, trackData]: [string, any]) => {
        const [, trackId] = key.split('_');
        if (!trackId) return;

        // Save segments if they exist
        if (trackData.segments) {
          TrackStorage.segments.save(playlistId, trackId, trackData.segments);
        }

        // Save BPM if it exists
        if (trackData.bpm?.tempo) {
          TrackStorage.bpm.save(playlistId, trackId, trackData.bpm.tempo);
        }
      });

      return {
        success: true,
        message: 'Configuration imported successfully'
      };
    } catch (error) {
      console.error('Error importing config:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import configuration'
      };
    }
  }
}; 