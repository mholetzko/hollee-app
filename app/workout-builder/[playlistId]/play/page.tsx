/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FastForwardIcon from "@mui/icons-material/FastForward";
import {
  Track,
  PlaybackState,
  TrackBPM,
  Segment,
  WorkoutType,
  WORKOUT_LABELS,
} from "../types";
import { WorkoutDisplay } from "../components/WorkoutDisplay";
import { LoadingState } from "../components/LoadingState";
import { BeatCountdown } from "../components/BeatCountdown";
import { SegmentTimeline } from "../components/SegmentTimeline";
import { TrackStorage } from "../../../utils/storage/TrackStorage";
import { SpotifyAuthStorage } from "../../../utils/storage/SpotifyAuthStorage";
import { DeviceStorage } from "../../../utils/storage/DeviceStorage";
import { GlobalWorkoutTimeline } from "../components/GlobalWorkoutTimeline";
import { WorkoutBadge } from "../components/WorkoutBadge";
import { SmallWorkoutBadge } from "../components/SmallWorkoutBadge";

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

const getUniqueWorkoutTypes = (segments: Segment[]): WorkoutType[] => {
  return Array.from(new Set(segments.map((s) => s.type)));
};

// Add this cleanup function near your other utility functions
const cleanupPlayer = async (
  player: any,
  deviceId: string,
  progressInterval: React.MutableRefObject<NodeJS.Timeout | null>,
  setPlaybackState: React.Dispatch<React.SetStateAction<PlaybackState>>,
  setPlayer: React.Dispatch<React.SetStateAction<any>>,
  setDeviceId: React.Dispatch<React.SetStateAction<string>>,
  setIsPlayerReady: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (!player) return;

  try {
    console.log("[cleanupPlayer] Starting cleanup sequence");

    // 1. First pause playback using both methods
    const token = SpotifyAuthStorage.load();
    if (token) {
      await Promise.all([
        fetch(
          `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          }
        ).catch(console.error),
        player.pause().catch(console.error),
      ]);
    }

    // 2. Clear all intervals immediately
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    // 3. Remove all event listeners
    player.removeListener("ready");
    player.removeListener("not_ready");
    player.removeListener("player_state_changed");
    player.removeListener("initialization_error");
    player.removeListener("authentication_error");
    player.removeListener("account_error");
    player.removeListener("playback_error");

    // 4. Disconnect the player
    await player.disconnect();

    // 5. Reset all states
    setPlaybackState({
      isPlaying: false,
      position: 0,
      duration: 0,
      hasStarted: false,
      track_window: { current_track: { id: "" } },
    });

    setPlayer(null);
    setDeviceId("");
    setIsPlayerReady(false);

    console.log("[cleanupPlayer] Cleanup sequence completed");
  } catch (error) {
    console.error("[cleanupPlayer] Error during cleanup:", error);
    throw error; // Re-throw to handle in calling function
  }
};

export default function WorkoutPlayer() {
  const params = useParams();
  const playlistId = params.playlistId as string;

  // All state declarations first
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [trackBPM, setTrackBPM] = useState<TrackBPM>({
    tempo: 128,
    isManual: true,
  });
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    position: 0,
    duration: 0,
    hasStarted: false,
    track_window: { current_track: { id: "" } },
  });
  const [currentTrackStartTime, setCurrentTrackStartTime] = useState(0);

  // Add currentTrack memoization
  const currentTrack = useMemo(
    () => tracks[currentTrackIndex],
    [tracks, currentTrackIndex]
  );

  // All refs next
  const positionRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const tracksRef = useRef<Track[]>(tracks);
  const currentTrackIndexRef = useRef<number>(currentTrackIndex);
  const isPlayingNextTrack = useRef(false);

  // Add a state to track script loading
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Add state to track GO! display
  const [showingGo, setShowingGo] = useState(false);

  // Add this near other useRef declarations at the top
  const previousPositionRef = useRef<number>(0);

  // Define playTrack first since it's used by playNextTrack
  const playTrack = useCallback(
    async (trackId: string) => {
      try {
        if (!player || !deviceId) {
          throw new Error("Player or device ID not available");
        }

        const token = SpotifyAuthStorage.load();
        if (!token) {
          throw new Error("No access token available");
        }

        // First pause and seek to 0
        await Promise.all([
          fetch(
            `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ).catch(() => {}),
          fetch(
            `https://api.spotify.com/v1/me/player/seek?position_ms=0&device_id=${deviceId}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ).catch(() => {}),
        ]);

        // Wait for pause and seek to complete
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Then start playing from beginning
        const response = await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uris: [`spotify:track:${trackId}`],
              position_ms: 0,
            }),
          }
        );

        if (response.status === 204) {
          // Reset all position tracking
          startTimeRef.current = Date.now();
          positionRef.current = 0;

          // Force player to seek to beginning
          await player.seek(0);

          setPlaybackState((prev) => ({
            ...prev,
            isPlaying: true,
            position: 0,
            hasStarted: true,
            track_window: {
              current_track: { id: trackId },
            },
          }));

          return;
        }

        throw new Error(`Failed to play track: ${response.status}`);
      } catch (error) {
        console.error("[playTrack] Error:", error);
        throw error;
      }
    },
    [player, deviceId]
  );

  // Then define playNextTrack
  const playNextTrack = useCallback(async () => {
    if (isPlayingNextTrack.current) {
      console.log("[playNextTrack] Already playing next track");
      return;
    }

    isPlayingNextTrack.current = true;
    console.log("[playNextTrack] Starting next track");

    try {
      const nextTrackIndex = currentTrackIndexRef.current + 1;
      if (nextTrackIndex >= tracksRef.current.length) {
        console.log("[playNextTrack] Reached end of playlist");
        isPlayingNextTrack.current = false;
        return;
      }

      setCurrentTrackIndex(nextTrackIndex);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const nextTrack = tracksRef.current[nextTrackIndex];
      await playTrack(nextTrack.id);

      console.log("[playNextTrack] Successfully started next track");
    } catch (error) {
      console.error("[playNextTrack] Error playing next track:", error);
    } finally {
      setTimeout(() => {
        isPlayingNextTrack.current = false;
      }, 1000);
    }
  }, [playTrack]);

  // Update the playback state handling effect
  useEffect(() => {
    if (!player) return;

    const handleStateChange = (state: any) => {
      if (!state) return;

      // Update playback state in a single update
      setPlaybackState((prev) => {
        const newPosition = state.position;
        const startTime = Date.now() - newPosition;

        // Clear existing interval
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }

        // Set up new interval if playing
        if (!state.paused) {
          progressInterval.current = setInterval(() => {
            const position = Date.now() - startTime;
            if (position <= currentTrack?.duration_ms) {
              setPlaybackState((prev) => ({
                ...prev,
                position,
              }));
            }
          }, 50);
        }

        // Track end detection logic
        const wasPlaying = !prev.paused;
        const isNowPaused = state.paused;
        const isAtEnd = newPosition >= (state.duration - 500);
        
        // Track has ended if:
        // 1. Was playing but now paused and at position 0 (natural end)
        // 2. Was playing but now paused and was near the end
        const trackHasEnded = 
          (wasPlaying && isNowPaused && newPosition === 0 && previousPositionRef.current > 0) ||
          (wasPlaying && isNowPaused && isAtEnd);

        console.log("[Player State] Debug:", {
          wasPlaying,
          isNowPaused,
          previousPosition: previousPositionRef.current,
          currentPosition: newPosition,
          duration: state.duration,
          isAtEnd,
          trackHasEnded
        });

        // Store current position for next update
        previousPositionRef.current = newPosition;

        if (trackHasEnded && !isPlayingNextTrack.current) {
          console.log("[Player State] Track ended, playing next track");
          setTimeout(() => {
            playNextTrack();
          }, 500);
        }

        return {
          ...prev,
          isPlaying: !state.paused,
          position: newPosition,
          duration: state.duration,
          hasStarted: true,
          paused: state.paused,
          track_window: {
            current_track: {
              id: state.track_window?.current_track?.id,
            },
          },
        };
      });
    };

    player.addListener("player_state_changed", handleStateChange);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      player.removeListener("player_state_changed", handleStateChange);
    };
  }, [player, currentTrack?.duration_ms, playNextTrack]);

  // 2. Update the togglePlayback function
  const togglePlayback = async () => {
    try {
      if (!player || !deviceId || !currentTrack) {
        console.error(
          "[togglePlayback] Player, device ID, or track not available"
        );
        return;
      }

      if (!playbackState.isPlaying) {
        // If starting playback, use playTrack to ensure we start from beginning
        await playTrack(currentTrack.id);
      } else {
        // If pausing, use regular pause
        const token = SpotifyAuthStorage.load();
        if (!token) return;

        await fetch(
          `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setPlaybackState((prev) => ({
          ...prev,
          isPlaying: false,
        }));
      }
    } catch (error) {
      console.error("[togglePlayback] Error:", error);
    }
  };

  const playPreviousTrack = useCallback(async () => {
    const prevTrackIndex = currentTrackIndexRef.current - 1;
    if (prevTrackIndex < 0) return;

    setCurrentTrackIndex(prevTrackIndex);
    const prevTrack = tracksRef.current[prevTrackIndex];
    await playTrack(prevTrack.id);
  }, [playTrack]);

  // Move loadTrackData outside the component or memoize it
  const loadTrackData = useCallback((playlistId: string, trackId: string) => {
    if (typeof window === "undefined") return { segments: [], bpm: null };

    console.log("[loadTrackData] Loading data for track:", trackId);

    // Load segments and BPM using TrackStorage
    const segments = TrackStorage.segments.load(playlistId, trackId);
    const storedBPM = TrackStorage.bpm.load(playlistId, trackId);

    const bpmData = storedBPM
      ? {
          tempo: Number(storedBPM.tempo),
          isManual: storedBPM.source === "manual",
        }
      : null;

    return {
      segments,
      bpm: bpmData,
    };
  }, []);

  // 2. Then define all effects that use these functions
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex;
  }, [currentTrackIndex]);

  // Add effect to fetch tracks
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const accessToken = SpotifyAuthStorage.load();
        if (!accessToken) {
          router.push("/");
          return;
        }

        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch tracks");
        }

        const data = await response.json();
        const trackList = data.items
          .map((item: any) => item.track)
          .filter((track: any) => track !== null);

        setTracks(trackList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tracks:", error);
        setError("Failed to load tracks");
        setLoading(false);
      }
    };

    fetchTracks();
  }, [playlistId, router]);

  // Add effect to initialize Spotify player
  useEffect(() => {
    const initializePlayer = () => {
      console.log("[Player Init] Starting initialization");
      const accessToken = SpotifyAuthStorage.load();
      if (!accessToken) {
        setError("No access token available");
        return;
      }

      const player = new window.Spotify.Player({
        name: "Workout Builder Web Player",
        getOAuthToken: (cb: (token: string) => void) => {
          cb(accessToken);
        },
      });

      // Add more detailed logging
      player.addListener(
        "initialization_error",
        ({ message }: { message: string }) => {
          console.error("[Player Init] Initialization error:", message);
          setError(`Player initialization failed: ${message}`);
        }
      );

      player.addListener(
        "authentication_error",
        ({ message }: { message: string }) => {
          console.error("[Player Init] Authentication error:", message);
          setError(`Authentication failed: ${message}`);
        }
      );

      player.addListener(
        "account_error",
        ({ message }: { message: string }) => {
          console.error("[Player Init] Account error:", message);
          setError(`Account error: ${message}`);
        }
      );

      player.addListener(
        "playback_error",
        ({ message }: { message: string }) => {
          console.error("[Player Init] Playback error:", message);
        }
      );

      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("[Player Init] Ready with device ID:", device_id);
        setDeviceId(device_id);
        DeviceStorage.save([
          {
            id: device_id,
            is_active: true,
            name: "Web Player",
            type: "Computer",
          },
        ]);
        setIsPlayerReady(true);
        setLoading(false);
      });

      player.addListener("not_ready", () => {
        console.log("[Player Init] Device ID is not ready!");
        setIsPlayerReady(false);
      });

      player.addListener("player_state_changed", (state: any) => {
        console.log("[Player State] State changed:", state);
        if (!state) return;

        setPlaybackState({
          isPlaying: !state.paused,
          position: state.position,
          duration: state.duration,
          hasStarted: true,
          track_window: {
            current_track: {
              id: state.track_window.current_track.id,
            },
          },
        });
      });

      console.log("[Player Init] Connecting player...");
      player.connect().then((success: boolean) => {
        if (success) {
          console.log("[Player Init] Connected successfully");
          setPlayer(player);
        } else {
          console.error("[Player Init] Failed to connect");
          setError("Failed to connect to Spotify");
        }
      });
    };

    if (!window.Spotify && !isScriptLoaded) {
      console.log("[Player Init] Loading Spotify SDK script");
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;

      script.onload = () => {
        console.log("[Player Init] Script loaded");
        setIsScriptLoaded(true);
      };

      document.body.appendChild(script);
    }

    if (window.Spotify && !player) {
      window.onSpotifyWebPlaybackSDKReady = initializePlayer;
      initializePlayer();
    }

    return () => {
      if (player) {
        console.log("[Player Cleanup] Starting cleanup");
        cleanupPlayer(
          player,
          deviceId,
          progressInterval,
          setPlaybackState,
          setPlayer,
          setDeviceId,
          setIsPlayerReady
        ).catch(console.error);
      }
    };
  }, [isScriptLoaded]);

  // Add effect to load track data when track changes
  useEffect(() => {
    if (tracks[currentTrackIndex]) {
      const trackData = loadTrackData(playlistId, tracks[currentTrackIndex].id);
      setSegments(trackData.segments);
      if (trackData.bpm) {
        setTrackBPM(trackData.bpm);
      }
    }
  }, [currentTrackIndex, tracks, playlistId, loadTrackData]);

  // Add this effect after your other effects
  useEffect(() => {
    const startTime = tracks
      .slice(0, currentTrackIndex)
      .reduce((acc, track) => acc + track.duration_ms, 0);
    setCurrentTrackStartTime(startTime);
  }, [currentTrackIndex, tracks]);

  // Move handleBack to the top with other hooks
  const handleBack = useCallback(async () => {
    try {
      console.log("[handleBack] Starting navigation sequence");

      if (player && deviceId) {
        // Force pause first
        try {
          await player.pause();
        } catch (e) {
          console.error("[handleBack] Error pausing:", e);
        }

        // Wait a moment for pause to take effect
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Perform full cleanup
        await cleanupPlayer(
          player,
          deviceId,
          progressInterval,
          setPlaybackState,
          setPlayer,
          setDeviceId,
          setIsPlayerReady
        );

        // Wait another moment for cleanup to settle
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log("[handleBack] Navigation sequence complete, redirecting...");

      // Use replace instead of push to prevent back navigation
      if (playlistId) {
        router.replace(`/workout-builder/${playlistId}`);
      } else {
        router.replace("/dashboard");
      }
    } catch (error) {
      console.error("[handleBack] Error during navigation:", error);
      // Force navigation even if cleanup fails
      router.replace(`/workout-builder/${playlistId}`);
    }
  }, [router, playlistId, player, deviceId]);

  // Update the BPM loading effect
  useEffect(() => {
    if (!currentTrack) return;

    // Use TrackStorage.bpm.load instead of loadBPM
    const storedBPM = TrackStorage.bpm.load(playlistId, currentTrack.id);
    if (storedBPM) {
      setTrackBPM({
        tempo: Number(storedBPM.tempo),
        isManual: storedBPM.isManual,
      });
    } else {
      // Set a default BPM if none is found
      setTrackBPM({
        tempo: 128,
        isManual: false,
      });
    }
  }, [currentTrack, playlistId]);

  // Add this new effect to handle position resets
  useEffect(() => {
    if (playbackState.isPlaying && playbackState.position > 0 && player) {
      const checkPosition = async () => {
        const state = await player.getCurrentState();
        if (state && state.position > 1000) {
          // If position is more than 1 second in
          await player.seek(0);
          setPlaybackState((prev) => ({
            ...prev,
            position: 0,
          }));
        }
      };
      checkPosition();
    }
  }, [playbackState.isPlaying, player]);

  // Update the useEffect that handles segment transitions
  useEffect(() => {
    if (!trackBPM.tempo || !playbackState.isPlaying) return;

    const beatDuration = 60000 / trackBPM.tempo;
    const checkInterval = setInterval(() => {
      const { nextSegment } = getCurrentAndNextSegment(
        playbackState.position,
        segments
      );

      if (nextSegment) {
        const timeToNext = nextSegment.startTime - playbackState.position;
        const beatsUntilNext = Math.ceil(timeToNext / beatDuration);

        // When we hit GO!
        if (beatsUntilNext === 0 && !showingGo) {
          setShowingGo(true);
          // Keep showing GO! for 2 seconds
          setTimeout(() => {
            setShowingGo(false);
          }, 2000);
        }
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [
    trackBPM.tempo,
    playbackState.isPlaying,
    playbackState.position,
    segments,
    showingGo,
  ]);

  // 3. Return your JSX
  if (error) {
    return <div>Error: {error}</div>;
  }

  if (loading || !tracks.length || !currentTrack) {
    return <LoadingState />;
  }

  const jumpToNextSegment = async () => {
    console.log("[Jump] Starting jump to next segment");

    const { nextSegment } = getCurrentAndNextSegment(
      playbackState.position,
      segments
    );

    if (!nextSegment) {
      console.log("[Jump] No next segment found");
      return;
    }

    if (!player || !deviceId || !isPlayerReady) {
      console.log("[Jump] Player not ready");
      return;
    }

    const accessToken = SpotifyAuthStorage.load();
    if (!accessToken) {
      console.log("[Jump] No access token");
      return;
    }

    try {
      // Round the position to the nearest integer
      const seekPosition = Math.round(nextSegment.startTime);
      console.log("[Jump] Seeking to position:", seekPosition);

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
      setPlaybackState((prev) => ({
        ...prev,
        position: seekPosition,
      }));

      console.log("[Jump] Successfully jumped to next segment");
    } catch (error) {
      console.error("[Jump] Error jumping to next segment:", error);
      if (error instanceof Response) {
        const errorData = await error.json();
        console.error("[Jump] API Error details:", errorData);
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-none bg-black/20 backdrop-blur-sm p-8 border-b border-white/10">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 hover:bg-white/10"
            onClick={handleBack}
          >
            <ArrowBackIcon className="w-4 h-4 mr-2" />
            Back to Playlist
          </Button>

          <div className="mt-4">
            <GlobalWorkoutTimeline
              tracks={tracks}
              segments={segments}
              playlistId={playlistId}
              currentTrackIndex={currentTrackIndex}
              currentPosition={playbackState.position}
              currentTrackStartTime={currentTrackStartTime}
            />
          </div>
        </div>

        {/* Track info and controls */}
        <div className="flex-1 flex flex-col">
          {/* Current track info */}
          <div className="flex-none bg-black/20 backdrop-blur-sm p-8 border-b border-white/10">
            <div className="flex items-center gap-8">
              {/* Album art and track info */}
              <div className="flex items-center gap-6 flex-1">
                {currentTrack.album?.images?.[0] && (
                  <img
                    src={currentTrack.album.images[0].url}
                    alt={currentTrack.name}
                    className="w-24 h-24 rounded"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold mb-1">
                    <a
                      href={`https://open.spotify.com/track/${currentTrack.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#1DB954] transition-colors flex items-center gap-2"
                    >
                      {currentTrack.name}
                      <img
                        src="/spotify-logo.svg"
                        alt="Spotify"
                        className="w-5 h-5 inline"
                      />
                    </a>
                  </h1>
                  <p className="text-sm text-gray-400">
                    {currentTrack.artists.map((artist, i) => (
                      <React.Fragment key={artist.id}>
                        {i > 0 && ", "}
                        <a
                          href={`https://open.spotify.com/artist/${artist.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#1DB954] transition-colors"
                        >
                          {artist.name}
                        </a>
                      </React.Fragment>
                    ))}
                  </p>
                  <a
                    href={`https://open.spotify.com/album/${currentTrack.album.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 hover:text-[#1DB954] transition-colors"
                  >
                    {currentTrack.album.name}
                  </a>
                </div>
              </div>

              {/* Workout types and BPM Display */}
              <div className="flex items-center gap-6">
                <div className="flex gap-4">
                  {getUniqueWorkoutTypes(segments).map((type) => (
                    <WorkoutBadge key={type} type={type} />
                  ))}
                </div>

                <div className="flex flex-col items-center justify-center px-6 py-4 bg-white/5 rounded-lg">
                  <div className="text-4xl font-mono font-bold text-white/90 mb-1">
                    {Math.round(trackBPM.tempo)}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">
                    BPM
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workout display */}
          <div className="flex-1 p-8">
            <div className="flex gap-8">
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
                      currentSegment={currentSegment}
                      forceShowGo={showingGo}
                    />
                    <WorkoutDisplay segment={nextSegment} isNext />
                  </>
                );
              })()}
            </div>
          </div>

          {/* Track progress and controls */}
          <div className="flex-1 overflow-y-auto p-8">
            {/* Track progress timeline */}
            <div className="flex-none bg-black/20 p-6 rounded-lg">
              <SegmentTimeline
                segments={segments}
                duration={currentTrack.duration_ms}
                position={playbackState.position}
                isPlaying={playbackState.isPlaying}
                showBeats={true}
                bpm={trackBPM.tempo}
              />
            </div>

            {/* Playback controls */}
            <div className="flex justify-center items-center gap-6 mt-12">
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
                onClick={playNextTrack}
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
          </div>
        </div>
      </div>

      {/* Vertical separator */}
      <div className="w-px bg-white/20" />

      {/* Track list sidebar - keep this one */}
      <div className="w-[450px] flex-none bg-black/20 backdrop-blur-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold">Current & Up Next</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-3">
            {tracks.slice(currentTrackIndex).map((track, index) => {
              const actualIndex = currentTrackIndex + index;
              const uniqueTrackKey = `${track.id}-position-${actualIndex}`;

              const storedBPM = TrackStorage.bpm.load(playlistId, track.id);
              const trackBPMData = storedBPM?.tempo ?? null;

              const trackSegments = TrackStorage.segments.load(
                playlistId,
                track.id
              );
              const trackWorkoutTypes = Array.from(
                new Set(trackSegments.map((s: Segment) => s.type))
              );

              return (
                <div
                  key={uniqueTrackKey}
                  className={`flex flex-col p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors
                      ${
                        actualIndex === currentTrackIndex ? "bg-white/10" : ""
                      }`}
                  onClick={() => {
                    setCurrentTrackIndex(actualIndex);
                    playTrack(track.id);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400">{actualIndex + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{track.name}</div>
                      <div className="text-sm text-gray-400 truncate">
                        {track.artists.map((a) => a.name).join(", ")}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-4">
                    {trackWorkoutTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {trackWorkoutTypes.map((type: WorkoutType, index) => (
                          <SmallWorkoutBadge
                            key={`${uniqueTrackKey}-workout-${type}-${index}`}
                            type={type}
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <div className="font-mono">
                        {trackBPMData ? `${Math.round(trackBPMData)}` : "--"}{" "}
                        BPM
                      </div>
                      <div>
                        {Math.floor(track.duration_ms / 60000)}:
                        {String(
                          Math.floor((track.duration_ms % 60000) / 1000)
                        ).padStart(2, "0")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
