"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SpotifyAuthStorage } from "../utils/storage/SpotifyAuthStorage";
import { TracklistStorage } from "../utils/storage/TracklistStorage";
import { TrackStorage } from "@/app/workout-builder/[playlistId]/utils/storage";
import Image from "next/image";

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: {
    id: string;
  };
}

const getWorkoutStatus = (playlistId: string) => {
  const totalTracks = TracklistStorage.load(playlistId) || 0;

  // Ensure totalTracks is a valid number
  if (totalTracks <= 0) {
    console.warn(`No tracks found for playlist ${playlistId}`);
    return "none";
  }

  // Count tracks that have segments configured
  let configuredTracksCount = 0;

  // Get all track IDs from the playlist's tracks

  const segments = TrackStorage.segments.loadAll(playlistId);
  const trackIds = Object.keys(segments);
  configuredTracksCount = trackIds.filter((trackId) =>
    TrackStorage.segments.hasData(playlistId, trackId)
  ).length;

  console.log(`Playlist ${playlistId} status check:`, {
    playlistId,
    totalTracks,
    segmentsConfigured: configuredTracksCount,
    trackIds,
    segments: JSON.stringify(TrackStorage.segments),
  });

  if (configuredTracksCount === 0) {
    return "none";
  }

  // Calculate completion percentage
  const completionPercentage = (configuredTracksCount / totalTracks) * 100;

  // If 80% or more tracks have segments, consider it ready
  if (completionPercentage >= 80) {
    return "ready";
  }

  // If some tracks have segments but less than 80%, it's in progress
  return "in-progress";
};

export default function DashboardPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get access token from URL hash and store it
    const hash = window.location.hash;
    if (hash) {
      const token = hash
        .substring(1)
        .split("&")
        .find((elem) => elem.startsWith("access_token"))
        ?.split("=")[1];
      if (token) {
        SpotifyAuthStorage.save(token);
        window.history.pushState({}, "", window.location.pathname);
      }
    }

    const fetchUserAndPlaylists = async () => {
      try {
        const accessToken = SpotifyAuthStorage.load();
        if (!accessToken) {
          router.push("/");
          return;
        }

        // First fetch user profile
        const userResponse = await fetch("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const userData = await userResponse.json();

        // Then fetch playlists
        const playlistResponse = await fetch(
          "https://api.spotify.com/v1/me/playlists",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!playlistResponse.ok) {
          throw new Error("Failed to fetch playlists");
        }

        const playlistData = await playlistResponse.json();
        // Filter playlists to only include those owned by the user
        const userPlaylists = playlistData.items.filter(
          (playlist: Playlist) => playlist.owner.id === userData.id
        );
        setPlaylists(userPlaylists);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndPlaylists();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="flex-1 p-8 max-w-[1800px] mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Your Workout Hub
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Transform your playlists into dynamic cycling workouts
          </p>
        </div>

        <div className="mb-12 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl p-8 backdrop-blur-sm border border-white/10">
          <h2 className="text-2xl font-semibold mb-8 text-white">
            Create Your Perfect Ride
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="space-y-3 p-4 rounded-lg transition-all duration-300 hover:bg-white/5">
              <div className="flex items-center gap-3 text-[#1DB954]">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1DB954]/10 text-[#1DB954]">
                  1
                </div>
                <span className="font-medium">Prepare in Spotify</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Create a playlist in Spotify with your favorite tracks for the
                perfect riding experience
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-lg transition-all duration-300 hover:bg-white/5">
              <div className="flex items-center gap-3 text-[#1DB954]">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1DB954]/10 text-[#1DB954]">
                  2
                </div>
                <span className="font-medium">Select & Build</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Choose your playlist below and start crafting your synchronized
                workout routine
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-lg transition-all duration-300 hover:bg-white/5">
              <div className="flex items-center gap-3 text-[#1DB954]">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1DB954]/10 text-[#1DB954]">
                  3
                </div>
                <span className="font-medium">Design Segments</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Create workout segments for each track, matching intensity with
                the music&apos;s energy
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-lg transition-all duration-300 hover:bg-white/5">
              <div className="flex items-center gap-3 text-[#1DB954]">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1DB954]/10 text-[#1DB954]">
                  4
                </div>
                <span className="font-medium">Start Riding</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Run your enhanced playlist with perfectly timed workout segments
                and BPM tracking
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-lg transition-all duration-300 hover:bg-white/5">
              <div className="flex items-center gap-3 text-orange-400">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-400/10 text-orange-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <span className="font-medium">Don&apos;t Forget</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your workout data is stored locally - use the export feature to
                save and backup your configurations
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Your Playlists
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#1DB954]"></div>
              <span>Ready</span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>In Progress</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
          {playlists.map((playlist) => {
            const workoutStatus = getWorkoutStatus(playlist.id);
            
            return (
              <div
                key={playlist.id}
                className="group relative bg-gradient-to-br from-white/[0.07] to-white/[0.02] rounded-lg hover:from-white/10 hover:to-white/[0.03] 
                  transition-all duration-500 overflow-hidden backdrop-blur-sm border border-white/10"
              >
                <div className="relative aspect-square">
                  <Image
                    src={playlist.images?.[0]?.url || ''}
                    alt={playlist.name}
                    fill
                    className="object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {workoutStatus !== 'none' && (
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-white text-xs font-medium 
                      flex items-center gap-1.5 backdrop-blur-sm
                      ${workoutStatus === 'ready' 
                        ? 'bg-[#1DB954]/80 hover:bg-[#1DB954]/90' 
                        : 'bg-yellow-500/80 hover:bg-yellow-500/90'
                      } transition-colors duration-300`}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {workoutStatus === "ready" ? (
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        ) : (
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        )}
                      </svg>
                      {workoutStatus === "ready"
                        ? "Ready"
                        : "In Progress"}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h2 className="text-sm font-semibold mb-1 text-white truncate group-hover:text-[#1DB954] transition-colors duration-300">
                    {playlist.name}
                  </h2>
                  <p className="text-xs text-gray-400 mb-3">
                    {playlist.tracks.total} tracks
                  </p>
                  
                  <Link href={`/workout-builder/${playlist.id}`} className="block">
                    <Button 
                      className={`w-full py-2 text-xs font-semibold rounded-md transition-all duration-300 
                        hover:scale-102 hover:shadow-lg hover:shadow-[#1DB954]/20
                        ${workoutStatus !== 'none'
                          ? 'bg-white/10 hover:bg-white/20 text-white' 
                          : 'bg-[#1DB954] hover:bg-[#1DB954]/90 text-white'
                        }`}
                    >
                      <svg
                        className="w-4 h-4 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {workoutStatus !== "none" ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        )}
                      </svg>
                      {workoutStatus === "ready"
                        ? "Edit Workout"
                        : workoutStatus === "in-progress"
                        ? "Continue Setup"
                        : "Create Workout"}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
