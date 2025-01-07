/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';
import { TrackStorage } from '../../../../utils/storage/TrackStorage';
import { SpotifyAuthStorage } from '../../../../utils/storage/SpotifyAuthStorage';
import { BPMVisualization } from "../../components/BPMVisualization";
import { WorkoutDisplay } from "../../components/WorkoutDisplay";
import { BeatCountdown } from '../../components/BeatCountdown';
import { TransportControls } from '../../components/TransportControls';
import { SongHeader } from '../../components/SongHeader';
import { Timeline } from '../../components/Timeline';
import { SegmentEditor } from '../../components/SegmentEditor';
import { TrackBPM } from "../../types";
import { v4 as uuidv4 } from 'uuid';
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { CurrentSegmentEditor } from '../../components/CurrentSegmentEditor';

// Add type for Spotify Player
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: { Player: any };
  }
}

interface Track {
  id: string;
  name: string;
  duration_ms: number;
  artists: { name: string }[];
  album?: { images?: { url: string }[] };
}

interface Segment {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
  type: WorkoutType;
  intensity: number;
}

// Add workout types enum
type WorkoutType = 
  | "PLS"
  | "SEATED_ROAD"
  | "SEATED_CLIMB"
  | "STANDING_CLIMB"
  | "STANDING_JOGGING"
  | "JUMPS"
  | "WAVES"
  | "PUSHES";

interface PlaybackState {
  isPlaying: boolean;
  position: number;
  duration: number;
}

interface DragState {
  segmentId: string | null;
  type: "start" | "end" | null;
  initialX: number;
  initialTime: number;
}

// Add this helper function to find current segment
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

// Update the BPM extraction to be simpler
const getBPMFromSources = async (track: Track, playlistId: string): Promise<SongBPMData> => {
  console.log("[BPM Extract] Starting BPM extraction for track:", track.name);

  const trackData = TrackStorage.loadTrackData(playlistId, track.id);
  if (trackData.bpm) {
    return {
      songId: track.id,
      bpm: trackData.bpm.tempo,
      source: "manual"
    };
  }

  // If no stored BPM, use default
  const defaultBPM = 128;
  TrackStorage.bpm.save(playlistId, track.id, defaultBPM);
  return {
    songId: track.id,
    bpm: defaultBPM,
    source: "manual"
  };
};

// Add a helper function to find adjacent segments
const findAdjacentSegments = (segments: Segment[], currentId: string) => {
  const sortedSegments = segments
    .filter((s) => s.id !== currentId)
    .sort((a, b) => a.startTime - b.startTime);

  const currentIndex = segments.findIndex((s) => s.id === currentId);
  const current = segments[currentIndex];

  return {
    prev: sortedSegments.filter((s) => s.endTime <= current.startTime).pop(),
    next: sortedSegments.filter((s) => s.startTime >= current.endTime).shift(),
  };
};

// Add new storage functions
const loadTrackData = (playlistId: string, songId: string) => {
  return TrackStorage.loadTrackData(playlistId, songId);
};

// Update the save function to use individual save methods
const saveTrackData = (
  playlistId: string,
  songId: string,
  segments: Segment[],
  bpm: TrackBPM
) => {
  console.log("[Save Track Data] Saving:", { playlistId, songId, segments, bpm });
  
  // Save segments and BPM separately
  TrackStorage.segments.save(playlistId, songId, segments);
  TrackStorage.bpm.save(playlistId, songId, bpm.tempo);
};

// Update the LoadingState component
const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="animate-spin h-8 w-8 border-2 border-white/50 rounded-full border-t-transparent" />
      <div className="text-sm text-gray-400">Loading track...</div>
      </div>
  );
};

// Add browser detection
const isSafari = () => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('safari') && !ua.includes('chrome');
};

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Update type definition
type SongBPMData = {
  songId: string;
  bpm: number;
  source: "manual"; // Simplified to only manual source
};

