import { Segment } from "../../workout-builder/[playlistId]/types";
import { Track } from "../../workout-builder/[playlistId]/types";

interface TrackData {
  segments: Segment[];
  bpm?: {
    tempo: number;
    isManual: boolean;
  };
}

export const TrackStorage = {
  tracks: {
    load: (playlistId: string) => {
      try {
        const key = `playlist:${playlistId}:tracks`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
      } catch (error) {
        console.error("[TrackStorage] Error loading tracks:", error);
        return [];
      }
    },
    save: (playlistId: string, tracks: Track[]) => {
      try {
        const key = `playlist:${playlistId}:tracks`;
        localStorage.setItem(key, JSON.stringify(tracks));
      } catch (error) {
        console.error("[TrackStorage] Error saving tracks:", error);
      }
    }
  },
  segments: {
    save: (playlistId: string, trackId: string, segments: Segment[]) => {
      try {
        const key = `playlist:${playlistId}:track:${trackId}:segments`;
        localStorage.setItem(key, JSON.stringify(segments));
      } catch (error) {
        console.error("[TrackStorage] Error saving segments:", error);
      }
    },
    load: (playlistId: string, trackId: string): Segment[] => {
      try {
        const key = `playlist:${playlistId}:track:${trackId}:segments`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
      } catch (error) {
        console.error("[TrackStorage] Error loading segments:", error);
        return [];
      }
    },
    loadAll: (playlistId: string): Record<string, Segment[]> => {
      try {
        const segmentsData: Record<string, Segment[]> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(`playlist:${playlistId}:track:`) && key.endsWith(':segments')) {
            const trackId = key.split(':')[3];
            const data = localStorage.getItem(key);
            if (data) {
              segmentsData[trackId] = JSON.parse(data);
            }
          }
        }
        return segmentsData;
      } catch (error) {
        console.error("[TrackStorage] Error loading all segments:", error);
        return {};
      }
    },
    hasData: (playlistId: string, trackId: string): boolean => {
      try {
        const key = `playlist:${playlistId}:track:${trackId}:segments`;
        console.log("Checking key:", key);
        const data = localStorage.getItem(key);
        console.log("Found data:", data);
        if (!data) return false;
        const segments = JSON.parse(data);
        console.log("Parsed segments:", segments);
        return Array.isArray(segments) && segments.length > 0;
      } catch (error) {
        console.error("[TrackStorage] Error checking segments:", error);
        return false;
      }
    }
  },
  bpm: {
    save: (playlistId: string, trackId: string, bpm: number, isManual: boolean = true) => {
      try {
        const key = `playlist:${playlistId}:track:${trackId}:bpm`;
        localStorage.setItem(key, JSON.stringify({ tempo: bpm, isManual }));
      } catch (error) {
        console.error("[TrackStorage] Error saving BPM:", error);
      }
    },
    load: (playlistId: string, trackId: string) => {
      try {
        const key = `playlist:${playlistId}:track:${trackId}:bpm`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error("[TrackStorage] Error loading BPM:", error);
        return null;
      }
    },
    loadAll: (playlistId: string) => {
      try {
        const bpmData: Record<string, { tempo: number; isManual: boolean }> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(`playlist:${playlistId}:track:`) && key.endsWith(':bpm')) {
            const trackId = key.split(':')[3];
            const data = localStorage.getItem(key);
            if (data) {
              bpmData[trackId] = JSON.parse(data);
            }
          }
        }
        return bpmData;
      } catch (error) {
        console.error("[TrackStorage] Error loading all BPMs:", error);
        return {};
      }
    }
  },
  loadTrackData: (playlistId: string, trackId: string): TrackData => {
    try {
      return {
        segments: TrackStorage.segments.load(playlistId, trackId),
        bpm: TrackStorage.bpm.load(playlistId, trackId)
      };
    } catch (error) {
      console.error("[TrackStorage] Error loading track data:", error);
      return { segments: [] };
    }
  },
  saveTrackData: (playlistId: string, trackId: string, data: TrackData) => {
    try {
      if (data.segments) {
        TrackStorage.segments.save(playlistId, trackId, data.segments);
      }
      if (data.bpm) {
        TrackStorage.bpm.save(playlistId, trackId, data.bpm.tempo, data.bpm.isManual);
      }
    } catch (error) {
      console.error("[TrackStorage] Error saving track data:", error);
    }
  },
  clip: {
    save: (playlistId: string, trackId: string, clip: { startTime: number; endTime: number }) => {
      try {
        const key = `clip:${playlistId}:${trackId}`;
        localStorage.setItem(key, JSON.stringify(clip));
      } catch (error) {
        console.error("[TrackStorage] Error saving clip:", error);
      }
    },
    load: (playlistId: string, trackId: string) => {
      try {
        const key = `clip:${playlistId}:${trackId}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.error("[TrackStorage] Error loading clip:", error);
        return null;
      }
    },
  },
  getLocalAudioUrl: (trackId: string): string => {
    return `/audio/tracks/${trackId}.mp3`;
  },
  isLocalTrack: (trackId: string): boolean => {
    const localTrackPattern = /^local-\d+$/;
    return localTrackPattern.test(trackId);
  },
  createLocalTrackId: (number: number): string => {
    return `local-${number}`;
  },
  local: {
    getDuration: async (trackId: string): Promise<number> => {
      return new Promise((resolve) => {
        const audio = new Audio(TrackStorage.getLocalAudioUrl(trackId));
        audio.addEventListener('loadedmetadata', () => {
          resolve(audio.duration * 1000);
        });
        audio.addEventListener('error', () => {
          console.error(`[TrackStorage] Error loading duration for ${trackId}`);
          resolve(0);
        });
      });
    },
    getAll: async (): Promise<Array<{ id: string; duration_ms: number }>> => {
      try {
        const tracks = [];
        let i = 1;
        
        while (true) {
          const trackId = TrackStorage.createLocalTrackId(i);
          const duration = await TrackStorage.local.getDuration(trackId);
          
          if (duration === 0) break;
          
          tracks.push({
            id: trackId,
            duration_ms: duration,
          });
          
          i++;
        }
        
        return tracks;
      } catch (error) {
        console.error('[TrackStorage] Error getting local tracks:', error);
        return [];
      }
    },
    createTrack: async (trackId: string): Promise<Track | null> => {
      try {
        const duration = await TrackStorage.local.getDuration(trackId);
        if (duration === 0) return null;

        return {
          id: trackId,
          name: `Local Track ${trackId.split('-')[1]}`,
          duration_ms: duration,
          uri: TrackStorage.getLocalAudioUrl(trackId),
        };
      } catch (error) {
        console.error('[TrackStorage] Error creating track:', error);
        return null;
      }
    }
  },
}; 