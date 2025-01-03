'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { use } from 'react'
import { PlayIcon, PauseIcon, StopIcon, ArrowLeftIcon } from '@radix-ui/react-icons'
import { Track, PlaybackState, TrackBPM, Segment } from '../types'
import { SegmentTimeline } from '../song/[songId]/components/SegmentTimeline'
import { WorkoutDisplay } from '../components/WorkoutDisplay'
import { BPMVisualization } from '../components/BPMVisualization'
import { LoadingState } from '../components/LoadingState'

export default function WorkoutPlayer({ params }: { params: any }) {
  const resolvedParams = use(params)
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  // Playback state
  const [player, setPlayer] = useState<any>(null)
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    position: 0,
    duration: 0,
  })
  const [deviceId, setDeviceId] = useState<string>('')
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const progressInterval = useRef<NodeJS.Timeout>()
  const timelineRef = useRef<HTMLDivElement>(null)

  // Track BPM state
  const [trackBPM, setTrackBPM] = useState<TrackBPM>({ 
    tempo: 128,
    isManual: true 
  })

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true

    document.body.appendChild(script)

    window.onSpotifyWebPlaybackSDKReady = () => {
      const accessToken = localStorage.getItem('spotify_access_token')
      if (!accessToken) return

      const player = new window.Spotify.Player({
        name: 'Workout Player',
        getOAuthToken: (cb: (token: string) => void) => cb(accessToken),
      })

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        setDeviceId(device_id)
        setIsPlayerReady(true)
      })

      player.addListener('player_state_changed', (state: any) => {
        if (!state) return

        setPlaybackState({
          isPlaying: !state.paused,
          position: state.position,
          duration: state.duration,
        })

        // Start progress tracking when playing
        if (!state.paused) {
          if (progressInterval.current) {
            clearInterval(progressInterval.current)
          }
          const startTime = Date.now() - state.position
          progressInterval.current = setInterval(() => {
            const position = Date.now() - startTime
            setPlaybackState(prev => ({
              ...prev,
              position: position,
            }))
          }, 50)
        }
      })

      player.connect()
      setPlayer(player)
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
      if (player) {
        player.disconnect()
      }
    }
  }, [])

  // Load playlist tracks
  useEffect(() => {
    const loadTracks = async () => {
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

        if (!response.ok) throw new Error('Failed to fetch tracks')

        const data = await response.json()
        const configuredTracks = data.items
          .map((item: any) => item.track)
          .filter((track: Track) => {
            const segments = JSON.parse(
              localStorage.getItem(`segments_${track.id}`) || '[]'
            )
            return segments.length > 0
          })

        setTracks(configuredTracks)
        
        // Load initial track's segments and BPM
        if (configuredTracks.length > 0) {
          const initialTrack = configuredTracks[0]
          const storedSegments = JSON.parse(
            localStorage.getItem(`segments_${initialTrack.id}`) || '[]'
          )
          setSegments(storedSegments)

          const savedBPMs = JSON.parse(localStorage.getItem('savedBPMs') || '{}')
          if (savedBPMs[initialTrack.id]) {
            setTrackBPM({
              tempo: savedBPMs[initialTrack.id],
              isManual: true
            })
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading tracks:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      }
    }

    loadTracks()
  }, [resolvedParams.playlistId, router])

  // Handle track changes
  useEffect(() => {
    if (tracks[currentTrackIndex]) {
      const track = tracks[currentTrackIndex]
      const storedSegments = JSON.parse(
        localStorage.getItem(`segments_${track.id}`) || '[]'
      )
      setSegments(storedSegments)

      const savedBPMs = JSON.parse(localStorage.getItem('savedBPMs') || '{}')
      if (savedBPMs[track.id]) {
        setTrackBPM({
          tempo: savedBPMs[track.id],
          isManual: true
        })
      }
    }
  }, [currentTrackIndex, tracks])

  const togglePlayback = async () => {
    if (!player || !tracks[currentTrackIndex] || !deviceId || !isPlayerReady) return

    const accessToken = localStorage.getItem('spotify_access_token')
    if (!accessToken) return

    try {
      if (!playbackState.isPlaying) {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [`spotify:track:${tracks[currentTrackIndex].id}`],
            position_ms: playbackState.position,
          }),
        })
        
        await new Promise(resolve => setTimeout(resolve, 100))
        await player.resume()
        
        setPlaybackState(prev => ({
          ...prev,
          isPlaying: true
        }))
      } else {
        await player.pause()
        
        setPlaybackState(prev => ({
          ...prev,
          isPlaying: false
        }))
        
        if (progressInterval.current) {
          clearInterval(progressInterval.current)
        }
      }
    } catch (error) {
      console.error('Playback error:', error)
    }
  }

  const currentTrack = tracks[currentTrackIndex]

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Workout</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (loading || !currentTrack) {
    return <LoadingState />
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none bg-black/20 backdrop-blur-sm p-8 border-b border-white/10">
        <div className="container mx-auto">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 hover:bg-white/10"
            onClick={() => router.push(`/workout-builder/${resolvedParams.playlistId}`)}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Playlist
          </Button>

          <div className="flex items-center gap-6">
            {currentTrack.album?.images?.[0] && (
              <img
                src={currentTrack.album.images[0].url}
                alt={currentTrack.name}
                className="w-32 h-32 rounded"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{currentTrack.name}</h1>
              <p className="text-gray-400">
                {currentTrack.artists.map(a => a.name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-8">
          {/* Workout display */}
          <div className="mb-8">
            <WorkoutDisplay 
              segments={segments}
              position={playbackState.position}
            />
          </div>

          {/* Timeline */}
          <div className="mb-4">
            <SegmentTimeline
              ref={timelineRef}
              segments={segments}
              duration={currentTrack.duration_ms}
              position={playbackState.position}
              isPlaying={playbackState.isPlaying}
              onSeek={(position) => {
                if (player) {
                  player.seek(position)
                }
                setPlaybackState(prev => ({ ...prev, position }))
              }}
            />
          </div>

          {/* BPM visualization */}
          <BPMVisualization
            bpm={trackBPM.tempo}
            duration={currentTrack.duration_ms}
            currentPosition={playbackState.position}
            isPlaying={playbackState.isPlaying}
          />

          {/* Playback controls */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              size="lg"
              variant="outline"
              onClick={togglePlayback}
              className="w-16 h-16 rounded-full"
            >
              {playbackState.isPlaying ? (
                <PauseIcon className="w-8 h-8" />
              ) : (
                <PlayIcon className="w-8 h-8" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 