"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Play as PlayIcon,
  Pause as PauseIcon,
  SkipBack as SkipBackIcon,
  SkipForward as SkipForwardIcon,
  ArrowLeft as ArrowLeftIcon,
} from "lucide-react";
import { Track, PlaybackState, TrackBPM, Segment } from "../types";
import { WorkoutDisplay } from "../components/WorkoutDisplay";
import { LoadingState } from "../components/LoadingState";
import { BeatCountdown } from "../components/BeatCountdown";
import { WorkoutProgress } from "../components/WorkoutProgress";

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
  const tracksRef = useRef<Track[]>([]);
  const currentTrackIndexRef = useRef<number>(0);

  // Update refs when values change
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex;
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

        console.log("Player state changed:", state);
        console.log("Player paused:", state.paused);
        console.log("Current position:", state.position);

        // Update playback state first
        setPlaybackState({
          isPlaying: !state.paused,
          position: state.position,
          duration: state.duration,
          track_window: {
            current_track: {
              id: state.track_window.current_track.id,
            },
          },
        });

        // Handle track end and next track
        if (
          state.paused &&
          state.position === 0 &&
          !isPlayingNextTrack.current
        ) {
          console.log("Track ended, moving to next track.");
          const nextIndex = currentTrackIndexRef.current + 1;
          if (nextIndex < tracksRef.current.length) {
            isPlayingNextTrack.current = true;
            setCurrentTrackIndex(nextIndex);
            // Reset the flag after a short delay to ensure the track change is processed
            setTimeout(() => {
              isPlayingNextTrack.current = false;
            }, 1000);
          } else {
            console.log("No more tracks to play.");
          }
        }

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
        }

        isHandlingStateChange = false;
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
    const loadTracks = async () => {
      try {
        const accessToken = localStorage.getItem("spotify_access_token");
        if (!accessToken) {
          router.push("/");
          return;
        }
        const playlistId = (resolvedParams as { playlistId: string })
          .playlistId;

        console.log("Access token:", accessToken);

        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        console.log("API response status:", response.status);
        const data = await response.json();
        console.log("API response data:", data);

        if (!response.ok) throw new Error("Failed to fetch tracks");

        const configuredTracks = data.items
          .map((item: any) => item.track)
          .filter((track: Track) => {
            const segments = JSON.parse(
              localStorage.getItem(`segments_${track.id}`) ?? "[]"
            );
            console.log(`Segments for track ${track.id}:`, segments);
            return segments.length > 0;
          });

        setTracks(configuredTracks);
        console.log("Tracks state updated:", configuredTracks);

        // Load initial track's segments and BPM
        if (configuredTracks.length > 0) {
          const initialTrack = configuredTracks[0];
          const storedSegments = JSON.parse(
            localStorage.getItem(`segments_${initialTrack.id}`) ?? "[]"
          );
          setSegments(storedSegments);

          const savedBPMs = JSON.parse(
            localStorage.getItem("savedBPMs") ?? "{}"
          );
          if (savedBPMs[initialTrack.id]) {
            setTrackBPM({
              tempo: savedBPMs[initialTrack.id],
              isManual: true,
            });
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading tracks:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      }
    };
    loadTracks();
  }, [(resolvedParams as { playlistId: string }).playlistId, router]);

  // Handle track changes
  useEffect(() => {
    if (tracks[currentTrackIndex]) {
      const track = tracks[currentTrackIndex];
      console.log("Track changed, playing:", track.id);
      playTrack(track.id); // Play the track when currentTrackIndex changes

      // Load track data
      const storedSegments = JSON.parse(
        localStorage.getItem(`segments_${track.id}`) ?? "[]"
      );
      setSegments(storedSegments);

      const savedBPMs = JSON.parse(localStorage.getItem("savedBPMs") ?? "{}");
      if (savedBPMs[track.id]) {
        setTrackBPM({
          tempo: savedBPMs[track.id],
          isManual: true,
        });
      }
    }
  }, [currentTrackIndex, tracks]); // This effect handles track changes

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
        localStorage.getItem(`segments_${trackId}`) ?? "[]"
      );
      setSegments(storedSegments);

      const savedBPMs = JSON.parse(localStorage.getItem("savedBPMs") ?? "{}");
      if (savedBPMs[trackId]) {
        setTrackBPM({
          tempo: savedBPMs[trackId],
          isManual: true,
        });
      }
    } catch (error) {
      console.error("Error playing track:", error);
    }
  };

  const playNextTrack = async () => {
    if (isPlayingNextTrack.current) return;
    isPlayingNextTrack.current = true;

    setCurrentTrackIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < tracks.length) {
        return nextIndex;
      } else {
        console.log("No more tracks to play.");
        isPlayingNextTrack.current = false;
        return prevIndex; // Don't change the index if we're at the end
      }
    });

    // Reset the flag after the state update
    setTimeout(() => {
      isPlayingNextTrack.current = false;
    }, 500);
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
    const { nextSegment } = getCurrentAndNextSegment(
      playbackState.position,
      segments
    );
    if (nextSegment && player && deviceId && isPlayerReady) {
      const accessToken = localStorage.getItem("spotify_access_token");
      if (!accessToken) return;

      try {
        await fetch(
          `https://api.spotify.com/v1/me/player/seek?device_id=${deviceId}&position_ms=${nextSegment.startTime}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.error("Error jumping to next segment:", error);
      }
    }
  };

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
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Playlist
          </Button>

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
        <div className="container mx-auto py-8">
          {/* Workout progress */}
          <div className="mt-8">
            <WorkoutProgress
              segments={segments}
              currentPosition={playbackState.position}
              duration={currentTrack.duration_ms}
            />
          </div>

          {/* Playback controls */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              size="lg"
              variant="outline"
              onClick={playPreviousTrack}
              disabled={currentTrackIndex === 0}
              className="w-12 h-12 rounded-full"
            >
              <SkipBackIcon className="w-6 h-6" />
            </Button>

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

            <Button
              size="lg"
              variant="outline"
              onClick={debouncedPlayNextTrack}
              disabled={currentTrackIndex === tracks.length - 1}
              className="w-12 h-12 rounded-full"
            >
              <SkipForwardIcon className="w-6 h-6" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={jumpToNextSegment}
              className="w-12 h-12 rounded-full"
            >
              Jump to Next Segment
            </Button>
          </div>
        </div>
      </div>

      {/* Track progress bar */}
      <div className="flex-none bg-black/20 p-4">
        <div className="container mx-auto">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/50 transition-all duration-1000"
              style={{
                width: `${
                  (playbackState.position / currentTrack.duration_ms) * 100
                }%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span>{formatTime(playbackState.position)}</span>
            <span>{formatTime(currentTrack.duration_ms)}</span>
          </div>
        </div>
      </div>

      {/* Playlist Overview */}
      <div className="mb-8 bg-black/20 p-4">
        <div className="container mx-auto">
          <h2 className="text-lg font-semibold mb-4">Workout Playlist</h2>
          <div className="space-y-2">
            {tracks.map((track, index) => (
              <div
                key={`${track.id}-${index}`}
                className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-white/5 ${
                  index === currentTrackIndex ? "bg-white/10" : ""
                }`}
                onClick={() => {
                  setCurrentTrackIndex(index);
                  playTrack(track.id);
                }}
              >
                <div className="w-8 text-gray-400">{index + 1}</div>
                <div className="flex-1">
                  <div className="font-medium">{track.name}</div>
                  <div className="text-sm text-gray-400">
                    {track.artists.map((a) => a.name).join(", ")}
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {Math.floor(track.duration_ms / 60000)}:
                  {String(
                    Math.floor((track.duration_ms % 60000) / 1000)
                  ).padStart(2, "0")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
