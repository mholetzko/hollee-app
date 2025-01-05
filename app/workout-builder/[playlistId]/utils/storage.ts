// BPM Storage utility
export const BPMStorage = {
  getKey: (playlistId: string, trackId: string) => `${playlistId}_${trackId}`,
  
  save: (playlistId: string, trackId: string, bpm: number, source: string) => {
    console.log("[BPM Storage] Saving BPM:", { playlistId, trackId, bpm, source });
    try {
      const savedBPMs = JSON.parse(localStorage.getItem("savedBPMs") ?? "{}");
      savedBPMs[BPMStorage.getKey(playlistId, trackId)] = {
        bpm,
        source
      };
      localStorage.setItem("savedBPMs", JSON.stringify(savedBPMs));
      console.log("[BPM Storage] Successfully saved BPM data");
    } catch (error) {
      console.error("[BPM Storage] Error saving BPM:", error);
    }
  },
  
  load: (playlistId: string, trackId: string) => {
    console.log("[BPM Storage] Loading BPM for track:", trackId);
    try {
      const savedBPMs = JSON.parse(localStorage.getItem("savedBPMs") ?? "{}");
      const data = savedBPMs[BPMStorage.getKey(playlistId, trackId)];
      if (data) {
        console.log("[BPM Storage] Found stored BPM:", data);
        return data;
      }
      console.log("[BPM Storage] No stored BPM found");
      return null;
    } catch (error) {
      console.error("[BPM Storage] Error loading BPM:", error);
      return null;
    }
  },

  // Add a method to load all BPMs for a playlist
  loadAll: (playlistId: string) => {
    try {
      const savedBPMs = JSON.parse(localStorage.getItem("savedBPMs") ?? "{}");
      const playlistBPMs: Record<string, { bpm: number; source: string }> = {};
      
      Object.entries(savedBPMs).forEach(([key, value]) => {
        if (key.startsWith(playlistId)) {
          const trackId = key.replace(`${playlistId}_`, '');
          playlistBPMs[trackId] = value as { bpm: number; source: string };
        }
      });
      
      return playlistBPMs;
    } catch (error) {
      console.error("[BPM Storage] Error loading all BPMs:", error);
      return {};
    }
  }
}; 