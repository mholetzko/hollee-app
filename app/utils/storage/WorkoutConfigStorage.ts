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

        // Save BPM separately - ensure we have the correct format
        if (config.bpm?.tempo) {
          TrackStorage.bpm.save(playlistId, songId, config.bpm.tempo);
        }

        console.log(`[Config Import] Saved data for track: ${songId}`, {
          segments: config.segments?.length || 0,
          bpm: config.bpm?.tempo || null
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
      config.tracks[`${playlistId}_${track.id}`] = {
        segments: trackData.segments,
        bpm: trackData.bpm // This is already in the correct format from loadTrackData
      };
    });

    return config;
  }
}; 