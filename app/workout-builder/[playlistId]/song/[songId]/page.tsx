/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowLeftIcon,
} from "@radix-ui/react-icons";
import { TrackStorage } from '../../../../utils/storage/TrackStorage';
import { SpotifyAuthStorage } from '../../../../utils/storage/SpotifyAuthStorage';
import Image from 'next/image';
import { BPMVisualization } from "../../components/BPMVisualization";
import { WorkoutDisplay } from "../../components/WorkoutDisplay";
import { getIntensityColor } from '../../utils';
import { WORKOUT_LABELS, SEGMENT_COLORS } from '../../constants';

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

// Add formatDuration helper function
const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

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

// Add this for the metronome sound
const useMetronomeSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for metronome
    audioRef.current = new Audio("/click.mp3"); // Add a click.mp3 to your public folder
    audioRef.current.volume = 0.5;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return {
    play: () => audioRef.current?.play(),
  };
};

// Update the BeatCountdown component
const BeatCountdown = ({ 
  currentPosition, 
  nextSegmentStart, 
  bpm,
  nextSegment,
}: {
  currentPosition: number;
  nextSegmentStart: number;
  bpm: number;
  nextSegment?: Segment;
}) => {
  const { play } = useMetronomeSound();
  const [smoothPosition, setSmoothPosition] = useState(currentPosition);
  const lastUpdateTime = useRef(Date.now());
  const animationFrameRef = useRef<number | null>(null);
  
  // Smooth position update using requestAnimationFrame
  useEffect(() => {
    const updatePosition = () => {
      const now = Date.now();
      const delta = now - lastUpdateTime.current;
      lastUpdateTime.current = now;

      setSmoothPosition((prev) => {
        const newPosition = prev + delta;
        // Reset if we're too far off from the actual position
        if (Math.abs(newPosition - currentPosition) > 1000) {
          return currentPosition;
        }
        return newPosition;
      });
      
      animationFrameRef.current = requestAnimationFrame(updatePosition);
    };
    
    animationFrameRef.current = requestAnimationFrame(updatePosition);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentPosition]);

  const beatDuration = 60000 / bpm;
  const currentBeat = Math.floor(smoothPosition / beatDuration);
  const nextSegmentBeat = Math.floor(nextSegmentStart / beatDuration);
  const beatsUntilNext = nextSegmentBeat - currentBeat;
  
  // Play click on each beat change
  const lastBeatRef = useRef(currentBeat);
  useEffect(() => {
    if (currentBeat !== lastBeatRef.current) {
      play();
      lastBeatRef.current = currentBeat;
    }
  }, [currentBeat, play]);

  return (
    <div className="flex-1 max-w-[300px] bg-white/10 rounded-lg p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={`absolute w-64 h-64 rounded-full border-4 opacity-20
            ${
              beatsUntilNext <= 4
                ? "border-yellow-400"
                : beatsUntilNext <= 8
                ? "border-orange-400"
                : "border-white"
            }
            animate-ping-slow
          `}
        />
        <div 
          className={`absolute w-48 h-48 rounded-full border-2 opacity-30
            ${
              beatsUntilNext <= 4
                ? "border-yellow-400"
                : beatsUntilNext <= 8
                ? "border-orange-400"
                : "border-white"
            }
            animate-spin-slow
          `}
        />
      </div>

      {/* Beat pulse animation */}
      <div 
        className="absolute inset-0 bg-white/5"
        style={{
          animation: "beatPulse 60s linear infinite",
          animationDuration: `${beatDuration}ms`,
        }}
      />

      {/* Content */}
      <div className="relative text-center z-10">
        <div 
          className={`text-8xl font-bold font-mono mb-2
            ${
              beatsUntilNext <= 4
                ? "text-yellow-400 scale-pulse"
                : beatsUntilNext <= 8
                ? "text-orange-400"
                : "text-white"
            }
            transition-all duration-300
          `}
        >
          {beatsUntilNext}
        </div>
        <div className="text-xl text-gray-400 mb-4">
          {formatDuration(nextSegmentStart - currentPosition)} left
        </div>
        {nextSegment && (
          <div 
            className={`text-lg ${
              SEGMENT_COLORS[nextSegment.type]
            } px-3 py-1 rounded-full
              backdrop-blur-sm bg-opacity-50 shadow-glow
            `}
          >
            Next: {WORKOUT_LABELS[nextSegment.type]}
          </div>
        )}
      </div>
    </div>
  );
};

// Update the TransportControls component
const TransportControls = ({
  isPlaying,
  position,
  duration,
  onPlay,
  onStop,
  onSeek,
  isReady,
}: {
  isPlaying: boolean;
  position: number;
  duration: number;
  onPlay: () => void;
  onStop: () => void;
  onSeek: (position: number) => void;
  isReady: boolean;
}) => {
  // Add dragging state for the progress bar
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(position);
  const progressRef = useRef<HTMLDivElement>(null);

  const handleStartDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = progressRef.current?.getBoundingClientRect();
    if (rect) {
      const percent = (e.clientX - rect.left) / rect.width;
      setDragPosition(percent * duration);
    }
  };

  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );
    setDragPosition(percent * duration);
  }, [isDragging, duration, progressRef]);

  const handleEndDrag = useCallback(() => {
    if (isDragging) {
      onSeek(dragPosition);
      setIsDragging(false);
    }
  }, [isDragging, dragPosition, onSeek]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDrag);
      window.addEventListener("mouseup", handleEndDrag);
      return () => {
        window.removeEventListener("mousemove", handleDrag);
        window.removeEventListener("mouseup", handleEndDrag);
      };
    }
  }, [isDragging, handleDrag, handleEndDrag]);

  // Update dragPosition when not dragging
  useEffect(() => {
    if (!isDragging) {
      setDragPosition(position);
    }
  }, [position]);

  return (
    <div className="flex items-center gap-4 bg-black/20 p-4 rounded-lg">
      <div className="flex gap-2">
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full w-10 h-10"
          onClick={onPlay}
          disabled={!isReady}
        >
          {!isReady ? (
            <div className="animate-spin h-4 w-4 border-2 border-white/50 rounded-full border-t-transparent" />
          ) : isPlaying ? (
            <PauseIcon className="w-5 h-5" />
          ) : (
            <PlayIcon className="w-5 h-5" />
          )}
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full w-10 h-10"
          onClick={onStop}
          disabled={!isReady}
        >
          <StopIcon className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex items-center gap-2">
        <div className="text-sm font-mono">
          {formatDuration(isDragging ? dragPosition : position)}
        </div>
        <div 
          ref={progressRef}
          className="flex-1 h-2 bg-white/10 rounded-full cursor-pointer group"
          onMouseDown={handleStartDrag}
        >
          <div 
            className="h-full bg-white/50 rounded-full relative"
            style={{
              width: `${
                ((isDragging ? dragPosition : position) / duration) * 100
              }%`,
            }}
          >
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full 
              opacity-0 group-hover:opacity-100 transition-opacity" 
            />
          </div>
        </div>
        <div className="text-sm font-mono">{formatDuration(duration)}</div>
        </div>
      </div>
  );
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

// Add these helper functions at the top level
const timeToMs = (timeStr: string): number | null => {
  if (!timeStr || !timeStr.includes(":")) return null;

  try {
    const [minutes, seconds] = timeStr.split(":").map(Number);

    if (
      isNaN(minutes) ||
      isNaN(seconds) ||
      seconds >= 60 ||
      minutes < 0 ||
      seconds < 0
    ) {
      return null;
    }

    return (minutes * 60 + seconds) * 1000;
  } catch (error) {
    console.error("Error converting time to ms:", error);
    return null;
  }
};

const msToTimeStr = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

// Update the SegmentTimeInput component
const SegmentTimeInput = ({
  value,
  onChange,
  label,
  max,
  segments,
  segmentId,
  isStart,
}: {
  value: number;
  onChange: (time: number) => void;
  label: string;
  max: number;
  segments: Segment[];
  segmentId: string;
  isStart: boolean;
}) => {
  const [timeStr, setTimeStr] = useState(msToTimeStr(value));
  const [error, setError] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    setTimeStr(msToTimeStr(value));
  }, [value]);

  const validateTime = (newMs: number | null): boolean => {
    if (newMs === null) return false;

    // Find adjacent segments
    const currentSegment = segments.find((s) => s.id === segmentId);
    if (!currentSegment) return false;

    const otherSegments = segments
      .filter((s) => s.id !== segmentId)
      .sort((a, b) => a.startTime - b.startTime);

    if (isStart) {
      // For start time
      const prevSegment = otherSegments
        .filter((s) => s.endTime <= currentSegment.endTime)
        .pop();

      const minTime = prevSegment ? prevSegment.endTime : 0;
      const maxTime = currentSegment.endTime - 1000;

      return newMs >= minTime && newMs <= maxTime;
    } else {
      // For end time
      const nextSegment = otherSegments
        .filter((s) => s.startTime >= currentSegment.startTime)
        .shift();

      const minTime = currentSegment.startTime + 1000;
      const maxTime = nextSegment ? nextSegment.startTime : max;

      return newMs >= minTime && newMs <= maxTime;
    }
  };

  const handleChange = (inputStr: string) => {
    setTimeStr(inputStr);

    const newMs = timeToMs(inputStr);
    if (newMs !== null && validateTime(newMs)) {
      onChange(newMs);
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400">{label}</label>
      <input
        type="text"
        pattern="[0-9]{1,2}:[0-9]{2}"
        placeholder="MM:SS"
        className={`bg-white/5 rounded px-2 py-1 w-20 text-sm
          ${error ? "border border-red-500" : ""}`}
        value={timeStr}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => {
          if (error) {
            setTimeStr(msToTimeStr(value));
            setError(false);
          }
        }}
      />
      {error && <div className="text-xs text-red-500">Invalid time</div>}
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

    // 1. First pause playback using both methods
    const token = SpotifyAuthStorage.load();
    if (token) {
      await Promise.all([
        // Pause via API
        fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(console.error),
        // Pause via SDK
        player.pause().catch(console.error)
      ]);
    }

    // 2. Clear all intervals immediately
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    // 3. Remove all event listeners
    player.removeListener('ready');
    player.removeListener('not_ready');
    player.removeListener('player_state_changed');
    player.removeListener('initialization_error');
    player.removeListener('authentication_error');
    player.removeListener('account_error');
    player.removeListener('playback_error');

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
    throw error;
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

  // Update the BPMInput component
  const BPMInput = ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (bpm: number) => void;
  }) => {
    const handleBPMChange = (newValue: number) => {
      if (isNaN(newValue)) return;
      
      console.log("[BPM Input] Updating BPM:", {
        oldValue: value,
        newValue,
        track: track?.id,
      });

      onChange(newValue);
      
      // Save immediately when BPM changes
      if (track) {
        TrackStorage.bpm.save(resolvedParams.playlistId, track.id, newValue);
      }
    };

    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="flex items-center gap-4 w-full">
          <input
            type="number"
            min="60"
            max="200"
            value={value}
            onChange={(e) => handleBPMChange(parseInt(e.target.value))}
            className="bg-white/5 rounded px-4 py-3 w-32 text-center text-2xl font-mono"
          />
          <span className="text-xl text-gray-400 font-mono">BPM</span>
        </div>
        <a 
          href={
            track
              ? `https://songbpm.com/@${track.artists[0]?.name
                  .toLowerCase()
                  .replace(/\s+/g, "-")}/${track.name
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`
              : "#"
          }
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:text-blue-300 underline"
        >
          Look up on SongBPM
        </a>
      </div>
    );
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
        
        if (!window.Spotify && !isScriptLoaded) {
          const script = document.createElement("script");
          script.src = "https://sdk.scdn.co/spotify-player.js";
          script.async = true;
          
          script.onload = () => {
            console.log("[Player Init] Script loaded");
            setIsScriptLoaded(true);
          };

          document.body.appendChild(script);
          return;
        }

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

        // Error handling
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
          if (!state) {
            console.log("[Player State] Received empty state");
            return;
          }

          console.log("[Player State] State changed:", {
            position: state.position,
            duration: state.duration,
            paused: state.paused,
            timestamp: Date.now()
          });

          // Update playback state
          setPlaybackState((prev) => {
            const newPosition = state.position;
            const startTime = Date.now() - newPosition;

            console.log("[Position Update] Calculating new position:", {
              newPosition,
              startTime,
              currentInterval: progressInterval.current ? "exists" : "none"
            });

            // Clear existing interval
            if (progressInterval.current) {
              console.log("[Interval] Clearing existing interval");
              clearInterval(progressInterval.current);
              progressInterval.current = null;
            }

            // Set up new interval if playing
            if (!state.paused) {
              console.log("[Interval] Setting up new interval for playing state");
              progressInterval.current = setInterval(() => {
                const position = Date.now() - startTime;
                console.log("[Interval] Updating position:", {
                  position,
                  duration: state.duration,
                  timestamp: Date.now()
                });

                if (position <= state.duration) {
                  setPlaybackState(prev => ({
                    ...prev,
                    position: position,
                  }));
                } else {
                  console.log("[Interval] Position exceeded duration, stopping interval");
                  if (progressInterval.current) {
                    clearInterval(progressInterval.current);
                    progressInterval.current = null;
                  }
                }
              }, 50); // Update every 50ms for smoother progress
            } else {
              console.log("[Player State] Track is paused, not setting up interval");
            }

            const newState = {
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

            console.log("[Player State] New state:", newState);
            return newState;
          });
        });

        await newPlayer.connect();
        setPlayer(newPlayer);
        console.log("[Player Init] Connected successfully");

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

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.segmentId || !timelineRef.current || !track) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragState.initialX;
      const deltaTime = (deltaX / rect.width) * track.duration_ms;
      const segment = segments.find((s) => s.id === dragState.segmentId);

      if (!segment) return;

      let updatedTime = dragState.initialTime + deltaTime;
      const { prev, next } = findAdjacentSegments(segments, segment.id);

      if (dragState.type === "start") {
        const minTime = prev ? prev.endTime : 0;
        const maxTime = segment.endTime - 1000;
        updatedTime = Math.max(minTime, Math.min(maxTime, updatedTime));

        setSegments((prev) =>
          prev.map((s) =>
            s.id === segment.id ? { ...s, startTime: updatedTime } : s
          )
        );
    } else {
        const minTime = segment.startTime + 1000;
        const maxTime = next ? next.startTime : track.duration_ms;
        updatedTime = Math.max(minTime, Math.min(maxTime, updatedTime));

        setSegments((prev) =>
          prev.map((s) =>
            s.id === segment.id ? { ...s, endTime: updatedTime } : s
          )
        );
      }
    },
    [dragState, segments, track]
  );

  const handleDragStart = (
    e: React.MouseEvent,
    segmentId: string,
    type: "start" | "end"
  ) => {
    e.preventDefault();
    const segment = segments.find((s) => s.id === segmentId);
    if (!segment) return;

    setDragState({
      segmentId,
      type,
      initialX: e.clientX,
      initialTime: type === "start" ? segment.startTime : segment.endTime,
    });
  };

  // Update the drag effect dependencies
  useEffect(() => {
    if (!dragState.segmentId || !track) {
      console.log("Drag effect not running:", { dragState, hasTrack: !!track });
      return;
    }

    console.log("Setting up drag effect listeners");

    const handleMouseUp = () => {
      console.log("Mouse up from effect");
      setDragState({
        segmentId: null,
        type: null,
        initialX: 0,
        initialTime: 0,
      });
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      console.log("Cleaning up drag effect listeners");
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState.segmentId, handleDragMove]); // Remove track from dependencies since it's not directly used

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

  if (loading || !track) {
    return (
      <LoadingState
      songId={resolvedParams.songId} 
      playlistId={resolvedParams.playlistId} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-8">
        <div className="w-full">
          {/* Fixed header with song info and BPM */}
          <div className="flex-none bg-black/20 backdrop-blur-sm p-8 border-b border-white/10">
            <div className="w-full">
              <Button
                variant="ghost"
                size="sm"
                className="mb-4 hover:bg-white/10"
                onClick={() =>
                  router.push(`/workout-builder/${resolvedParams.playlistId}`)
                }
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Playlist
              </Button>

              <div className="flex items-start gap-6">
                <div className="flex items-center gap-6">
                  {track.album?.images?.[0] && (
                    <Image
                      src={track.album.images[0].url}
                      alt={track.name}
                      width={48}
                      height={48}
                      className="rounded"
                    />
                  )}
                  <div>
                    <h1 className="text-3xl font-bold">{track.name}</h1>
                    <p className="text-gray-400">
                      {track.artists.map((a) => a.name).join(", ")} •{" "}
                      {formatDuration(track.duration_ms)}
                    </p>
                  </div>
                </div>

                {/* BPM input stays in header */}
                <div className="ml-auto text-center min-w-[300px]">
                  <div className="bg-white/5 px-6 py-4 rounded-lg">
                    <BPMInput 
                      value={trackBPM.tempo}
                      onChange={handleBPMChange}
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-400">
                    {trackBPM.isManual ? "Manual BPM" : "BPM from title"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed workout display with beat counter */}
          {playbackState.isPlaying && (
            <div className="flex-none bg-black/10 backdrop-blur-sm border-b border-white/10">
              <div className="w-full py-4">
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
                            nextSegment?.startTime ?? track.duration_ms
                          }
                          bpm={trackBPM.tempo}
                          nextSegment={nextSegment}
                        />
                        <WorkoutDisplay segment={nextSegment} isNext />
                      </>
                    );
                  })()}
                </div>
                {/* Progress bar for current segment */}
                {(() => {
                  const { currentSegment } = getCurrentAndNextSegment(
                    playbackState.position,
                    segments
                  );
                  if (!currentSegment) return null;

                  const segmentProgress =
                    ((playbackState.position - currentSegment.startTime) /
                      (currentSegment.endTime - currentSegment.startTime)) *
                    100;

                  return (
                    <div className="h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white/50 transition-all duration-1000"
                        style={{ width: `${segmentProgress}%` }}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Scrollable content area */}
          <div className="flex-1 min-h-0">
            <div className="h-full overflow-y-auto">
              <div className="w-full py-8">
                <div className="bg-white/5 rounded-lg p-6 space-y-6">
                  {/* Transport controls */}
                  <TransportControls
                    isPlaying={playbackState.isPlaying}
                    position={playbackState.position}
                    duration={track.duration_ms}
                    onPlay={togglePlayback}
                    onStop={() => {
                      if (player) {
                        player.pause();
                        player.seek(0);
                        setPlaybackState((prev) => ({
                          ...prev,
                          isPlaying: false,
                          position: 0,
                        }));
                      }
                    }}
                    onSeek={handleSeek}
                    isReady={isPlayerReady}
                  />

                  {/* Timeline controls */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-semibold">Segments</h2>
                    </div>
                    <Button onClick={addSegment}>Add Segment</Button>
                  </div>

                  {/* BPM visualization */}
                  {trackBPM && (
                    <BPMVisualization 
                      bpm={trackBPM.tempo} 
                      duration={track.duration_ms}
                      currentPosition={playbackState.position}
                      isPlaying={playbackState.isPlaying}
                    />
                  )}

                  {/* Timeline */}
                  <div 
                    ref={timelineRef}
                    className="relative h-32 bg-white/10 rounded"
                  >
                    {/* Vertical progress bar */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-20 transition-all duration-100"
                      style={{
                        left: `${
                          (playbackState.position / track.duration_ms) * 100
                        }%`,
                      }}
                    />

                    {/* Beat markers in the timeline */}
                    {trackBPM && (
                      <div className="absolute inset-0 pointer-events-none">
                        {Array.from({
                          length: Math.floor(
                            track.duration_ms / (60000 / trackBPM.tempo)
                          ),
                        }).map((_, i) => {
                          const position =
                            ((i * (60000 / trackBPM.tempo)) / track.duration_ms) *
                            100;
                          const isMeasureStart = i % 4 === 0;
                          const isHalfBeat = i % 2 === 0;
                          
                          return (
                            <div
                              key={`beat-${i}-${position}`}
                              className={`absolute top-0 bottom-0 w-px ${
                                isMeasureStart
                                  ? "bg-white/20"
                                  : isHalfBeat
                                  ? "bg-white/15"
                                  : "bg-white/5"
                              }`}
                              style={{ 
                                left: `${position}%`,
                                height: isMeasureStart
                                  ? "100%"
                                  : isHalfBeat
                                  ? "75%"
                                  : "50%",
                              }}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Segments */}
                    {segments
                      .sort((a, b) => a.startTime - b.startTime)
                      .map((segment) => {
                        const isCurrentSegment =
                          playbackState.isPlaying &&
                          playbackState.position >= segment.startTime && 
                          playbackState.position < segment.endTime;

                        return (
                          <div
                            key={segment.id}
                            className={`absolute h-full group
                              transition-all duration-300
                              ${getIntensityColor(segment.intensity)}
                              ${
                                isCurrentSegment
                                  ? "ring-2 ring-white ring-offset-2 ring-offset-black/50 z-10"
                                  : ""
                              }
                            `}
                            style={{
                              left: `${
                                (segment.startTime / track.duration_ms) * 100
                              }%`,
                              width: `${
                                ((segment.endTime - segment.startTime) /
                                  track.duration_ms) *
                                100
                              }%`,
                            }}
                          >
                            {/* Drag handles remain the same */}
                            <div 
                              className="absolute left-0 top-0 bottom-0 w-2 bg-white/20 cursor-ew-resize 
                                hover:bg-white/60 group-hover:bg-white/40 transition-colors"
                              onMouseDown={(e) =>
                                handleDragStart(e, segment.id, "start")
                              }
                            >
                              <div className="h-8 w-1 bg-white/60 rounded hidden group-hover:block" />
                            </div>
                            <div 
                              className="absolute right-0 top-0 bottom-0 w-2 bg-white/20 cursor-ew-resize 
                                hover:bg-white/60 group-hover:bg-white/40 transition-colors"
                              onMouseDown={(e) =>
                                handleDragStart(e, segment.id, "end")
                              }
                            >
                              <div className="h-8 w-1 bg-white/60 rounded hidden group-hover:block" />
                            </div>

                            {/* Time indicators while dragging */}
                            {dragState.segmentId === segment.id && (
                              <div className="absolute -top-6 left-0 right-0 text-xs text-white/90 flex justify-between px-1">
                                <span>{formatDuration(segment.startTime)}</span>
                                <span>{formatDuration(segment.endTime)}</span>
                              </div>
                            )}

                            <div
                              className={`p-2 text-xs ${
                                isCurrentSegment ? "text-white" : ""
                              }`}
                            >
                              <div className="font-medium truncate">
                                {segment.title}
                              </div>
                              <div className="opacity-75">
                                {WORKOUT_LABELS[segment.type]} •{" "}
                                {getIntensityLabel(segment.intensity)}
                              </div>
                              <div>
                                {formatDuration(segment.startTime)} -{" "}
                                {formatDuration(segment.endTime)}
                              </div>
                              <div>
                                Duration:{" "}
                                {formatDuration(
                                  segment.endTime - segment.startTime
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Segment List */}
                  <div className="space-y-4">
                    {segments
                      .sort((a, b) => a.startTime - b.startTime)
                      .map((segment) => (
                        <div
                          key={segment.id}
                          className="flex items-center gap-4 bg-white/5 p-4 rounded"
                        >
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              className="bg-white/5 rounded px-2 py-1 text-sm w-full"
                              value={segment.title}
                              placeholder="Segment Title"
                              onChange={(e) => {
                                setSegments(
                                  segments.map((s) =>
                                  s.id === segment.id
                                    ? { ...s, title: e.target.value }
                                    : s
                                  )
                                );
                              }}
                            />
                            <div className="flex items-center gap-4">
                              <SegmentTimeInput
                                label="Start Time"
                                value={segment.startTime}
                                min={0}
                                max={segment.endTime - 1000}
                                onChange={(newTime) => {
                                  setSegments(
                                    segments.map((s) =>
                                        s.id === segment.id
                                        ? { ...s, startTime: newTime }
                                        : s
                                    )
                                  );
                                }}
                                segments={segments}
                                segmentId={segment.id}
                                isStart={true}
                              />
                              <SegmentTimeInput
                                label="End Time"
                                value={segment.endTime}
                                min={segment.startTime + 1000}
                                max={track?.duration_ms || 0}
                                onChange={(newTime) => {
                                  setSegments(
                                    segments.map((s) =>
                                        s.id === segment.id
                                        ? { ...s, endTime: newTime }
                                          : s
                                    )
                                  );
                                  }}
                                segments={segments}
                                segmentId={segment.id}
                                isStart={false}
                                />
                              <div className="text-sm text-gray-400">
                                Duration:{" "}
                                {msToTimeStr(segment.endTime - segment.startTime)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <select
                              className="bg-white/5 rounded px-3 py-2"
                              value={segment.type}
                              onChange={(e) => {
                                setSegments(
                                  segments.map((s) =>
                                  s.id === segment.id
                                      ? {
                                          ...s,
                                          type: e.target.value as WorkoutType,
                                        }
                                    : s
                                  )
                                );
                              }}
                            >
                              {Object.entries(WORKOUT_LABELS).map(
                                ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                                )
                              )}
                            </select>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-xs text-gray-400">
                                  Intensity
                                </label>
                                <span className="text-sm font-mono">
                                  {segment.intensity === -1
                                    ? "BURN"
                                    : `${segment.intensity}%`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={
                                    segment.intensity === -1
                                      ? 100
                                      : segment.intensity
                                  }
                                  className="w-full h-2 rounded-full bg-white/10 appearance-none cursor-pointer
                                    [&::-webkit-slider-thumb]:appearance-none
                                    [&::-webkit-slider-thumb]:w-4
                                    [&::-webkit-slider-thumb]:h-4
                                    [&::-webkit-slider-thumb]:rounded-full
                                    [&::-webkit-slider-thumb]:bg-white
                                    [&::-webkit-slider-thumb]:cursor-pointer
                                    [&::-webkit-slider-thumb]:transition-all
                                    [&::-webkit-slider-thumb]:hover:scale-110"
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    setSegments(
                                      segments.map((s) =>
                                      s.id === segment.id
                                        ? { ...s, intensity: value }
                                        : s
                                      )
                                    );
                                  }}
                                />
                                <button
                                  className={`px-2 py-1 rounded text-xs font-semibold transition-colors
                                    ${
                                      segment.intensity === -1
                                        ? "bg-red-500 text-white"
                                        : "bg-white/10 hover:bg-white/20"
                                    }`}
                                  onClick={() => {
                                    setSegments(
                                      segments.map((s) =>
                                      s.id === segment.id
                                          ? {
                                              ...s,
                                              intensity:
                                                segment.intensity === -1 ? 75 : -1,
                                            }
                                          : s
                                      )
                                    );
                                  }}
                                >
                                  BURN
                                </button>
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const updatedSegments = segments.filter(
                                (s) => s.id !== segment.id
                              );
                              setSegments(updatedSegments);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
