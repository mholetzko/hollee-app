/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
  getStorageKey,
  WorkoutType,
  WORKOUT_LABELS,
} from "../types";
import { WorkoutDisplay } from "../components/WorkoutDisplay";
import { LoadingState } from "../components/LoadingState";
import { BeatCountdown } from "../components/BeatCountdown";
import { SegmentTimeline } from "../components/SegmentTimeline";
import { DeviceSelector } from "../components/DeviceSelector";

// Add types if not already defined in types.ts
declare global {
  interface Window {
    Spotify: {
      Player: any;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface Params {
  readonly playlistId: string;
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

const WorkoutBadge = ({ type }: { type: WorkoutType }) => {
  const badgeStyles: Record<WorkoutType, { bg: string; text: string }> = {
    PLS: { bg: "bg-purple-500/20", text: "text-purple-300" },
    SEATED_ROAD: { bg: "bg-blue-500/20", text: "text-blue-300" },
    SEATED_CLIMB: { bg: "bg-green-500/20", text: "text-green-300" },
    STANDING_CLIMB: { bg: "bg-yellow-500/20", text: "text-yellow-300" },
    STANDING_JOGGING: { bg: "bg-orange-500/20", text: "text-orange-300" },
    JUMPS: { bg: "bg-red-500/20", text: "text-red-300" },
    WAVES: { bg: "bg-pink-500/20", text: "text-pink-300" },
    PUSHES: { bg: "bg-indigo-500/20", text: "text-indigo-300" },
  };

  return (
    <div
      className={`px-4 py-2 rounded-lg ${badgeStyles[type].bg} 
      flex flex-col items-center justify-center`}
    >
      <div className={`text-2xl font-bold ${badgeStyles[type].text}`}>
        {WORKOUT_LABELS[type]}
      </div>
    </div>
  );
};

// Add this small badge component for the track list
const SmallWorkoutBadge = ({ type }: { type: WorkoutType }) => {
  const badgeStyles: Record<WorkoutType, { bg: string; text: string }> = {
    PLS: { bg: "bg-purple-500/20", text: "text-purple-300" },
    SEATED_ROAD: { bg: "bg-blue-500/20", text: "text-blue-300" },
    SEATED_CLIMB: { bg: "bg-green-500/20", text: "text-green-300" },
    STANDING_CLIMB: { bg: "bg-yellow-500/20", text: "text-yellow-300" },
    STANDING_JOGGING: { bg: "bg-orange-500/20", text: "text-orange-300" },
    JUMPS: { bg: "bg-red-500/20", text: "text-red-300" },
    WAVES: { bg: "bg-pink-500/20", text: "text-pink-300" },
    PUSHES: { bg: "bg-indigo-500/20", text: "text-indigo-300" },
  };

  return (
    <div
      className={`px-3 py-1.5 rounded-md ${badgeStyles[type].bg} ${badgeStyles[type].text} 
      text-sm font-medium`}
    >
      {WORKOUT_LABELS[type]}
    </div>
  );
};

// Add this new component for the global timeline
const GlobalWorkoutTimeline = ({
  tracks,
  segments: currentTrackSegments,
  playlistId,
  currentTrackIndex,
  currentPosition,
  currentTrackStartTime,
}: {
  tracks: Track[];
  segments: Segment[];
  playlistId: string;
  currentTrackIndex: number;
  currentPosition: number;
  currentTrackStartTime: number;
}) => {
  const trackStartTimes = tracks.reduce<number[]>((acc, _, index) => {
    if (index === 0) return [0];
    const prevTrack = tracks[index - 1];
    return [...acc, acc[index - 1] + prevTrack.duration_ms];
  }, []);

  const totalDuration =
    trackStartTimes[trackStartTimes.length - 1] +
      tracks[tracks.length - 1]?.duration_ms || 0;

  // Get all segments from all tracks and sort them by start time
  const allSegments = tracks
    .map((track, index) => {
      const trackSegments =
        track.id === tracks[currentTrackIndex].id
          ? currentTrackSegments
          : JSON.parse(
              localStorage.getItem(
                getStorageKey(playlistId, track.id, "segments")
              ) || "[]"
            );

      return trackSegments.map((segment: Segment) => ({
        ...segment,
        absoluteStartTime: trackStartTimes[index] + segment.startTime,
        absoluteEndTime: trackStartTimes[index] + segment.endTime,
        trackIndex: index,
      }));
    })
    .flat()
    .sort((a, b) => a.absoluteStartTime - b.absoluteStartTime);

  return (
    <div className="relative h-32 bg-black/20 rounded-lg overflow-hidden">
      {/* Grid lines */}
      <div className="absolute inset-0 grid grid-rows-5 gap-0">
        {[...Array(5)].map((_, i) => (
          <div key={`grid-${i}`} className="border-t border-white/10 relative">
            <span className="absolute right-0 -top-3 px-2 text-xs text-white/40">
              {100 - i * 20}%
            </span>
          </div>
        ))}
      </div>

      {/* Track boundaries */}
      {trackStartTimes.map((startTime, index) => (
        <div
          key={`track-boundary-${index}`}
          className="absolute top-0 bottom-0 w-px bg-white/20"
          style={{
            left: `${(startTime / totalDuration) * 100}%`,
          }}
        />
      ))}

      {/* Intensity bars - remove bottom padding since we removed badges */}
      <div className="absolute inset-0">
        {allSegments.map((segment, index) => {
          const startPercent =
            (segment.absoluteStartTime / totalDuration) * 100;
          const widthPercent =
            ((segment.absoluteEndTime - segment.absoluteStartTime) /
              totalDuration) *
            100;
          const heightPercent =
            segment.intensity === -1 ? 100 : segment.intensity;
          const isCurrentTrack = segment.trackIndex === currentTrackIndex;

          // Calculate intensity-based color
          const intensityColor =
            segment.intensity === -1
              ? "bg-red-500"
              : segment.intensity > 80
              ? "bg-orange-500"
              : segment.intensity > 60
              ? "bg-yellow-500"
              : segment.intensity > 40
              ? "bg-green-500"
              : "bg-blue-500";

          const uniqueSegmentKey = `segment-${segment.trackIndex}-${segment.id}-${index}`;

          return (
            <div
              key={uniqueSegmentKey}
              className={`absolute ${intensityColor} transition-opacity
                ${isCurrentTrack ? "opacity-80" : "opacity-30"}`}
              style={{
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
                height: `${heightPercent}%`,
                bottom: "0", // Remove the bottom padding
              }}
            >
              {/* Enhanced tooltip */}
              <div className="absolute inset-0 flex items-center justify-center group">
                <div
                  className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                  bg-black/90 text-white text-sm rounded px-3 py-2 whitespace-nowrap z-30 shadow-lg"
                >
                  <div className="font-bold mb-1">
                    {WORKOUT_LABELS[segment.type]}
                  </div>
                  <div className="text-xs text-gray-300">
                    Intensity: {heightPercent}%<br />
                    Duration:{" "}
                    {(
                      (segment.absoluteEndTime - segment.absoluteStartTime) /
                      1000
                    ).toFixed(0)}
                    s
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current position indicator */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white z-30"
        style={{
          left: `${
            ((currentTrackStartTime + currentPosition) / totalDuration) * 100
          }%`,
          transition: "left 0.1s linear",
        }}
      />

      {/* Progress bar - move to bottom since we removed badges */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-white/30"
          style={{
            width: `${
              ((currentTrackStartTime + currentPosition) / totalDuration) * 100
            }%`,
            transition: "width 0.1s linear",
          }}
        />
      </div>
    </div>
  );
};

export default function WorkoutPlayer({
  params,
}: Readonly<{
  params: Params;
}>) {
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
    hasStarted: false,
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
    console.log("[Tracks Ref] Updated:", {
      tracksLength: tracks.length,
      refLength: tracksRef.current.length,
    });
  }, [tracks]);

  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex;
    console.log("[Track Index Ref] Updated:", {
      currentIndex: currentTrackIndex,
      refIndex: currentTrackIndexRef.current,
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
        name: `Workout Player ${Math.random().toString(36).substring(7)}`,
        getOAuthToken: (cb: (token: string) => void) => cb(accessToken),
      });

      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("Player ready with device ID:", device_id);
        setDeviceId(device_id);
        setIsPlayerReady(true);

        // Transfer playback to this device
        fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            device_ids: [device_id],
            play: false,
          }),
        });
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
            console.log("[Player State] No tracks available");
            return;
          }

          console.log("[Player State] Changed:", {
            paused: state.paused,
            position: state.position,
            duration: state.duration,
            track: state.track_window?.current_track?.id,
            currentTrackIndex: currentIndex,
            totalTracks: currentTracks.length,
            tracksAvailable: !!currentTracks,
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
          const isNearEnd =
            state.duration && state.position >= state.duration - 1000;
          const isTrackEnd =
            state.paused && (state.position === 0 || isNearEnd);
          const canPlayNext = currentIndex < currentTracks.length - 1;
          const shouldPlayNext =
            isTrackEnd && !isPlayingNextTrack.current && canPlayNext;

          console.log("[Player State] Track end check:", {
            isNearEnd,
            isTrackEnd,
            canPlayNext,
            shouldPlayNext,
            position: state.position,
            duration: state.duration,
            currentIndex,
            totalTracks: currentTracks.length,
            isPlayingNext: isPlayingNextTrack.current,
          });

          if (shouldPlayNext) {
            console.log("[Player State] Triggering next track");
            isPlayingNextTrack.current = true;

            // Small delay to ensure clean transition
            setTimeout(async () => {
              try {
                await playNextTrack();
              } catch (error) {
                console.error("[Auto Next] Error playing next track:", error);
                isPlayingNextTrack.current = false;
              }
            }, 500);
          }
        } catch (error) {
          console.error("[Player State] Error handling state change:", error);
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

        console.log("[Fetch Tracks] Starting fetch");

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
                getStorageKey(playlistId, track.id, "segments")
              ) ?? "[]"
            );
            return segments.length > 0;
          });

        console.log("[Fetch Tracks] Configured tracks:", {
          total: configuredTracks.length,
          tracks: configuredTracks.map((t) => t.id),
        });

        // Update ref first, then state
        tracksRef.current = configuredTracks;
        setTracks(configuredTracks);

        // Log the current state of refs
        console.log("[Fetch Tracks] Updated refs:", {
          tracksRefLength: tracksRef.current.length,
          currentTrackIndexRef: currentTrackIndexRef.current,
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
        console.error("[Fetch Tracks] Error:", error);
        setError("Failed to load tracks");
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
      console.log("[Track Change] Loading track:", track.id);

      // Load track data first
      const { segments, bpm } = loadTrackData(
        resolvedParams.playlistId,
        track.id
      );
      setSegments(segments);
      if (bpm) {
        setTrackBPM(bpm);
      }

      // Set flag and play track
      isPlayingNextTrack.current = true;
      playTrack(track.id).catch((error) => {
        console.error("[Track Change] Playback error:", error);
        isPlayingNextTrack.current = false;
      });
    }
  }, [currentTrackIndex, tracks]);

  // Add a new function to wait for player readiness
  const waitForPlayerReady = async () => {
    const maxAttempts = 10;
    const delayMs = 500;
    
    for (let i = 0; i < maxAttempts; i++) {
      if (isPlayerReady && deviceId) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    throw new Error('Player failed to initialize');
  };

  // Update the playTrack function
  const playTrack = async (trackId: string, retryCount = 0) => {
    console.log("[playTrack] Starting playback for track:", trackId, "retry:", retryCount);
    
    try {
      // Wait for player to be ready before proceeding
      await waitForPlayerReady();
      
      const token = localStorage.getItem("spotify_access_token");
      
      // Always use the Web Playback SDK device ID
      console.log("[playTrack] Using device ID:", deviceId);

      // First ensure any current playback is paused
      await fetch("https://api.spotify.com/v1/me/player/pause", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {}); // Ignore pause errors

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Always use the SDK device ID for playback
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: [`spotify:track:${trackId}`],
          position_ms: 0,
        }),
      });

      console.log("[playTrack] Response status:", response.status);

      if (response.status === 204) {
        console.log("[playTrack] Playback started successfully");
        setPlaybackState((prev) => ({
          ...prev,
          isPlaying: true,
          position: 0,
          hasStarted: true,
          track_window: {
            current_track: {
              id: trackId,
            },
          },
        }));
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[playTrack] Error:", {
          status: response.status,
          data: errorData,
        });

        // Only retry up to 3 times
        if (retryCount < 3) {
          console.log("[playTrack] Retrying transfer and playback...");
          
          await fetch("https://api.spotify.com/v1/me/player", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              device_ids: [deviceId],
              play: false,
            }),
          });

          await new Promise(resolve => setTimeout(resolve, 1500));
          return await playTrack(trackId, retryCount + 1);
        }

        throw new Error(
          `Playback failed: ${errorData.error?.message || response.statusText}`
        );
      }
    } catch (error) {
      console.error("[playTrack] Error:", error);
      throw error;
    }
  };

  const playNextTrack = async () => {
    console.log("[Next Track] Starting with:", {
      currentIndex: currentTrackIndexRef.current,
      isPlayingNext: isPlayingNextTrack.current,
      totalTracks: tracksRef.current.length,
      tracks: tracksRef.current.map((t) => t.id),
    });

    try {
      if (currentTrackIndexRef.current >= tracksRef.current.length - 1) {
        console.log("[Next Track] Already at last track");
        return;
      }

      const nextIndex = currentTrackIndexRef.current + 1;
      const nextTrack = tracksRef.current[nextIndex];

      console.log("[Next Track] Playing track:", {
        fromIndex: currentTrackIndexRef.current,
        toIndex: nextIndex,
        nextTrackId: nextTrack?.id,
      });

      setCurrentTrackIndex(nextIndex);

      await new Promise((resolve) => setTimeout(resolve, 100));

      await playTrack(nextTrack.id);
    } catch (error) {
      console.error("[Next Track] Error:", error);
      throw error;
    } finally {
      setTimeout(() => {
        isPlayingNextTrack.current = false;
        console.log("[Next Track] Reset playing next flag");
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
    console.log("[togglePlayback] Current state:", playbackState.isPlaying);

    const token = localStorage.getItem("spotify_access_token");
    const activeDevice = localStorage.getItem("spotify_active_device");

    try {
      const response = await fetch(
        "https://api.spotify.com/v1/me/player/" +
          (playbackState.isPlaying ? "pause" : "play"),
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          ...(activeDevice && {
            body: JSON.stringify({
              device_id: activeDevice,
            }),
          }),
        }
      );

      if (response.status === 204) {
        console.log("[togglePlayback] Success");
        setPlaybackState((prev) => ({
          ...prev,
          isPlaying: !prev.isPlaying,
        }));
        return;
      }

      if (!response.ok) {
        throw new Error(
          `Failed to ${playbackState.isPlaying ? "pause" : "play"}`
        );
      }
    } catch (error) {
      console.error("[togglePlayback] Error:", error);
      setShowDeviceSelector(true);
    }
  };

  const currentTrack = tracks[currentTrackIndex];

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

    const accessToken = localStorage.getItem("spotify_access_token");
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

  const loadTrackData = (playlistId: string, trackId: string) => {
    if (typeof window === "undefined") return { segments: [], bpm: null };

    // Load segments using new format
    const segmentsStored = localStorage.getItem(
      getStorageKey(playlistId, trackId, "segments")
    );
    const segments = segmentsStored ? JSON.parse(segmentsStored) : [];

    // Load BPM using new format
    const savedBPMs = JSON.parse(localStorage.getItem("savedBPMs") || "{}");
    const bpm = savedBPMs[`${playlistId}_${trackId}`] || null;

    return {
      segments,
      bpm: bpm ? { tempo: bpm, isManual: true } : null,
    };
  };

  useEffect(() => {
    if (!currentTrack) return;

    const { segments, bpm } = loadTrackData(
      resolvedParams.playlistId,
      currentTrack.id
    );
    setSegments(segments);
    if (bpm) {
      setTrackBPM(bpm);
    }
  }, [currentTrack, resolvedParams.playlistId]);

  // Add this to your main component's state
  const [currentTrackStartTime, setCurrentTrackStartTime] = useState(0);

  // Update the currentTrackStartTime when track changes
  useEffect(() => {
    const startTime = tracks
      .slice(0, currentTrackIndex)
      .reduce((acc, track) => acc + track.duration_ms, 0);
    setCurrentTrackStartTime(startTime);
  }, [currentTrackIndex, tracks]);

  const [showDeviceSelector, setShowDeviceSelector] = useState(false);

  // Also update the device activation to ensure playback starts
  const onDeviceSelected = async (deviceId: string) => {
    console.log("[Device Selected] Starting with device:", deviceId);
    setShowDeviceSelector(false);

    try {
      // First ensure the device is ready
      await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem(
            "spotify_access_token"
          )}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      });

      // Small delay to ensure device is ready
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Set flag to prevent auto-skip
      isPlayingNextTrack.current = true;

      if (currentTrack) {
        console.log("[Device Selected] Playing track:", currentTrack.id);
        await playTrack(currentTrack.id);
      }

      // Reset flag after a delay
      setTimeout(() => {
        isPlayingNextTrack.current = false;
        console.log("[Device Selected] Reset playing next flag");
      }, 2000);
    } catch (error) {
      console.error("[Device Selected] Error:", error);
      alert("Failed to start playback. Please try again.");
    }
  };

  // Update the playback state handling
  useEffect(() => {
    if (!player) return;

    const handleStateChange = (state: any) => {
      console.log("[Player State]", state);

      if (!state) {
        console.log("[Player State] No state received");
        return;
      }

      // Update playback state
      setPlaybackState((prev) => ({
        ...prev,
        isPlaying: !state.paused,
        position: state.position,
        duration: state.duration,
        hasStarted: true,
        track_window: {
          current_track: {
            id: state.track_window.current_track.id,
          },
        },
      }));

      // Only handle track ending if we're not already changing tracks
      // and the track has actually finished (not just paused)
      if (
        state.paused &&
        state.position === 0 &&
        !isPlayingNextTrack.current &&
        state.track_window?.previous_track
      ) {
        console.log("[Playback] Track ended naturally");
        debouncedPlayNextTrack();
      }
    };

    player.addListener("player_state_changed", handleStateChange);

    return () => {
      player.removeListener("player_state_changed", handleStateChange);
    };
  }, [player, debouncedPlayNextTrack]);

  // Update the initial track play effect
  useEffect(() => {
    if (isPlayerReady && deviceId && tracks.length > 0) {
      console.log("Player ready and tracks loaded, playing initial track");
      // Add a small delay before initial playback
      setTimeout(() => {
        playTrack(tracks[currentTrackIndex].id).catch(error => {
          console.error("Failed to play initial track:", error);
        });
      }, 1000);
    }
  }, [isPlayerReady, deviceId, tracks]);

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
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Back button and Timeline section - reduce padding */}
        <div className="flex-none bg-black/20 backdrop-blur-sm px-12 py-6 border-b border-white/10">
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

          {playbackState.hasStarted && (
            <div className="mt-4">
              <GlobalWorkoutTimeline
                tracks={tracks}
                segments={segments}
                playlistId={resolvedParams.playlistId}
                currentTrackIndex={currentTrackIndex}
                currentPosition={playbackState.position}
                currentTrackStartTime={currentTrackStartTime}
              />
            </div>
          )}
        </div>

        {/* Track info header - make more compact */}
        <div className="flex-none bg-black/20 backdrop-blur-sm px-12 py-6 border-b border-white/10">
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
                <h1 className="text-2xl font-bold mb-1">{currentTrack.name}</h1>
                <p className="text-sm text-gray-400">
                  {currentTrack.artists.map((a) => a.name).join(", ")}
                </p>
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

        {/* Fixed workout display - reduce padding */}
        {playbackState.isPlaying && (
          <div className="flex-none bg-black/10 backdrop-blur-sm border-b border-white/10">
            <div className="py-4 px-12">
              <div className="flex gap-4">
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

        {/* Track progress and controls - adjust padding */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Track progress and segments timeline */}
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

          {/* Playback controls - increase margin and gap */}
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
        </div>
      </div>

      {/* Vertical separator - make it more visible */}
      <div className="w-px bg-white/20" />

      {/* Track list sidebar - increase padding and spacing */}
      <div className="w-[450px] flex-none bg-black/20 backdrop-blur-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold">Current & Up Next</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-3">
            {tracks.slice(currentTrackIndex).map((track, index) => {
              const actualIndex = currentTrackIndex + index;
              const uniqueTrackKey = `${track.id}-position-${actualIndex}`;

              const trackBPMData = JSON.parse(
                localStorage.getItem("savedBPMs") || "{}"
              )[`${resolvedParams.playlistId}_${track.id}`];

              const trackSegments = JSON.parse(
                localStorage.getItem(
                  getStorageKey(resolvedParams.playlistId, track.id, "segments")
                ) || "[]"
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
                    {/* Workout type badges */}
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
