// const playTrack = async (trackId: string, position: number = 0) => {
//   try {
//     const { segments: newSegments, bpm } = loadTrackData(playlistId, trackId);
//     setSegments(newSegments);
//     if (bpm) setTrackBPM(bpm);

//     const token = SpotifyAuthStorage.load();
    
//     if (isMobile) {
//       const devices = DeviceStorage.load();
//       const activeDevice = devices.find(d => d.is_active);
      
//       if (!activeDevice) {
//         setShowDeviceSelector(true);
//         throw new Error('No active device selected');
//       }

//       const response = await fetch(`https://api.spotify.com/v1/me/player/play${activeDevice ? `?device_id=${activeDevice}` : ''}`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           uris: [`spotify:track:${trackId}`],
//           position_ms: position,
//         }),
//       });

//       if (!response.ok) {
//         // If playback fails, show device selector
//         setShowDeviceSelector(true);
//         throw new Error('Failed to start playback');
//       }
//     } else {
//       // Desktop playback code remains the same
//       // ...
//     }
//   } catch (error) {
//     console.error('[playTrack] Error:', error);
//     setError('Failed to play track. Please select a device.');
//   }
// }; 