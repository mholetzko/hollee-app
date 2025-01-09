'use client';

import { useMemo, useEffect, useState } from 'react';
import { TrackStorage } from '../../../utils/storage/TrackStorage';
import { Segment, WorkoutType } from '../types';
import { WORKOUT_LABELS } from '../constants';
import { SpotifyAuthStorage } from "../../../utils/storage/SpotifyAuthStorage";
import Image from "next/image";

interface PlaylistOverviewProps {
  playlistId: string;
  tracks: Array<{ id: string; duration_ms: number }>;
}

export function PlaylistOverview({ playlistId, tracks }: PlaylistOverviewProps) {
  const [playlistData, setPlaylistData] = useState<any>(null);

  useEffect(() => {
    const fetchPlaylistData = async () => {
      try {
        const accessToken = SpotifyAuthStorage.load();
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const data = await response.json();
        setPlaylistData(data);
      } catch (error) {
        console.error("Error fetching playlist data:", error);
      }
    };

    fetchPlaylistData();
  }, [playlistId]);

  if (!playlistData) {
    return null;
  }

  return (
    <div className="p-8 border-b border-white/10">
      <div className="flex items-center gap-8">
        {playlistData.images?.[0] && (
          <Image
            src={playlistData.images[0].url}
            alt={playlistData.name}
            width={160}
            height={160}
            className="rounded-lg"
            priority
          />
        )}
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            {playlistData.name}
            <a
              href={`https://open.spotify.com/playlist/${playlistId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-base font-normal text-[#1DB954] hover:text-[#1DB954]/80 transition-colors"
            >
              <img 
                src="/spotify-logo.svg" 
                alt="Open in Spotify" 
                className="w-5 h-5"
              />
              <span>Open in Spotify</span>
            </a>
          </h1>
          <div className="text-gray-400 mb-4">
            {playlistData.tracks.total} tracks • {tracks.length} configured
          </div>
          <p className="text-gray-400 max-w-2xl">
            {playlistData.description || "No description"}
          </p>
        </div>
      </div>
    </div>
  );
} 