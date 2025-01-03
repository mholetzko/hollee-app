"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Footer } from '@/components/Footer';

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: {
    id: string;
  };
}

interface User {
  id: string;
}

const getWorkoutStatus = (playlistId: string) => {
  const keys = Object.keys(localStorage);
  const segmentKeys = keys.filter(key => key.startsWith(`playlist_${playlistId}_segments_`));
  
  // Get the total number of tracks that should have segments
  const storageKey = `playlist_${playlistId}_total_tracks`;
  const totalTracksString = localStorage.getItem(storageKey);
  const totalTracks = totalTracksString ? parseInt(totalTracksString) : 0;
  
  console.log(`Playlist ${playlistId} status check:`, {
    storageKey,
    totalTracksString,
    totalTracks,
    segmentKeysCount: segmentKeys.length,
    segmentKeys,
    allKeys: keys
  });

  if (segmentKeys.length === 0) {
    return 'none';
  }

  // Calculate completion percentage
  const completionPercentage = (segmentKeys.length / totalTracks) * 100;
  
  // If 80% or more tracks have segments, consider it ready
  if (totalTracks > 0 && completionPercentage >= 80) {
    return 'ready';
  }
  
  // If some tracks have segments but less than 80%, it's in progress
  return 'in-progress';
};

export default function DashboardPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [user, setUser] = useState<User | null>(null);
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
        localStorage.setItem("spotify_access_token", token);
        // Remove the hash from the URL
        window.history.pushState({}, "", window.location.pathname);
      }
    }

    const fetchUserAndPlaylists = async () => {
      try {
        const accessToken = localStorage.getItem("spotify_access_token");
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
        setUser(userData);

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
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">HOLLEES Indoor Cycling Workout Builder</h1>
          </div>
          <Button
            onClick={() => {
              localStorage.removeItem("spotify_access_token");
              router.push("/");
            }}
            variant="ghost"
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
              />
            </svg>
            Logout
          </Button>
        </div>

        <div className="mb-8 bg-white/5 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Quick Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 text-[#1DB954] mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-medium">Step 1: Select Playlist</span>
              </div>
              <p className="text-sm text-gray-400">Choose a playlist to transform into a workout routine</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#1DB954] mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-medium">Step 2: Configure Songs</span>
              </div>
              <p className="text-sm text-gray-400">Set workout segments and intensity for each track</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#1DB954] mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-medium">Step 3: Start Workout</span>
              </div>
              <p className="text-sm text-gray-400">Follow along with real-time tracking and BPM display</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-yellow-500 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="font-medium">Step 4: Export Workout</span>
              </div>
              <p className="text-sm text-gray-400">Save your workout configuration for backup or sharing</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/10 mb-8" />

        <h1 className="text-3xl font-bold mb-8 text-white">Your Playlists</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {playlists.map((playlist) => {
            const workoutStatus = getWorkoutStatus(playlist.id);
            
            return (
              <div
                key={playlist.id}
                className="bg-white/5 rounded-lg hover:bg-white/10 transition-colors overflow-hidden flex flex-col"
              >
                <div className="relative">
                  {playlist.images && playlist.images.length > 0 ? (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-white/10 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                  {workoutStatus !== 'none' && (
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-white text-xs font-medium flex items-center gap-1
                      ${workoutStatus === 'ready' ? 'bg-[#1DB954]/90' : 'bg-yellow-500/90'}`}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        {workoutStatus === 'ready' ? (
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        )}
                      </svg>
                      {workoutStatus === 'ready' ? 'Workout Ready' : 'In Progress'}
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h2 className="text-sm font-semibold mb-1 text-white truncate">{playlist.name}</h2>
                  <p className="text-xs text-gray-400 mb-3">{playlist.tracks.total} tracks</p>
                  <div className="mt-auto">
                    <Link href={`/workout-builder/${playlist.id}`} className="block">
                      <Button 
                        className={`w-full h-auto text-sm font-semibold rounded-md transition-all duration-300 hover:scale-105 flex items-center justify-center gap-1
                          ${workoutStatus !== 'none'
                            ? 'bg-white/10 hover:bg-white/20 text-white' 
                            : 'bg-[#1DB954] hover:bg-[#1ed760] text-white'
                          }`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {workoutStatus !== 'none' ? (
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
                        {workoutStatus === 'ready' ? 'Edit Workout' : 
                         workoutStatus === 'in-progress' ? 'Continue Setup' : 
                         'Create Workout'}
                      </Button>
                    </Link>
                  </div>
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
