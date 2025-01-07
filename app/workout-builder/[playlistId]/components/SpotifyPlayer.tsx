import React, { useCallback, useEffect, useRef } from 'react';

const SpotifyPlayer: React.FC = () => {
  const playerInstance = useRef<Spotify.Player | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(async () => {
    if (!playerInstance.current) return;
    
    console.log("[Player Cleanup] Starting cleanup");
    
    try {
      // First pause playback
      await playerInstance.current.pause().catch(console.error);

      // Clear intervals
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      // Remove all listeners
      playerInstance.current.removeListener('ready');
      playerInstance.current.removeListener('not_ready');
      playerInstance.current.removeListener('player_state_changed');
      playerInstance.current.removeListener('initialization_error');
      playerInstance.current.removeListener('authentication_error');
      playerInstance.current.removeListener('account_error');
      playerInstance.current.removeListener('playback_error');

      // Disconnect player
      await playerInstance.current.disconnect();
      
      // Reset all states
      onPlayerChange(null);
      onPlayerReady("");
      onPlaybackStateChange({
        isPlaying: false,
        position: 0,
        duration: 0,
        hasStarted: false,
        track_window: { current_track: { id: "" } },
      });
      
      playerInstance.current = null;
      console.log("[Player Cleanup] Cleanup completed successfully");
    } catch (error) {
      console.error("[Player Cleanup] Error during cleanup:", error);
    }
  }, [onPlayerChange, onPlayerReady, onPlaybackStateChange]);

  useEffect(() => {
    return () => {
      console.log("[Player] Component unmounting, cleaning up...");
      cleanup();
    };
  }, [cleanup]);

  return (
    // Rest of the component code
  );
};

export default SpotifyPlayer; 