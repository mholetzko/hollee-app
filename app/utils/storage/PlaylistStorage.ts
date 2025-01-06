
export const PlaylistStorage = {
  storeTotalTracksCount: (playlistId: string, count: number): void => {
    try {
      localStorage.setItem(`playlist_${playlistId}_total_tracks`, count.toString());
    } catch (error) {
      console.error('[Playlist Storage] Failed to save total tracks:', error);
    }
  },

  getTotalTracksCount: (playlistId: string): number => {
    try {
      return parseInt(localStorage.getItem(`playlist_${playlistId}_total_tracks`) ?? "0", 10);
    } catch {
      return 0;
    }
  }
}; 