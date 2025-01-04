/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'

import { useEffect, useState , use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Footer } from '@/components/Footer'
import { Track, Segment, WorkoutType, getStorageKey } from "./types";
import { SmallWorkoutBadge } from "./components/SmallWorkoutBadge";

interface Track {
  id: string
  name: string
  duration_ms: number
  artists: { name: string }[]
  album?: { images?: { url: string }[] }
}

const hasSavedSegments = (playlistId: string, songId: string): boolean => {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(getStorageKey(playlistId, songId, 'segments'));
  return stored ? JSON.parse(stored).length > 0 : false;
};

const getAllWorkoutConfigs = (playlistId: string, tracks: Track[]) => {
  if (typeof window === 'undefined') return {};
  
  const configs: Record<string, {
    track: {
      id: string
      name: string
      artists: string[]
      duration_ms: number
    }
    bpm: {
      tempo: number
      isManual: boolean
    } | null
    segments: any[]
  }> = {};

  // First add all tracks
  tracks.forEach(track => {
    const key = `${playlistId}_${track.id}`;
    configs[key] = {
      track: {
        id: track.id,
        name: track.name,
        artists: track.artists.map(a => a.name),
        duration_ms: track.duration_ms
      },
      bpm: null,
      segments: []
    };
  });

  // Then add saved segments
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`playlist_${playlistId}_segments_`)) {
      const songId = key.replace(`playlist_${playlistId}_segments_`, '');
      const segments = JSON.parse(localStorage.getItem(key) || '[]');
      const configKey = `${playlistId}_${songId}`;
      if (configs[configKey]) {
        configs[configKey].segments = segments;
      }
    }
  }

  // Add saved BPMs
  const savedBPMs = JSON.parse(localStorage.getItem('savedBPMs') || '{}');
  Object.entries(savedBPMs).forEach(([key, bpm]) => {
    if (key.startsWith(`${playlistId}_`)) {
      const songId = key.replace(`${playlistId}_`, '');
      const configKey = `${playlistId}_${songId}`;
      if (configs[configKey]) {
        configs[configKey].bpm = {
          tempo: Number(bpm),
          isManual: true
        };
      }
    }
  });

  return configs;
};

export default function WorkoutBuilder({ params }: { params: Promise<{ playlistId: string }> }) {
  const resolvedParams = use(params)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [importMessage, setImportMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const importConfigs = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.tracks || typeof data.tracks !== 'object') {
        throw new Error('Invalid configuration file format');
      }

      Object.entries(data.tracks).forEach(([key, config]: [string, any]) => {
        const songId = key.includes('_') ? key.split('_')[1] : key;
        
        if (config.segments && Array.isArray(config.segments)) {
          localStorage.setItem(
            getStorageKey(resolvedParams.playlistId, songId, 'segments'),
            JSON.stringify(config.segments)
          );
        }
        
        if (config.bpm && typeof config.bpm.tempo === 'number') {
          const savedBPMs = JSON.parse(localStorage.getItem('savedBPMs') || '{}');
          savedBPMs[`${resolvedParams.playlistId}_${songId}`] = config.bpm.tempo;
          localStorage.setItem('savedBPMs', JSON.stringify(savedBPMs));
        }
      });

      return {
        success: true,
        message: 'Configurations imported successfully'
      };
    } catch (error) {
      console.error('Import error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import configurations'
      };
    }
  };

  useEffect(() => {
    const fetchPlaylistTracks = async () => {
      try {
        const accessToken = localStorage.getItem('spotify_access_token')
        if (!accessToken) {
          router.push('/')
          return
        }

        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${resolvedParams.playlistId}/tracks`,
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

        // Store total tracks count in localStorage
        const storageKey = `playlist_${resolvedParams.playlistId}_total_tracks`;
        console.log('Storing total tracks:', {
          key: storageKey,
          count: trackList.length
        });
        
        localStorage.setItem(storageKey, trackList.length.toString());

      } catch (error) {
        console.error('Error fetching tracks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylistTracks()
  }, [resolvedParams.playlistId, router])

  const handleExport = () => {
    const configs = getAllWorkoutConfigs(resolvedParams.playlistId, tracks);
    const fileName = 'workout-configs.json';
    const json = JSON.stringify({
      exportDate: new Date().toISOString(),
      playlistId: resolvedParams.playlistId,
      tracks: configs
    }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const result = await importConfigs(file)
    
    setImportMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    })

    // Clear message after 3 seconds
    setTimeout(() => setImportMessage(null), 3000)

    // Refresh the page to show updated configurations
    if (result.success) {
      window.location.reload()
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="flex-1">
        <div className="flex-none bg-black/20 p-4">
          <div className="container mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="hover:bg-white/10"
            >
              <ArrowBackIcon className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="container mx-auto py-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">HOLLEES Indoor Cycling Workout Builder</h1>
              {tracks.some(track => hasSavedSegments(resolvedParams.playlistId, track.id)) && (
                <Button
                  variant="default"
                  size="lg"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => router.push(`/workout-builder/${resolvedParams.playlistId}/play`)}
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
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-config"
                />
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => document.getElementById('import-config')?.click()}
                >
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L12 4m4 4v12" 
                    />
                  </svg>
                  Import Configs
                </Button>
              </div>

              <Button
                onClick={handleExport}
                className="flex items-center gap-2"
                variant="outline"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                  />
                </svg>
                Export Configs
              </Button>
            </div>
          </div>

          {importMessage && (
            <div className={`mb-4 p-4 rounded-lg ${
              importMessage.type === 'success' 
                ? 'bg-green-500/20 text-green-300' 
                : 'bg-red-500/20 text-red-300'
            }`}>
              {importMessage.text}
            </div>
          )}

          <div className="grid gap-4">
            {tracks.map((track, index) => {
              // Create a unique key combining track ID and position
              const uniqueTrackKey = `${track.id}-position-${index}`;
              
              // Get saved segments and BPM for this track
              const trackSegments = JSON.parse(
                localStorage.getItem(getStorageKey(resolvedParams.playlistId, track.id, 'segments')) || '[]'
              );
              
              const trackBPMData = JSON.parse(localStorage.getItem('savedBPMs') || '{}')[
                `${resolvedParams.playlistId}_${track.id}`
              ];

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
                        <img
                          src={track.album.images[0].url}
                          alt={track.name}
                          className="w-12 h-12 rounded"
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
                      <div className="flex items-center gap-2">
                        {/* Workout type badges first */}
                        {trackWorkoutTypes.length > 0 && (
                          <div className="flex gap-1">
                            {trackWorkoutTypes.map((type: WorkoutType) => (
                              <SmallWorkoutBadge key={type} type={type} />
                            ))}
                          </div>
                        )}

                        {/* Show BPM after workout types */}
                        {trackBPMData && (
                          <div className="px-3 py-1.5 bg-white/5 rounded-md">
                            <span className="font-mono text-sm text-gray-300">
                              {Math.round(trackBPMData)} BPM
                            </span>
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
                          router.push(`/workout-builder/${resolvedParams.playlistId}/song/${track.id}`);
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