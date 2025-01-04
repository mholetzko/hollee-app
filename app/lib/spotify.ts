export const transferPlayback = async (deviceId: string | null) => {
  const token = localStorage.getItem('spotify_access_token');
  
  if (!deviceId) {
    // For iOS/Safari, just play on active device
    await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    return;
  }

  // For Web Playback SDK devices or Spotify app devices
  await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      device_ids: [deviceId],
      play: false, // Don't auto-play, let the app control this
    }),
  });
}; 