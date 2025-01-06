// Handles tracklist length persistence
export const TracklistStorage = {
  getKey: (playlistId: string) => `playlist_${playlistId}_length`,

  save: (playlistId: string, length: number) => {
    try {
      localStorage.setItem(
        TracklistStorage.getKey(playlistId),
        length.toString()
      );
      console.log("[Tracklist] Length saved:", { playlistId, length });
    } catch (error) {
      console.error("[Tracklist] Error saving length:", error);
    }
  },

  load: (playlistId: string): number | null => {
    try {
      const stored = localStorage.getItem(TracklistStorage.getKey(playlistId));
      const length = stored ? parseInt(stored, 10) : null;
      if (length === null || isNaN(length)) {
        return null;
      }
      console.log("[Tracklist] Length loaded:", { playlistId, length });
      return length;
    } catch (error) {
      console.error("[Tracklist] Error loading length:", error);
      return null;
    }
  }
}; 