// Add the cleanupPlayer function
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

    // 1. Clear all intervals first to prevent state updates
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    // 2. Reset states before attempting API calls
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

    // 3. Try to pause playback only if we have both token and deviceId
    const token = SpotifyAuthStorage.load();
    if (token && deviceId) {
      try {
        // Attempt to pause via SDK first
        await player.pause().catch(() => {});
        
        // Then try API as backup
        await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {}); // Ignore API errors during cleanup
      } catch {
        // Ignore any pause errors during cleanup
      }
    }

    // 4. Remove all event listeners
    try {
      player.removeListener('ready');
      player.removeListener('not_ready');
      player.removeListener('player_state_changed');
      player.removeListener('initialization_error');
      player.removeListener('authentication_error');
      player.removeListener('account_error');
      player.removeListener('playback_error');
    } catch {
      // Ignore listener removal errors
    }

    // 5. Finally disconnect the player
    try {
      await player.disconnect();
    } catch {
      // Ignore disconnect errors
    }

    console.log("[cleanupPlayer] Cleanup sequence completed");
  } catch (error) {
    console.error("[cleanupPlayer] Error during cleanup:", error);
  }
};

export default function SongSegmentEditor({ params }: { params: any }) {
  const resolvedParams = use(params);
  const [track, setTrack] = useState<Track | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [player, setPlayer] = useState<any>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    position: 0,
    duration: 0,
  });
  const [deviceId, setDeviceId] = useState<string>("");
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    segmentId: null,
    type: null,
    initialX: 0,
    initialTime: 0,
  });

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Add initialization flag
  const [isInitializing, setIsInitializing] = useState(false);
  const initAttempts = useRef(0);
  const maxInitAttempts = 3;

  // Move segments initialization to useEffect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const { segments } = loadTrackData(
        resolvedParams.playlistId,
        resolvedParams.songId
      );
      setSegments(segments);
    }
  }, [resolvedParams.playlistId, resolvedParams.songId]);

  const [trackBPM, setTrackBPM] = useState<TrackBPM>(() => {
    if (typeof window === "undefined") {
      return { tempo: 128, isManual: true };
    }

    // Try to load from storage first
    const storedBPM = TrackStorage.bpm.load(
      resolvedParams.playlistId,
      resolvedParams.songId
    );
    
    if (storedBPM) {
      console.log("[BPM Init] Using stored BPM:", storedBPM);
      return {
        tempo: storedBPM.tempo,
        isManual: storedBPM.isManual
      };
    }

    return { tempo: 128, isManual: true };
  });

  // Add an effect to handle BPM updates
  useEffect(() => {
    if (!track) return;

    const saveBPM = () => {
      console.log("[BPM Save] Saving BPM:", trackBPM);
      TrackStorage.bpm.save(
        resolvedParams.playlistId,
        resolvedParams.songId,
        trackBPM.tempo,
        trackBPM.isManual
      );
    };

    saveBPM();
  }, [trackBPM, resolvedParams.playlistId, resolvedParams.songId, track]);

  // Update the BPM input handler
  const handleBPMChange = (newBPM: number) => {
    console.log("[BPM Change] New BPM:", newBPM);
    setTrackBPM({
      tempo: newBPM,
      isManual: true
    });
  };


  // Update the cleanup function
  const cleanup = useCallback((
    player: any,
    deviceId: string,
    progressInterval: React.MutableRefObject<NodeJS.Timeout | null>,
    setPlaybackState: React.Dispatch<React.SetStateAction<PlaybackState>>,
    setPlayer: React.Dispatch<React.SetStateAction<any>>,
    setDeviceId: React.Dispatch<React.SetStateAction<string>>,
    setIsPlayerReady: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!player) return;

    console.log("[Player Cleanup] Starting cleanup");
    
    // Clear intervals first
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    // Remove listeners
    player.removeListener('ready');
    player.removeListener('not_ready');
    player.removeListener('player_state_changed');
    player.removeListener('initialization_error');
    player.removeListener('authentication_error');
    player.removeListener('account_error');
    player.removeListener('playback_error');

    // Disconnect player
    player.disconnect();

    // Reset states
    setPlaybackState({
      isPlaying: false,
      position: 0,
      duration: 0,
    });
    setPlayer(null);
    setDeviceId("");
    setIsPlayerReady(false);
    
    console.log("[Player Cleanup] Cleanup completed");
  }, []);

  // Update the player initialization effect
  useEffect(() => {
    if (isInitializing || initAttempts.current >= maxInitAttempts) return;

    const initializePlayer = async () => {
      try {
        setIsInitializing(true);
        console.log("[Player Init] Starting initialization");

        // Set up the callback before loading the script
        window.onSpotifyWebPlaybackSDKReady = () => {
          console.log("[Player Init] SDK Ready");
          if (!window.Spotify || player) return;

          const token = SpotifyAuthStorage.load();
          if (!token) {
            router.push("/");
            return;
          }

          const newPlayer = new window.Spotify.Player({
            name: 'Workout Builder Web Player',
            getOAuthToken: cb => cb(token),
          });

          // Add all event listeners
          newPlayer.addListener('initialization_error', ({ message }) => {
            console.error("[Player Error] Initialization failed:", message);
            setIsInitializing(false);
            initAttempts.current++;
          });

          newPlayer.addListener('authentication_error', ({ message }) => {
            console.error("[Player Error] Authentication failed:", message);
            setIsInitializing(false);
            router.push("/");
          });

          newPlayer.addListener('ready', ({ device_id }) => {
            console.log("[Player Init] Ready with device ID:", device_id);
            setDeviceId(device_id);
            setIsPlayerReady(true);
            setIsInitializing(false);
          });

          newPlayer.addListener('not_ready', ({ device_id }) => {
            console.log("[Player Warning] Device ID has gone offline:", device_id);
            setIsPlayerReady(false);
          });

          newPlayer.addListener('player_state_changed', (state: any) => {
            if (!state) return;

            console.log("[Player State] State changed:", state);
            setPlaybackState((prev) => {
              const newPosition = state.position;
              const startTime = Date.now() - newPosition;

              // Clear existing interval
              if (progressInterval.current) {
                clearInterval(progressInterval.current);
                progressInterval.current = null;
              }

              // Set up new interval if playing
              if (!state.paused) {
                progressInterval.current = setInterval(() => {
                  const position = Date.now() - startTime;
                  if (position <= state.duration) {
                    setPlaybackState(prev => ({
                      ...prev,
                      position: position,
                    }));
                  }
                }, 50);
              }

              return {
                ...prev,
                isPlaying: !state.paused,
                position: newPosition,
                duration: state.duration,
                hasStarted: true,
                track_window: {
                  current_track: {
                    id: state.track_window?.current_track?.id,
                  },
                },
              };
            });
          });

          newPlayer.connect().then(() => {
            console.log("[Player Init] Connected successfully");
            setPlayer(newPlayer);
          }).catch(error => {
            console.error("[Player Init] Connection failed:", error);
            setIsInitializing(false);
            initAttempts.current++;
          });
        };

        // Only load the script if it's not already loaded
        if (!window.Spotify && !isScriptLoaded) {
          const script = document.createElement("script");
          script.src = "https://sdk.scdn.co/spotify-player.js";
          script.async = true;
          
          script.onload = () => {
            console.log("[Player Init] Script loaded");
            setIsScriptLoaded(true);
          };

          document.body.appendChild(script);
        } else if (window.Spotify) {
          // If Spotify is already available, trigger the callback manually
          window.onSpotifyWebPlaybackSDKReady();
        }

      } catch (error) {
        console.error("[Player Init] Error during initialization:", error);
        setIsInitializing(false);
        initAttempts.current++;
      }
    };

    initializePlayer();

    return () => {
      if (player) {
        cleanup(
          player,
          deviceId,
          progressInterval,
          setPlaybackState,
          setPlayer,
          setDeviceId,
          setIsPlayerReady
        );
      }
    };
  }, [isScriptLoaded]);

  // Update track loading effect
  useEffect(() => {
    const fetchTrack = async () => {
      console.log("[Track Load] Starting fetch:", {
        songId: resolvedParams.songId,
      });
      
      try {
        const accessToken = SpotifyAuthStorage.load();
        if (!accessToken) {
          router.push("/");
          return;
        }

        const response = await fetch(
          `https://api.spotify.com/v1/tracks/${resolvedParams.songId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch track");
        }

        const data = await response.json();
        setTrack(data);

        // Try to load BPM from storage first
        const storedBPM = TrackStorage.bpm.load(
          resolvedParams.playlistId,
          data.id
        );
        if (storedBPM) {
          console.log("[Track Load] Using stored BPM:", storedBPM);
          setTrackBPM({
            tempo: storedBPM.tempo,
            isManual: storedBPM.isManual,
          });
        } else {
          // If no stored BPM, extract from sources
          console.log("[Track Load] No stored BPM, extracting from sources");
          const bpmData = await getBPMFromSources(data, resolvedParams.playlistId);
          setTrackBPM({
            tempo: bpmData.bpm,
            isManual: bpmData.source === "manual",
          });
        }
      } catch (error) {
        console.error("[Track Load] Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrack();
  }, [resolvedParams.songId, resolvedParams.playlistId, router]);

  // Update the save effect
  useEffect(() => {
    if (!track || !trackBPM) return;
    
    console.log("[Save Effect] Saving track data:", {
      trackId: track.id,
      segments: segments.length,
      bpm: trackBPM.tempo, // Log just the tempo value
    });
    
    // Debounce the save to prevent too many writes
    const timeoutId = setTimeout(() => {
      saveTrackData(resolvedParams.playlistId, track.id, segments, trackBPM);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [segments, track, resolvedParams.playlistId, trackBPM]);

  // Update the addSegment function
  const addSegment = () => {
    console.log("[Add Segment] Current position:", playbackState.position);

    // Sort segments by start time
    const sortedSegments = [...segments].sort(
      (a, b) => a.startTime - b.startTime
    );

    // Default segment duration (30 seconds)
    const defaultDuration = 30000;
    let startTime: number;

    if (sortedSegments.length > 0) {
      // If we have segments, add after the last one
      const lastSegment = sortedSegments[sortedSegments.length - 1];
      startTime = lastSegment.endTime;
    } else {
      // If no segments, start at current position
      startTime = playbackState.position;
    }

    // Calculate end time
    const endTime = Math.min(
      startTime + defaultDuration,
      track?.duration_ms || 0
    );

    console.log("[Add Segment] Calculated times:", {
      startTime,
      endTime,
      trackDuration: track?.duration_ms,
    });

    // Check if we have enough space (minimum 5 seconds)
    const minDuration = 5000;
    if (endTime - startTime < minDuration) {
      console.warn("[Add Segment] Not enough space for new segment:", {
        available: endTime - startTime,
        minimum: minDuration,
      });
      return;
    }

    const newSegment: Segment = {
        id: crypto.randomUUID(),
        startTime,
      endTime,
        title: `Segment ${segments.length + 1}`,
      type: "SEATED_ROAD",
      intensity: 75,
    };

    console.log("[Add Segment] Adding new segment:", newSegment);
    setSegments((prev) => [...prev, newSegment]);

    // Move playback position to the start of the new segment
    if (player) {
      player.seek(startTime);
      setPlaybackState((prev) => ({
        ...prev,
        position: startTime,
      }));
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const togglePlayback = async () => {
    if (!player || !track || !deviceId || !isPlayerReady) return;

    const accessToken = SpotifyAuthStorage.load();
    if (!accessToken) return;

    try {
      if (!playbackState.isPlaying) {
        await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            method: "PUT",
          headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [`spotify:track:${track.id}`],
            position_ms: playbackState.position,
          }),
          }
        );
        
        // Wait a short moment for the player to update
        await new Promise((resolve) => setTimeout(resolve, 100));
        await player.resume();
        
        setPlaybackState((prev) => ({
          ...prev,
          isPlaying: true,
        }));
      } else {
        await player.pause();
        
        setPlaybackState((prev) => ({
          ...prev,
          isPlaying: false,
        }));
        
        // Clear interval when paused
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      }
    } catch (error) {
      console.error("Playback error:", error);
    }
  };

  const handleSeek = useCallback(
    (position: number) => {
      if (!player || !isPlayerReady) return;

    // Ensure position is within bounds
      const boundedPosition = Math.max(
        0,
        Math.min(position, track?.duration_ms || 0)
      );

      player
        .seek(boundedPosition)
        .then(() => {
          setPlaybackState((prev) => ({
        ...prev,
            position: boundedPosition,
          }));
        })
        .catch((error) => {
          console.error("Seek error:", error);
        });
    },
    [player, isPlayerReady, track?.duration_ms]
  );

  const handleDragStart = (
    e: React.MouseEvent,
    segmentId: string,
    type: "start" | "end"
  ) => {
    const segment = segments.find((s) => s.id === segmentId);
    if (!segment) return;

    setDragState({
      segmentId,
      type,
      initialX: e.clientX,
      initialTime: type === "start" ? segment.startTime : segment.endTime,
    });
  };

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.segmentId || !track || !timelineRef.current) return;

      const segment = segments.find((s) => s.id === dragState.segmentId);
      if (!segment) return;

      const timelineRect = timelineRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragState.initialX;
      const msPerPixel = track.duration_ms / timelineRect.width;
      const deltaTime = deltaX * msPerPixel;

      let updatedTime = Math.max(0, Math.min(track.duration_ms, dragState.initialTime + deltaTime));

      // Find adjacent segments for bounds checking
      const sortedSegments = segments
        .filter(s => s.id !== segment.id)
        .sort((a, b) => a.startTime - b.startTime);

      const prevSegment = sortedSegments.filter(s => s.endTime <= segment.startTime).pop();
      const nextSegment = sortedSegments.filter(s => s.startTime >= segment.endTime).shift();

      if (dragState.type === "start") {
        // When dragging start, ensure we don't overlap with previous segment
        // and maintain minimum segment duration
        const minTime = prevSegment ? prevSegment.endTime : 0;
        const maxTime = segment.endTime - 1000; // Minimum 1 second duration
        updatedTime = Math.max(minTime, Math.min(maxTime, updatedTime));

        setSegments(prev =>
          prev.map(s =>
            s.id === segment.id ? { ...s, startTime: updatedTime } : s
          )
        );
      } else {
        // When dragging end, ensure we don't overlap with next segment
        // and maintain minimum segment duration
        const minTime = segment.startTime + 1000; // Minimum 1 second duration
        const maxTime = nextSegment ? nextSegment.startTime : track.duration_ms;
        updatedTime = Math.max(minTime, Math.min(maxTime, updatedTime));

        setSegments(prev =>
          prev.map(s =>
            s.id === segment.id ? { ...s, endTime: updatedTime } : s
          )
        );
      }
    },
    [dragState, segments, track, timelineRef]
  );

  // Add drag cleanup
  useEffect(() => {
    if (!dragState.segmentId) return;

    const handleMouseUp = () => {
      setDragState({
        segmentId: null,
        type: null,
        initialX: 0,
        initialTime: 0,
      });
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.segmentId, handleDragMove]);

  // Update the BPM extraction effect
  useEffect(() => {
    const fetchBPM = async () => {
      if (!track) return;

      const bpmData = await getBPMFromSources(track, resolvedParams.playlistId);
      setTrackBPM({ 
        tempo: bpmData.bpm, 
        isManual: bpmData.source === "manual",
      });
    };

    fetchBPM();
  }, [track?.id, resolvedParams.playlistId]); // Use track.id instead of whole track object

  // Add intensity label function
  const getIntensityLabel = (intensity: number) => {
    if (intensity === -1) return "BURN";
    return `${intensity}%`;
  };

  useEffect(() => {
    if (isIOS() || isSafari()) {
      // Show alternative playback message
      alert("iOS/Safari users: Please ensure Spotify is playing on another device. This app will control that device.");
    }
    // ... rest of your initialization code
  }, []);

  // Update the cleanup effect
  useEffect(() => {
    const currentPlayer = player;
    const currentDeviceId = deviceId;

    return () => {
      if (currentPlayer) {
        cleanupPlayer(
          currentPlayer,
          currentDeviceId,
          progressInterval,
          setPlaybackState,
          setPlayer,
          setDeviceId,
          setIsPlayerReady
        ).catch(console.error);
      }
    };
  }, []); // Empty dependency array to ensure cleanup only runs on unmount

  // Update the stop functionality
  const handleStop = async () => {
    if (!player || !isPlayerReady) return;

    try {
      console.log("[Player] Stopping playback");
      
      // First pause playback
      await player.pause();
      
      // Then seek to beginning
      await player.seek(0);
      
      // Update state
      setPlaybackState((prev) => ({
        ...prev,
        isPlaying: false,
        position: 0,
      }));

      // Clear any existing progress interval
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    } catch (error) {
      console.error("[Player] Stop error:", error);
    }
  };

  // Update the back button handler
  const handleBackToPlaylist = async () => {
    try {
      // First stop playback
      if (player && isPlayerReady) {
        await handleStop();
      }
      
      // Then clean up the player
      if (player) {
        await cleanupPlayer(
          player,
          deviceId,
          progressInterval,
          setPlaybackState,
          setPlayer,
          setDeviceId,
          setIsPlayerReady
        );
      }

      // Finally navigate back
      router.push(`/workout-builder/${resolvedParams.playlistId}`);
    } catch (error) {
      console.error("[Navigation] Error returning to playlist:", error);
      // Navigate anyway even if cleanup fails
      router.push(`/workout-builder/${resolvedParams.playlistId}`);
    }
  };

  const splitSegmentAtCurrentPosition = () => {
    if (!playbackState.position) return;

    // Find the segment that contains the current position
    const currentSegment = segments.find(
      segment => 
        playbackState.position >= segment.startTime && 
        playbackState.position < segment.endTime
    );

    if (!currentSegment) return;

    // Create two new segments from the split
    const firstHalf: Segment = {
      ...currentSegment,
      id: uuidv4(),
      endTime: playbackState.position
    };

    const secondHalf: Segment = {
      ...currentSegment,
      id: uuidv4(),
      startTime: playbackState.position
    };

    // Replace the original segment with the two new segments
    setSegments(prev => [
      ...prev.filter(s => s.id !== currentSegment.id),
      firstHalf,
      secondHalf
    ]);
  };

  // Add these handlers in the SongSegmentEditor component
  const handleNextSegment = useCallback(() => {
    if (!segments.length) return;

    const sortedSegments = [...segments].sort((a, b) => a.startTime - b.startTime);
    const currentIndex = sortedSegments.findIndex(
      segment => playbackState.position >= segment.startTime && playbackState.position < segment.endTime
    );

    const nextSegment = sortedSegments[currentIndex + 1] || sortedSegments[0];
    if (nextSegment) {
      handleSeek(nextSegment.startTime);
    }
  }, [segments, playbackState.position, handleSeek]);

  const handlePreviousSegment = useCallback(() => {
    if (!segments.length) return;

    const sortedSegments = [...segments].sort((a, b) => a.startTime - b.startTime);
    const currentIndex = sortedSegments.findIndex(
      segment => playbackState.position >= segment.startTime && playbackState.position < segment.endTime
    );

    const prevSegment = sortedSegments[currentIndex - 1] || sortedSegments[sortedSegments.length - 1];
    if (prevSegment) {
      handleSeek(prevSegment.startTime);
    }
  }, [segments, playbackState.position, handleSeek]);

  if (loading || !track) {
    return (
      <LoadingState
      songId={resolvedParams.songId} 
      playlistId={resolvedParams.playlistId} 
      />
    );
  }

  // Add this before the return statement to calculate current and next segments
  const { currentSegment, nextSegment } = getCurrentAndNextSegment(
    playbackState.position,
    segments
  );

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      {/* Top bar with header and workout display */}
      <div className="flex-none border-b border-white/10">
        {/* Header row */}
        <div className="p-4 flex items-center gap-4">
          <button 
            onClick={handleBackToPlaylist}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">{track.name}</h1>
            <p className="text-sm text-gray-400">
              {track.artists.map(a => a.name).join(", ")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">BPM</span>
              <input
                type="number"
                value={trackBPM.tempo}
                onChange={(e) => handleBPMChange(parseInt(e.target.value))}
                className="w-16 bg-white/5 rounded px-2 py-1 text-sm"
              />
            </div>
            <span className="text-sm text-gray-400">
              {formatDuration(track.duration_ms)}
            </span>
          </div>
        </div>

        {/* Workout display when playing */}
        {playbackState.isPlaying && (
          <div className="bg-black/20 p-4">
            <div className="flex gap-4 items-stretch">
              <WorkoutDisplay segment={currentSegment} />
              <BeatCountdown 
                currentPosition={playbackState.position}
                nextSegmentStart={nextSegment?.startTime ?? track.duration_ms}
                bpm={trackBPM.tempo}
                nextSegment={nextSegment}
              />
              <WorkoutDisplay segment={nextSegment} isNext />
            </div>
            {/* Segment progress */}
            {currentSegment && (
              <div className="h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white/50 transition-all duration-1000"
                  style={{ 
                    width: `${((playbackState.position - currentSegment.startTime) /
                      (currentSegment.endTime - currentSegment.startTime)) * 100}%` 
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel with player controls and timeline */}
        <div className="flex-1 p-4 flex flex-col gap-4">
          {/* Transport controls */}
          <div className="bg-white/5 rounded-lg p-4">
            <TransportControls
              isPlaying={playbackState.isPlaying}
              position={playbackState.position}
              duration={track.duration_ms}
              onPlay={togglePlayback}
              onStop={handleStop}
              onNextSegment={handleNextSegment}
              onPreviousSegment={handlePreviousSegment}
              isReady={isPlayerReady}
            />
          </div>

          {/* BPM visualization and timeline */}
          <div className="bg-white/5 rounded-lg p-4 flex-1 flex flex-col gap-4">
            {trackBPM && (
              <BPMVisualization 
                bpm={trackBPM.tempo} 
                duration={track.duration_ms}
                currentPosition={playbackState.position}
                isPlaying={playbackState.isPlaying}
                onSeek={handleSeek}
              />
            )}
            <Timeline
              ref={timelineRef}
              segments={segments}
              track={track}
              playbackState={playbackState}
              trackBPM={trackBPM}
              onDragStart={handleDragStart}
              formatDuration={formatDuration}
            />
            <CurrentSegmentEditor
              segment={currentSegment}
              onSegmentChange={(updates) => {
                if (!currentSegment) return;
                setSegments(prev =>
                  prev.map(s =>
                    s.id === currentSegment.id ? { ...s, ...updates } : s
                  )
                );
              }}
              track={track}
              formatDuration={formatDuration}
            />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-96 border-l border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-semibold">Segments</h2>
            <div className="flex gap-2">
              <Button 
                onClick={splitSegmentAtCurrentPosition}
                className="bg-white/10 hover:bg-white/20"
                disabled={!playbackState.position || !segments.some(
                  segment => 
                    playbackState.position >= segment.startTime && 
                    playbackState.position < segment.endTime
                )}
                size="sm"
              >
                Split
              </Button>
              <Button 
                onClick={addSegment}
                className="bg-white/10 hover:bg-white/20"
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <SegmentEditor
              segments={segments}
              onSegmentsChange={setSegments}
              track={track}
            />
          </div>
        </div>
      </div>
    </div>
  );
}