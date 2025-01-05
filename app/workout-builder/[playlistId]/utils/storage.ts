// BPM Storage utility
export const BPMStorage = {
  getKey: (playlistId: string, trackId: string) => `${playlistId}_${trackId}`,
  
  save: (playlistId: string, trackId: string, bpm: number, source: string) => {
    console.log("[BPM Storage] Saving BPM:", { playlistId, trackId, bpm, source });
    try {
      const savedBPMs = JSON.parse(localStorage.getItem("savedBPMs") ?? "{}");
      savedBPMs[BPMStorage.getKey(playlistId, trackId)] = bpm;
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
      const bpm = savedBPMs[BPMStorage.getKey(playlistId, trackId)];
      if (bpm) {
        console.log("[BPM Storage] Found stored BPM:", bpm);
        return { bpm, source: "manual" };
      }
      console.log("[BPM Storage] No stored BPM found");
      return null;
    } catch (error) {
      console.error("[BPM Storage] Error loading BPM:", error);
      return null;
    }
  },
}; 