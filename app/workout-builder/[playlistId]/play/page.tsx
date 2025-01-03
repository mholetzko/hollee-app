"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FastForwardIcon from '@mui/icons-material/FastForward';
import { Track, PlaybackState, TrackBPM, Segment } from "../types";
import { WorkoutDisplay } from "../components/WorkoutDisplay";
import { LoadingState } from "../components/LoadingState";
import { BeatCountdown } from "../components/BeatCountdown";
import { WorkoutProgress } from "../components/WorkoutProgress";
import { getStorageKey } from "../types";
import { SegmentList } from "../components/SegmentList";
import { SegmentTimeline } from "../components/SegmentTimeline";

// Utility functions
const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

// Add types if not already defined in types.ts
declare global {
  interface Window {
    Spotify: {
      Player: any;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

const getCurrentAndNextSegment = (position: number, segments: Segment[]) => {
  const sortedSegments = [...segments].sort(
    (a, b) => a.startTime - b.startTime
  );
  const currentSegmentIndex = sortedSegments.findIndex(
    (segment) => position >= segment.startTime && position < segment.endTime
  );
  const currentSegment =
    currentSegmentIndex !== -1
      ? sortedSegments[currentSegmentIndex]
      : undefined;
  const nextSegment =
    currentSegmentIndex !== -1
      ? sortedSegments[currentSegmentIndex + 1]
      : undefined;

  return { currentSegment, nextSegment };
};

type Params = { playlistId: string };

// Add these constants at the top of the file
const SEGMENT_COLORS = {
  PLS: 'bg-purple-500/50',
  SEATED_ROAD: 'bg-blue-500/50',
  SEATED_CLIMB: 'bg-green-500/50',
  STANDING_CLIMB: 'bg-yellow-500/50',
  STANDING_JOGGING: 'bg-orange-500/50',
  JUMPS: 'bg-red-500/50',
  WAVES: 'bg-pink-500/50',
  PUSHES: 'bg-indigo-500/50',
} as const;

const WORKOUT_LABELS: Record<WorkoutType, string> = {
  PLS: 'PLS',
  SEATED_ROAD: 'SeRo',
  SEATED_CLIMB: 'SeCl',
  STANDING_CLIMB: 'StCl',
  STANDING_JOGGING: 'StJo',
  JUMPS: 'Jump',
  WAVES: 'Wave',
  PUSHES: 'Push',
} as const;

// Add the intensity color helper
const getIntensityColor = (intensity: number) => {
  if (intensity === -1) return 'bg-red-500/50'; // BURN mode
  if (intensity > 90) return 'bg-red-500/50';    // 90-100%
  if (intensity > 75) return 'bg-yellow-500/50';  // 75-90%
  if (intensity > 55) return 'bg-green-500/50';   // 55-75%
  if (intensity > 25) return 'bg-blue-500/50';    // 25-55%
  return 'bg-white/50';                           // 0-25%
};

export default function WorkoutPlayer({ params }: { params: Params }) {
  const resolvedParams = React.use(params as unknown as any);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Playback state
  const [player, setPlayer] = useState<any>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    position: 0,
    duration: 0,
    track_window: {
      current_track: {
        id: "",
      },
    },
  });
  const [deviceId, setDeviceId] = useState<string>("");
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Track BPM state
  const [trackBPM, setTrackBPM] = useState<TrackBPM>({
    tempo: 128,
    isManual: true,
  });

  // Replace let isPlayingNextTrack = false with a ref
  const isPlayingNextTrack = useRef(false);

  // Add refs to access latest values in effects
  const tracksRef = useRef<Track[]>(tracks);
  const currentTrackIndexRef = useRef<number>(currentTrackIndex);

  // Update refs when values change
  useEffect(() => {
    tracksRef.current = tracks;
    console.log('[Tracks Ref] Updated:', {
      tracksLength: tracks.length,
      refLength: tracksRef.current.length
    });
  }, [tracks]);

  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex;
    console.log('[Track Index Ref] Updated:', {
      currentIndex: currentTrackIndex,
      refIndex: currentTrackIndexRef.current
    });
  }, [currentTrackIndex]);

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const accessToken = localStorage.getItem("spotify_access_token");
      if (!accessToken) return;

      const player = new window.Spotify.Player({
        name: "Workout Player",
        getOAuthToken: (cb: (token: string) => void) => cb(accessToken),
      });

      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("Player ready with device ID:", device_id);
        setDeviceId(device_id);
        setIsPlayerReady(true);
      });

      let isHandlingStateChange = false;

      const handleStateChange = async (state: any) => {
        if (!state || isHandlingStateChange) return;
        isHandlingStateChange = true;

        try {
          // Get latest values from refs
          const currentIndex = currentTrackIndexRef.current;
          const currentTracks = tracksRef.current;

          // Add check for tracks
          if (!currentTracks || currentTracks.length === 0) {
            console.log('[Player State] No tracks available');
            return;
          }

          console.log('[Player State] Changed:', {
            paused: state.paused,
            position: state.position,
            duration: state.duration,
            track: state.track_window?.current_track?.id,
            currentTrackIndex: currentIndex,
            totalTracks: currentTracks.length,
            tracksAvailable: !!currentTracks
          });

          // Update playback state first
          setPlaybackState({
            isPlaying: !state.paused,
            position: state.position,
            duration: state.duration,
            track_window: {
              current_track: {
                id: state.track_window?.current_track?.id,
              },
            },
          });

          // Handle progress tracking
          if (!state.paused) {
            if (progressInterval.current) {
              clearInterval(progressInterval.current);
            }
            const startTime = Date.now() - state.position;
            progressInterval.current = setInterval(() => {
              const position = Date.now() - startTime;
              setPlaybackState((prev) => ({
                ...prev,
                position: position,
              }));
            }, 50);
          } else {
            if (progressInterval.current) {
              clearInterval(progressInterval.current);
            }
          }

          // Handle track end and next track
          const isNearEnd = state.duration && (state.position >= state.duration - 1000);
          const isTrackEnd = state.paused && (state.position === 0 || isNearEnd);
          const canPlayNext = currentIndex < currentTracks.length - 1;
          const shouldPlayNext = isTrackEnd && !isPlayingNextTrack.current && canPlayNext;

          console.log('[Player State] Track end check:', {
            isNearEnd,
            isTrackEnd,
            canPlayNext,
            shouldPlayNext,
            position: state.position,
            duration: state.duration,
            currentIndex,
            totalTracks: currentTracks.length,
            isPlayingNext: isPlayingNextTrack.current
          });

          if (shouldPlayNext) {
            console.log('[Player State] Triggering next track');
            isPlayingNextTrack.current = true;
            
            // Small delay to ensure clean transition
            setTimeout(async () => {
              try {
                await playNextTrack();
              } catch (error) {
                console.error('[Auto Next] Error playing next track:', error);
                isPlayingNextTrack.current = false;
              }
            }, 500);
          }

        } catch (error) {
          console.error('[Player State] Error handling state change:', error);
        } finally {
          setTimeout(() => {
            isHandlingStateChange = false;
          }, 200);
        }
      };

      player.addListener(
        "player_state_changed",
        debounce(handleStateChange, 200)
      );

      player.connect();
      setPlayer(player);
    };

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (player) {
        player.disconnect();
      }
    };
  }, []);

  // Add a separate effect to handle initial track play when player becomes ready
  useEffect(() => {
    if (isPlayerReady && tracks.length > 0 && !playbackState.isPlaying) {
      console.log("Player ready and tracks loaded, playing initial track");
      playTrack(tracks[currentTrackIndex].id);
    }
  }, [isPlayerReady, tracks]);

  // Load playlist tracks
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const accessToken = localStorage.getItem("spotify_access_token");
        if (!accessToken) {
          router.push("/");
          return;
        }
        
        console.log('[Fetch Tracks] Starting fetch');
        
        const playlistId = resolvedParams.playlistId;
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch tracks");
        const data = await response.json();

        // Filter tracks with configured segments
        const configuredTracks = data.items
          .map((item: any) => item.track)
          .filter((track: Track) => {
            const segments = JSON.parse(
              localStorage.getItem(
                getStorageKey(playlistId, track.id, 'segments')
              ) ?? "[]"
            );
            return segments.length > 0;
          });

        console.log('[Fetch Tracks] Configured tracks:', {
          total: configuredTracks.length,
          tracks: configuredTracks.map(t => t.id)
        });

        // Update ref first, then state
        tracksRef.current = configuredTracks;
        setTracks(configuredTracks);

        // Log the current state of refs
        console.log('[Fetch Tracks] Updated refs:', {
          tracksRefLength: tracksRef.current.length,
          currentTrackIndexRef: currentTrackIndexRef.current
        });

        // Load initial track's data
        if (configuredTracks.length > 0) {
          const initialTrack = configuredTracks[0];
          const { segments, bpm } = loadTrackData(playlistId, initialTrack.id);
          setSegments(segments);
          if (bpm) {
            setTrackBPM(bpm);
          }
        }

      } catch (error) {
        console.error('[Fetch Tracks] Error:', error);
        setError('Failed to load tracks');
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [resolvedParams.playlistId]);

  // Handle track changes
  useEffect(() => {
    if (tracks[currentTrackIndex]) {
      const track = tracks[currentTrackIndex];
      playTrack(track.id);

      // Load track data using the new format
      const { segments, bpm } = loadTrackData(resolvedParams.playlistId, track.id);
      setSegments(segments);
      if (bpm) {
        setTrackBPM(bpm);
      }
    }
  }, [currentTrackIndex, tracks]);

  const playTrack = async (trackId: string) => {
    if (!player || !deviceId || !isPlayerReady) {
      console.log("Player not ready:", { player, deviceId, isPlayerReady });
      return;
    }

    const accessToken = localStorage.getItem("spotify_access_token");
    if (!accessToken) return;

    try {
      console.log("Attempting to play track:", trackId);
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [`spotify:track:${trackId}`],
            position_ms: 0,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to play track:", errorData);
        return;
      }

      // Load track-specific data
      const storedSegments = JSON.parse(
        localStorage.getItem(getStorageKey(resolvedParams.playlistId, trackId, 'segments')) ?? "[]"
      );
      setSegments(storedSegments);

      const savedBPMs = JSON.parse(localStorage.getItem('savedBPMs') ?? "{}");
      if (savedBPMs[`${resolvedParams.playlistId}_${trackId}`]) {
        setTrackBPM({
          tempo: savedBPMs[`${resolvedParams.playlistId}_${trackId}`],
          isManual: true,
        });
      }
    } catch (error) {
      console.error("Error playing track:", error);
    }
  };

  const playNextTrack = async () => {
    console.log('[Next Track] Starting with:', {
      currentIndex: currentTrackIndexRef.current,
      isPlayingNext: isPlayingNextTrack.current,
      totalTracks: tracksRef.current.length,
      tracks: tracksRef.current.map(t => t.id)
    });

    try {
      // Check if we can move to next track
      if (currentTrackIndexRef.current >= tracksRef.current.length - 1) {
        console.log('[Next Track] Already at last track');
        return;
      }

      const nextIndex = currentTrackIndexRef.current + 1;
      const nextTrack = tracksRef.current[nextIndex];
      
      console.log('[Next Track] Playing track:', {
        fromIndex: currentTrackIndexRef.current,
        toIndex: nextIndex,
        nextTrackId: nextTrack?.id
      });

      // Update index
      setCurrentTrackIndex(nextIndex);
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Play the track
      await playTrack(nextTrack.id);

    } catch (error) {
      console.error('[Next Track] Error:', error);
      throw error;
    } finally {
      setTimeout(() => {
        isPlayingNextTrack.current = false;
        console.log('[Next Track] Reset playing next flag');
      }, 1000);
    }
  };

  // Debounce function to limit the rate of function calls
  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  // Use debounce for playNextTrack
  const debouncedPlayNextTrack = debounce(playNextTrack, 1000);

  const playPreviousTrack = async () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex((prev) => prev - 1);
      const prevTrack = tracks[currentTrackIndex - 1];
      playTrack(prevTrack.id);
    }
  };

  const togglePlayback = async () => {
    if (!player || !tracks[currentTrackIndex] || !deviceId || !isPlayerReady)
      return;

    try {
      if (!playbackState.isPlaying) {
        await playTrack(tracks[currentTrackIndex].id);
      } else {
        await player.pause();
        setPlaybackState((prev) => ({
          ...prev,
          isPlaying: false,
        }));
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      }
    } catch (error) {
      console.error("Playback error:", error);
    }
  };

  const currentTrack = tracks[currentTrackIndex];

  const jumpToNextSegment = async () => {
    console.log('[Jump] Starting jump to next segment');
    
    const { nextSegment } = getCurrentAndNextSegment(
      playbackState.position,
      segments
    );

    if (!nextSegment) {
      console.log('[Jump] No next segment found');
      return;
    }

    if (!player || !deviceId || !isPlayerReady) {
      console.log('[Jump] Player not ready');
      return;
    }

    const accessToken = localStorage.getItem("spotify_access_token");
    if (!accessToken) {
      console.log('[Jump] No access token');
      return;
    }

    try {
      // Round the position to the nearest integer
      const seekPosition = Math.round(nextSegment.startTime);
      console.log('[Jump] Seeking to position:', seekPosition);
      
      await fetch(
        `https://api.spotify.com/v1/me/player/seek?device_id=${deviceId}&position_ms=${seekPosition}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update local playback state immediately with the rounded value
      setPlaybackState(prev => ({
        ...prev,
        position: seekPosition
      }));

      console.log('[Jump] Successfully jumped to next segment');
    } catch (error) {
      console.error('[Jump] Error jumping to next segment:', error);
      if (error instanceof Response) {
        const errorData = await error.json();
        console.error('[Jump] API Error details:', errorData);
      }
    }
  };

  const loadTrackData = (playlistId: string, trackId: string) => {
    if (typeof window === 'undefined') return { segments: [], bpm: null };

    // Load segments using new format
    const segmentsStored = localStorage.getItem(
      getStorageKey(playlistId, trackId, 'segments')
    );
    const segments = segmentsStored ? JSON.parse(segmentsStored) : [];

    // Load BPM using new format
    const savedBPMs = JSON.parse(localStorage.getItem('savedBPMs') || '{}');
    const bpm = savedBPMs[`${playlistId}_${trackId}`] || null;

    return {
      segments,
      bpm: bpm ? { tempo: bpm, isManual: true } : null
    };
  };

  useEffect(() => {
    if (!currentTrack) return;
    
    const { segments, bpm } = loadTrackData(resolvedParams.playlistId, currentTrack.id);
    setSegments(segments);
    if (bpm) {
      setTrackBPM(bpm);
    }
  }, [currentTrack, resolvedParams.playlistId]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Workout</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !currentTrack) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col h-full">
    {/* Header */}
    <div className="flex-none bg-black/20 backdrop-blur-sm p-8 border-b border-white/10">
      <div className="container mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 hover:bg-white/10"
          onClick={() => {
            if (
              typeof resolvedParams === "object" &&
              resolvedParams !== null &&
              "playlistId" in resolvedParams
            ) {
              router.push(`/workout-builder/${resolvedParams.playlistId}`);
            } else {
              router.push("/workout-builder/");
            }
          }}
        >
          <ArrowBackIcon className="w-4 h-4 mr-2" />
          Back to Playlist
        </Button>
      </div>
    </div>

    {/* Header */}
    <div className="flex-none bg-black/20 backdrop-blur-sm p-8 border-b border-white/10">
      <div className="container mx-auto">
        <div className="flex items-center gap-8">
          {/* Album art and track info */}
          <div className="flex items-center gap-6 flex-1">
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
                {currentTrack.artists.map((a) => a.name).join(", ")}
              </p>
            </div>
          </div>

          {/* BPM Display */}
          <div className="flex flex-col items-center justify-center px-8 py-4 bg-white/5 rounded-lg">
            <div className="text-5xl font-mono font-bold text-white/90 mb-1">
              {Math.round(trackBPM.tempo)}
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">
              BPM
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Fixed workout display with beat counter */}
    {playbackState.isPlaying && (
      <div className="flex-none bg-black/10 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto py-4">
          <div className="flex gap-4 items-stretch">
            {(() => {
              const { currentSegment, nextSegment } =
                getCurrentAndNextSegment(playbackState.position, segments);

              return (
                <>
                  <WorkoutDisplay segment={currentSegment} />
                  <BeatCountdown
                    currentPosition={playbackState.position}
                    nextSegmentStart={
                      nextSegment?.startTime ?? currentTrack.duration_ms
                    }
                    bpm={trackBPM.tempo}
                    nextSegment={nextSegment}
                  />
                  <WorkoutDisplay segment={nextSegment} isNext />
                </>
              );
            })()}
          </div>
        </div>
      </div>
    )}

    {/* Main content */}
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-8">
        {/* Track progress and segments timeline */}
        <div className="flex-none bg-black/20 p-4 mt-8">
          <div className="w-full">
            <SegmentTimeline
              segments={segments}
              duration={currentTrack.duration_ms}
              position={playbackState.position}
              isPlaying={playbackState.isPlaying}
              showBeats={true}
              bpm={trackBPM.tempo}
            />
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            size="lg"
            variant="outline"
            onClick={playPreviousTrack}
            disabled={currentTrackIndex === 0}
            className="w-12 h-12 rounded-full flex items-center justify-center"
          >
            <SkipPreviousIcon className="w-6 h-6" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={togglePlayback}
            className="w-16 h-16 rounded-full flex items-center justify-center"
          >
            {playbackState.isPlaying ? (
              <PauseIcon className="w-8 h-8" />
            ) : (
              <PlayArrowIcon className="w-8 h-8" />
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={debouncedPlayNextTrack}
            disabled={currentTrackIndex === tracks.length - 1}
            className="w-12 h-12 rounded-full flex items-center justify-center"
          >
            <SkipNextIcon className="w-6 h-6" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={jumpToNextSegment}
            className="w-12 h-12 rounded-full flex items-center justify-center"
          >
            <FastForwardIcon className="w-6 h-6" />
          </Button>
        </div>

        {/* Track list */}
        <div className="mt-8">
          <div className="bg-black/20 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Up Next</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {tracks.map((track, index) => (
                <div
                  key={`${track.id}-${index}`}
                  className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors
                    ${index === currentTrackIndex ? "bg-white/10" : ""}`}
                  onClick={() => {
                    setCurrentTrackIndex(index);
                    playTrack(track.id);
                  }}
                >
                  <div className="w-8 text-gray-400">{index + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{track.name}</div>
                    <div className="text-sm text-gray-400 truncate">
                      {track.artists.map((a) => a.name).join(", ")}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 ml-4">
                    {Math.floor(track.duration_ms / 60000)}:
                    {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, "0")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
