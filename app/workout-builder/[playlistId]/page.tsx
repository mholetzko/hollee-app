/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Footer } from '@/components/Footer'
import { Segment } from "./types";
import { SmallWorkoutBadge } from "./components/SmallWorkoutBadge";
import { TrackStorage } from '../../utils/storage/TrackStorage'
import { TracklistStorage } from '../../utils/storage/TracklistStorage'
import { WorkoutConfigStorage } from '../../utils/storage/WorkoutConfigStorage'
import { PlaylistStorage } from '../../utils/storage/PlaylistStorage'
import { SpotifyAuthStorage } from '../../utils/storage/SpotifyAuthStorage'
import Image from 'next/image'
import { PlaylistOverview } from './components/PlaylistOverview';
import { Toaster, toast } from 'react-hot-toast'
import { ExportImportButtons } from './components/ExportImportButtons';
import { ExampleWorkoutStorage } from '@/app/utils/storage/ExampleWorkoutStorage';

interface Track {
  id: string
  name: string
  duration_ms: number
  artists: { name: string }[]
  album?: { images?: { url: string }[] }
}

const hasSavedSegments = (playlistId: string, songId: string): boolean => {
  return TrackStorage.segments.hasData(playlistId, songId);
};

export default function WorkoutBuilder({ params }: { params: { playlistId: string } }) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [importMessage, setImportMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    const fetchPlaylistTracks = async () => {
      try {
        const accessToken = SpotifyAuthStorage.load();
        if (!accessToken) {
          router.push('/')
          return
        }

        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${params.playlistId}/tracks`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch tracks')
        }

        const data = await response.json()
        const trackList = data.items
          .map((item: any) => item.track)
          .filter((track: any) => track !== null);
        
        setTracks(trackList)

        // Store the total tracks count
        PlaylistStorage.storeTotalTracksCount(params.playlistId, trackList.length);

      } catch (error) {
        console.error('Error fetching tracks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylistTracks()
  }, [params.playlistId, router])

  const handleExport = () => {
    const config = WorkoutConfigStorage.exportConfig(params.playlistId, tracks);
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `workout-configs-${params.playlistId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    try {
      const result = await WorkoutConfigStorage.importConfig(params.playlistId, file);
      
      if (result.success) {
        toast.success(result.message);
        // Refresh the page after successful import
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error importing config:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import configuration');
    }
  };

  useEffect(() => {
    if (tracks.length > 0) {
      TracklistStorage.save(params.playlistId, tracks.length);
    }
  }, [tracks.length, params.playlistId]);

  useEffect(() => {
    if (tracks.length > 0) {
      ExampleWorkoutStorage.initializeIfExample(params.playlistId);
    }
  }, [tracks.length, params.playlistId]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: '#fff',
              secondary: 'rgba(0, 0, 0, 0.8)',
            },
          },
          error: {
            duration: 3000,
            iconTheme: {
              primary: '#ff4b4b',
              secondary: 'rgba(0, 0, 0, 0.8)',
            },
          },
        }}
      />
      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between px-8 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="hover:bg-white/10"
          >
            <ArrowBackIcon className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-4">
            {tracks.some(track => hasSavedSegments(params.playlistId, track.id)) && (
              <Button
                variant="default"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white"
                onClick={() => router.push(`/workout-builder/${params.playlistId}/play`)}
              >
                <svg 
                  className="w-5 h-5 mr-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                Start Workout
              </Button>
            )}
            <ExportImportButtons
              onExport={handleExport}
              onImport={handleImport}
            />
          </div>
        </div>
      </div>

      <div className="flex-1">
        <PlaylistOverview playlistId={params.playlistId} tracks={tracks} />

        <div className="px-8">
          <div className="grid gap-4">
            {tracks.map((track, index) => {
              const uniqueTrackKey = `${track.id}-position-${index}`;
              
              // Get saved segments and BPM for this track using TrackStorage
              const trackData = TrackStorage.loadTrackData(params.playlistId, track.id);
              console.log(`[Track ${track.id}] Loaded data:`, trackData);
              const trackBPMData = trackData.bpm?.tempo;
              const trackSegments = trackData.segments;

              // Get unique workout types
              const trackWorkoutTypes = Array.from(
                new Set(trackSegments.map((s: Segment) => s.type))
              );

              const hasConfiguration = trackWorkoutTypes.length > 0 || trackBPMData;

              return (
                <div
                  key={uniqueTrackKey}
                  className={`group flex flex-col p-4 rounded-lg transition-colors
                    ${hasConfiguration ? 'bg-white/5' : 'bg-black/20'}
                    hover:bg-white/10`}
                >
                  {/* Track basic info */}
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {track.album?.images?.[0] && (
                        <Image
                          src={track.album.images[0].url}
                          alt={track.name}
                          width={48}
                          height={48}
                          className="rounded"
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{track.name}</div>
                      <div className="text-sm text-gray-400 truncate">
                        {track.artists.map((a) => a.name).join(", ")}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Combined workout types and BPM */}
                      <div className="flex gap-2">
                        {trackWorkoutTypes.map((type) => (
                          <SmallWorkoutBadge key={type} type={type} />
                        ))}
                        {trackBPMData && (
                          <div className="px-2 py-1 bg-white/10 rounded text-sm">
                            {Math.round(trackBPMData)} BPM
                          </div>
                        )}
                      </div>

                      <div className="text-sm text-gray-400">
                        {Math.floor(track.duration_ms / 60000)}:
                        {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, "0")}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          router.push(`/workout-builder/${params.playlistId}/song/${track.id}`);
                        }}
                      >
                        {hasConfiguration ? "Edit" : "Configure"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
} 