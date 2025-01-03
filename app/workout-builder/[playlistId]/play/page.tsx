"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { use } from "react";
import {
    Play as PlayIcon,
    Pause as PauseIcon,
    SkipBack as SkipBackIcon,
    SkipForward as SkipForwardIcon,
    ArrowLeft as ArrowLeftIcon,
  } from "lucide-react";
import { Track, PlaybackState, TrackBPM, Segment } from "../types";
import { SegmentTimeline } from "../song/[songId]/components/SegmentTimeline";
import { WorkoutDisplay } from "../components/WorkoutDisplay";
import { BPMVisualization } from "../components/BPMVisualization";
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
    Spotify: any;
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

export default function WorkoutPlayer({ params }: { params: any }) {
  const resolvedParams = use(params);
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
  });
  const [deviceId, setDeviceId] = useState<string>("");
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout>();
  const timelineRef = useRef<HTMLDivElement>(null);

  // Track BPM state
  const [trackBPM, setTrackBPM] = useState<TrackBPM>({
    tempo: 128,
    isManual: true,
  });

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
        setDeviceId(device_id);
        setIsPlayerReady(true);
      });

      player.addListener("player_state_changed", (state: any) => {
        if (!state) return;

        setPlaybackState({
          isPlaying: !state.paused,
          position: state.position,
          duration: state.duration,
        });

        // Check if track has ended and play next track
        if (
          state.position === 0 &&
          state.paused &&
          state.track_window?.previous_tracks?.length > 0
        ) {
          playNextTrack();
        }

        // Start progress tracking when playing
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
      });

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

  // Load playlist tracks
  useEffect(() => {
    const loadTracks = async () => {
      try {
        const accessToken = localStorage.getItem("spotify_access_token");
        if (!accessToken) {
          router.push("/");
          return;
        }

        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${resolvedParams.playlistId}/tracks`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch tracks");

        const data = await response.json();
        const configuredTracks = data.items
          .map((item: any) => item.track)
          .filter((track: Track) => {
            const segments = JSON.parse(
              localStorage.getItem(`segments_${track.id}`) || "[]"
            );
            return segments.length > 0;
          });

        setTracks(configuredTracks);

        // Load initial track's segments and BPM
        if (configuredTracks.length > 0) {
          const initialTrack = configuredTracks[0];
          const storedSegments = JSON.parse(
            localStorage.getItem(`segments_${initialTrack.id}`) || "[]"
          );
          setSegments(storedSegments);

          const savedBPMs = JSON.parse(
            localStorage.getItem("savedBPMs") || "{}"
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
  }, [resolvedParams.playlistId, router]);

  // Handle track changes
  useEffect(() => {
    if (tracks[currentTrackIndex]) {
      const track = tracks[currentTrackIndex];
      const storedSegments = JSON.parse(
        localStorage.getItem(`segments_${track.id}`) || "[]"
      );
      setSegments(storedSegments);

      const savedBPMs = JSON.parse(localStorage.getItem("savedBPMs") || "{}");
      if (savedBPMs[track.id]) {
        setTrackBPM({
          tempo: savedBPMs[track.id],
          isManual: true,
        });
      }
    }
  }, [currentTrackIndex, tracks]);

  const playTrack = async (trackId: string) => {
    if (!player || !deviceId || !isPlayerReady) return;

    const accessToken = localStorage.getItem("spotify_access_token");
    if (!accessToken) return;

    try {
      await fetch(
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

      // Load track-specific data
      const storedSegments = JSON.parse(
        localStorage.getItem(`segments_${trackId}`) || "[]"
      );
      setSegments(storedSegments);

      const savedBPMs = JSON.parse(localStorage.getItem("savedBPMs") || "{}");
      if (savedBPMs[trackId]) {
        setTrackBPM({
          tempo: savedBPMs[trackId],
          isManual: true,
        });
      }

      setPlaybackState((prev) => ({
        ...prev,
        isPlaying: true,
        position: 0,
      }));
    } catch (error) {
      console.error("Error playing track:", error);
    }
  };

  const playNextTrack = async () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex((prev) => prev + 1);
      const nextTrack = tracks[currentTrackIndex + 1];
      await playTrack(nextTrack.id);
    }
  };

  const playPreviousTrack = async () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex((prev) => prev - 1);
      const prevTrack = tracks[currentTrackIndex - 1];
      await playTrack(prevTrack.id);
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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
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

      {/* Playlist Overview */}
      <div className="mb-8 bg-black/20 p-4">
        <div className="container mx-auto">
          <h2 className="text-lg font-semibold mb-4">Workout Playlist</h2>
          <div className="space-y-2">
            {tracks.map((track, index) => (
              <div
                key={track.id}
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

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-8">
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
                  player.seek(position);
                }
                setPlaybackState((prev) => ({ ...prev, position }));
              }}
              showBeats={true}
              bpm={trackBPM.tempo}
            />
          </div>

          {/* BPM visualization */}
          <BPMVisualization
            bpm={trackBPM.tempo}
            duration={currentTrack.duration_ms}
            currentPosition={playbackState.position}
            isPlaying={playbackState.isPlaying}
          />

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
              onClick={playNextTrack}
              disabled={currentTrackIndex === tracks.length - 1}
              className="w-12 h-12 rounded-full"
            >
              <SkipForwardIcon className="w-6 h-6" />
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
    </div>
  );
}
