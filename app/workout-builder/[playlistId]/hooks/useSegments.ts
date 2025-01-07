import { useState, useEffect } from 'react';
import { TrackStorage } from '../../../utils/storage/TrackStorage';
import { Segment } from '../types';

export const useSegments = (playlistId: string, songId: string) => {
  const [segments, setSegments] = useState<Segment[]>(() => {
    // Initialize with data immediately if we're in the browser
    if (typeof window !== "undefined") {
      const { segments = [] } = TrackStorage.loadTrackData(playlistId, songId);
      return segments;
    }
    return [];
  });

  // Save segments whenever they change
  useEffect(() => {
    if (!playlistId || !songId) return;
    TrackStorage.segments.save(playlistId, songId, segments);
  }, [segments, playlistId, songId]);

  return {
    segments,
    setSegments,
  };
}; 