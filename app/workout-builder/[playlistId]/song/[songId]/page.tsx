/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowLeftIcon,
} from "@radix-ui/react-icons";
import { getStorageKey } from "../../types";
import { BPMStorage } from '../../utils/storage';

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

// Update segment colors
const SEGMENT_COLORS = {
  PLS: "bg-purple-500/50",
  SEATED_ROAD: "bg-blue-500/50",
  SEATED_CLIMB: "bg-green-500/50",
  STANDING_CLIMB: "bg-yellow-500/50",
  STANDING_JOGGING: "bg-orange-500/50",
  JUMPS: "bg-red-500/50",
  WAVES: "bg-pink-500/50",
  PUSHES: "bg-indigo-500/50",
} as const;

// Add workout type labels
const WORKOUT_LABELS: Record<WorkoutType, string> = {
  PLS: "PLS",
  SEATED_ROAD: "SeRo",
  SEATED_CLIMB: "SeCl",
  STANDING_CLIMB: "StCl",
  STANDING_JOGGING: "StJo",
  JUMPS: "Jump",
  WAVES: "Wave",
  PUSHES: "Push",
} as const;

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

// Add this component for the workout display
const WorkoutDisplay = ({ 
  segment, 
  isNext = false,
}: { 
  segment?: Segment;
  isNext?: boolean;
}) => {
  if (!segment) return null;

  return (
    <div
      className={`flex-1 p-6 rounded-lg ${SEGMENT_COLORS[segment.type]} 
      ${isNext ? "opacity-50" : ""} transition-all duration-300`}
    >
      <div className="text-lg font-bold mb-1">
        {isNext ? "Next:" : "Current:"} {segment.title}
      </div>
      <div className="text-2xl font-bold mb-2">
        {WORKOUT_LABELS[segment.type]}
      </div>
      <div className="text-sm opacity-75">
        Duration: {((segment.endTime - segment.startTime) / 1000).toFixed(0)}s
      </div>
    </div>
  );
};

// Add this component for BPM visualization
const BPMVisualization = ({ 
  bpm, 
  duration, 
  currentPosition,
  isPlaying,
}: {
  bpm: number;
  duration: number;
  currentPosition: number;
  isPlaying: boolean;
}) => {
  const beatInterval = 60000 / bpm;
  const totalBeats = Math.floor(duration / beatInterval);
  const currentBeat = Math.floor(currentPosition / beatInterval);
  
  return (
    <div className="relative h-12 mb-4 bg-black/20 rounded">
      {/* BPM Display */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 px-3 py-1 rounded-full text-sm font-mono">
        {Math.round(bpm)} BPM
      </div>
      
      {/* Beat markers */}
      <div className="absolute left-0 right-0 bottom-0 top-0">
        {Array.from({ length: totalBeats }).map((_, i) => {
          const position = ((i * beatInterval) / duration) * 100;
          const isMeasureStart = i % 4 === 0;
          const isHalfBeat = i % 2 === 0; // Check for every second beat
          const isCurrentBeat = i === currentBeat;
          
          return (
            <div
              key={`bpm-beat-${i}-${position}`}
              className={`absolute top-0 bottom-0 w-px transition-opacity
                ${
                  isMeasureStart
                    ? "bg-white/40"
                    : isHalfBeat
                    ? "bg-white/30"
                    : "bg-white/10"
                }
                ${isCurrentBeat && isPlaying ? "animate-pulse" : ""}
              `}
              style={{ 
                left: `${position}%`,
                height: isMeasureStart ? "100%" : isHalfBeat ? "75%" : "50%", // Make half beats taller
                marginTop: "auto",
                marginBottom: "auto",
              }}
            />
          );
        })}
      </div>

      {/* Current position indicator */}
      {isPlaying && (
        <div 
          className={`absolute top-0 bottom-0 w-0.5 bg-white z-10 transition-all duration-100
            ${currentBeat % 2 === 0 ? "opacity-100" : "opacity-50"}`} // Pulse opacity on half beats
          style={{
            left: `${(currentPosition / duration) * 100}%`,
          }}
        />
      )}
    </div>
  );
};

// Add this helper function to try extracting BPM from title
const extractBPMFromTitle = (title: string): number | null => {
  const match = title.match(/\b(\d{2,3})\s*(?:bpm|BPM)\b/);
  if (match) {
    const bpm = parseInt(match[1]);
    if (bpm >= 60 && bpm <= 200) return bpm;
  }
  return null;
};

// Add a helper function for normalizing BPM format
const normalizeBPM = (
  bpm: number | { tempo: number; isManual: boolean } | null
) => {
  if (!bpm) return null;
  
  if (typeof bpm === "number") {
    return {
      tempo: bpm,
      isManual: true,
    };
  }
  
  return bpm;
};

// Update the BPM extraction to use the new storage
const getBPMFromSources = async (track: Track): Promise<SongBPMData> => {
  console.log("[BPM Extract] Starting BPM extraction for track:", track.name);

  // 1. Check localStorage first
  const storedBPM = BPMStorage.load(
    resolvedParams.playlistId,
    track.id
  );
  if (storedBPM) {
    console.log("[BPM Extract] Using stored BPM:", storedBPM);
    return {
      songId: track.id,
      bpm: storedBPM.bpm,
      source: storedBPM.source as "manual" | "title" | "database" | "youtube",
    };
  }

  // 2. Try to extract from title
  const titleBPM = extractBPMFromTitle(track.name);
  if (titleBPM) {
    console.log("[BPM Extract] Found BPM in title:", titleBPM);
    const result = {
      songId: track.id,
      bpm: titleBPM,
      source: "title" as const,
    };
    BPMStorage.save(
      resolvedParams.playlistId,
      track.id,
      titleBPM,
      "title"
    );
    return result;
  }

  // 3. Try YouTube search
  try {
    console.log("[BPM Extract] Searching YouTube for BPM");
    const query = `${track.name} ${track.artists[0].name} BPM`;
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5` +
      `&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
    );

    if (response.ok) {
      const data = await response.json();
      console.log("[BPM Extract] YouTube search results:", data.items.length);
      
      for (const item of data.items) {
        const title = item.snippet.title;
        const description = item.snippet.description;
        
        // Check title first
        const titleMatch = extractBPMFromTitle(title);
        if (titleMatch) {
          console.log("[BPM Extract] Found BPM in YouTube title:", titleMatch);
          BPMStorage.save(
            resolvedParams.playlistId,
            track.id,
            titleMatch,
            "youtube"
          );
          return {
            songId: track.id,
            bpm: titleMatch,
            source: "youtube",
          };
        }

        // Then check description
        const descriptionMatch = extractBPMFromTitle(description);
        if (descriptionMatch) {
          console.log(
            "[BPM Extract] Found BPM in YouTube description:",
            descriptionMatch
          );
          BPMStorage.save(
            resolvedParams.playlistId,
            track.id,
            descriptionMatch,
            "youtube"
          );
          return {
            songId: track.id,
            bpm: descriptionMatch,
            source: "youtube",
          };
        }
      }
      console.log("[BPM Extract] No BPM found in YouTube results");
    }
  } catch (error) {
    console.error("[BPM Extract] YouTube search error:", error);
  }

  // 4. If all else fails, return default
  console.log("[BPM Extract] Using default BPM: 128");
  const defaultBPM = 128;
  BPMStorage.save(
    resolvedParams.playlistId,
    track.id,
    defaultBPM,
    "manual"
  );
  return {
    songId: track.id,
    bpm: defaultBPM,
    source: "manual",
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
  const animationFrameRef = useRef<number>();
  
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

  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );
    setDragPosition(percent * duration);
  };

  const handleEndDrag = () => {
    if (isDragging) {
      onSeek(dragPosition);
      setIsDragging(false);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDrag as any);
      window.addEventListener("mouseup", handleEndDrag);
      return () => {
        window.removeEventListener("mousemove", handleDrag as any);
        window.removeEventListener("mouseup", handleEndDrag);
      };
      }
  }, [isDragging]);

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
  if (typeof window === "undefined") return { segments: [], bpm: null };

  // Load segments
  const segmentsStored = localStorage.getItem(
    getStorageKey(playlistId, songId, "segments")
  );
  const segments = segmentsStored ? JSON.parse(segmentsStored) : [];

  // Load BPM
  const savedBPMs = JSON.parse(localStorage.getItem("savedBPMs") || "{}");
  const bpmValue = savedBPMs[`${playlistId}_${songId}`];
  const bpm = normalizeBPM(bpmValue);

  console.log("[Load Track Data] Loaded data:", {
    segments: segments.length,
    originalBPM: bpmValue,
    normalizedBPM: bpm,
  });

  return { segments, bpm };
};

// Update the saveTrackData function
const saveTrackData = (
  playlistId: string, 
  songId: string, 
  segments: Segment[], 
  bpm: TrackBPM
) => {
  console.log("[Save Track Data] Saving:", {
    playlistId,
    songId,
    segments: segments.length,
    bpm,
  });
  
  try {
    // Save segments
    localStorage.setItem(
      getStorageKey(playlistId, songId, "segments"),
      JSON.stringify(segments)
    );

    // Save BPM as a simple number for compatibility
    const savedBPMs = JSON.parse(localStorage.getItem("savedBPMs") || "{}");
    savedBPMs[`${playlistId}_${songId}`] = bpm.tempo; // Save just the number
    localStorage.setItem("savedBPMs", JSON.stringify(savedBPMs));

    console.log("[Save Track Data] Successfully saved track data and BPM:", {
      bpm: bpm.tempo,
      savedBPMs,
    });
  } catch (error) {
    console.error("[Save Track Data] Error saving track data:", error);
  }
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

export default function SongSegmentEditor({ params }: { params: any }) {
  const resolvedParams = use(params);
  const [track, setTrack] = useState<Track | null>(null);

  // Move segments initialization to useEffect
  const [segments, setSegments] = useState<Segment[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const { segments } = loadTrackData(
        resolvedParams.playlistId,
        resolvedParams.songId
      );
      setSegments(segments);
    }
  }, [resolvedParams.playlistId, resolvedParams.songId]);

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
  const [dragState, setDragState] = useState<DragState>({
    segmentId: null,
    type: null,
    initialX: 0,
    initialTime: 0,
  });
  const timelineRef = useRef<HTMLDivElement>(null);

  // Add state for tracking progress
  const progressInterval = useRef<NodeJS.Timeout>();

  // Update initial BPM state
  const [trackBPM, setTrackBPM] = useState<TrackBPM>(() => {
    if (typeof window === "undefined") {
      console.log("[BPM Init] Window not defined");
      return { tempo: 128, isManual: true };
    }
    
    console.log("[BPM Init] Starting BPM initialization for:", {
      playlistId: resolvedParams.playlistId,
      songId: resolvedParams.songId,
    });
    
    // Try to load from storage first
    const { bpm } = loadTrackData(
      resolvedParams.playlistId,
      resolvedParams.songId
    );
    console.log("[BPM Init] Loaded data:", { bpm });
    
    if (bpm) {
      console.log("[BPM Init] Using stored BPM:", bpm);
      return bpm;
    }

    // If no stored BPM, try to extract from title
    const bpmFromTitle = extractBPMFromTitle(track?.name || "");
    if (bpmFromTitle) {
      console.log("[BPM Init] Using BPM from title:", bpmFromTitle);
      return { tempo: bpmFromTitle, isManual: false };
    }
    
    // Only use 128 if we have no other source
    console.log("[BPM Init] No BPM sources found, using default 128");
    return { tempo: 128, isManual: false };
  });

  // Add logging to setTrackBPM calls
  const wrappedSetTrackBPM = (newBPM: TrackBPM) => {
    console.log("[BPM Update] Setting new BPM:", {
      from: trackBPM,
      to: newBPM,
      stack: new Error().stack,
    });
    setTrackBPM(newBPM);
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
        BPMStorage.save(resolvedParams.playlistId, track.id, newValue, "manual");
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

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!track) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const accessToken = localStorage.getItem("spotify_access_token");
      if (!accessToken) return;

      const spotifyPlayer = new window.Spotify.Player({
        name: "Workout Builder",
        getOAuthToken: (cb: (token: string) => void) => {
          cb(accessToken);
        },
        volume: 0.5,
      });

      spotifyPlayer.addListener(
        "ready",
        ({ device_id }: { device_id: string }) => {
          console.log("Ready with Device ID", device_id);
          setDeviceId(device_id);
          setPlayer(spotifyPlayer);
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
        }
      );

      spotifyPlayer.addListener("player_state_changed", (state) => {
        if (!state) return;

        setPlaybackState((prev) => ({
          ...prev,
          isPlaying: !state.paused,
          position: state.position,
          duration: state.duration,
        }));

        // Clear existing interval
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }

        // Start new interval if playing
        if (!state.paused) {
          progressInterval.current = setInterval(() => {
            setPlaybackState((prev) => ({
              ...prev,
              position: prev.position + 1000,
            }));
          }, 1000);
        }
      });

      spotifyPlayer.connect();
    };

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (player) {
        player.disconnect();
      }
    };
  }, [track]);

  // Update track loading effect
  useEffect(() => {
    const fetchTrack = async () => {
      console.log("[Track Load] Starting fetch:", {
        songId: resolvedParams.songId,
      });
      
      try {
        const accessToken = localStorage.getItem("spotify_access_token");
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
        const storedBPM = BPMStorage.load(
          resolvedParams.playlistId,
          data.id
        );
        if (storedBPM) {
          console.log("[Track Load] Using stored BPM:", storedBPM);
          wrappedSetTrackBPM({
            tempo: storedBPM.bpm,
            isManual: storedBPM.source === "manual",
          });
        } else {
          // If no stored BPM, extract from sources
          console.log("[Track Load] No stored BPM, extracting from sources");
          const bpmData = await getBPMFromSources(data);
          wrappedSetTrackBPM({
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
  }, [resolvedParams.songId, router]);

  // Update the save effect
  useEffect(() => {
    if (!track || !trackBPM) return;
    
    console.log("[Save Effect] Saving track data:", {
      trackId: track.id,
      segments: segments.length,
      bpm: trackBPM,
      trigger: "segments or trackBPM change",
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

    const accessToken = localStorage.getItem("spotify_access_token");
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

  // Also add logging to the useEffect cleanup
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
  }, [dragState.segmentId, handleDragMove, track]);

  // Update the useEffect for BPM extraction
  useEffect(() => {
    const fetchBPM = async () => {
      if (!track) return;

      const bpmData = await getBPMFromSources(track);
      setTrackBPM({ 
        tempo: bpmData.bpm, 
        isManual: bpmData.source === "manual",
      });
    };

    fetchBPM();
  }, [track]);

  // Add intensity color function
  const getIntensityColor = (intensity: number) => {
    if (intensity === -1) return "bg-red-500/50 animate-pulse"; // BURN mode
    if (intensity > 90) return "bg-red-500/50"; // 90-100%
    if (intensity > 75) return "bg-yellow-500/50"; // 75-90%
    if (intensity > 55) return "bg-green-500/50"; // 55-75%
    if (intensity > 25) return "bg-blue-500/50"; // 25-55%
    return "bg-white/50"; // 0-25%
  };

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
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Fixed header with song info and BPM */}
      <div className="flex-none bg-black/20 backdrop-blur-sm p-8 border-b border-white/10">
        <div className="container mx-auto">
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
                <img
                  src={track.album.images[0].url}
                  alt={track.name}
                  className="w-32 h-32 rounded"
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
                  onChange={(bpm) =>
                    setTrackBPM({ tempo: bpm, isManual: true })
                  }
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
          <div className="container mx-auto py-8">
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
  );
} 
