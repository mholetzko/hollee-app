"use client";

import Image from 'next/image';
import { Footer } from "/components/Footer";

function FQDN() {
  return process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000";
}

export default function LoginPage() {
  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = `${FQDN()}/api/auth/callback`;
    const scopes = [
      "playlist-read-private",
      "streaming", 
      "user-read-playback-state",
      "user-modify-playback-state",
      "playlist-modify-private",
      "user-read-currently-playing",
      "user-library-read",
      "user-read-email",
      "user-read-private",
    ].join(" ");

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId!,
      scope: scopes,
      redirect_uri: redirectUri!,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="flex-1 p-8">
        {/* Hero Section */}
        <div className="mb-12 max-w-[1800px] mx-auto pt-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent leading-tight">
            Cycling Workout Builder
          </h1>
          <p className="mt-6 text-lg text-gray-400">
            Transform your Spotify playlists into dynamic cycling workouts
          </p>
        </div>

        {/* Main Content */}
        <div className="mb-12 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl p-8 backdrop-blur-sm border border-white/10">
          <div className="max-w-[1800px] mx-auto">
            <h2 className="text-2xl font-semibold mb-8 text-white">
              Get Started with Spotify
            </h2>
            <div className="space-y-6">
              <p className="text-gray-400">
                Connect your Spotify account to start creating custom cycling workouts
              </p>
              <button
                onClick={handleLogin}
                className="inline-flex items-center gap-2 bg-[#1DB954] hover:bg-[#1DB954]/90 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-102 hover:shadow-lg hover:shadow-[#1DB954]/20"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.371-.721.53-1.07.29-3.29-2.02-7.43-2.47-12.31-1.35-.379.09-.759-.21-.84-.57-.09-.38.21-.76.57-.84 5.359-1.23 10.01-.71 13.73 1.57.329.19.31.72-.08 1.09zm1.47-3.27c-.301.45-.849.63-1.29.33-3.761-2.31-9.481-2.98-13.911-1.63-.479.15-.99-.13-1.149-.61-.15-.48.13-.99.609-1.14 5.071-1.52 11.391-.78 15.731 1.91.45.33.629.85.33 1.29zm.13-3.4C15.241 8.24 8.881 8.03 5.171 9.1c-.558.16-1.135-.16-1.29-.71-.16-.55.16-1.13.71-1.29 4.29-1.3 11.41-1.05 15.91 1.62.539.33.719 1.03.389 1.57-.33.54-1.029.72-1.569.39z" />
                </svg>
                Connect with Spotify
              </button>
            </div>
          </div>
        </div>

        {/* Overview Section */}
        <div className="mb-12 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl p-8 backdrop-blur-sm border border-white/10">
          <div className="max-w-[1800px] mx-auto">
            <h2 className="text-2xl font-semibold mb-8 text-white">Create the Perfect Workout</h2>
            <div className="grid grid-cols-1 gap-12">
              
              {/* Step 1 */}
              <div className="flex flex-col lg:flex-row gap-8 items-center">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 text-[#1DB954]">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1DB954]/10 text-[#1DB954]">1</div>
                    <span className="font-medium">Select Your Playlist</span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Choose from your Spotify playlists and start building your perfect workout
                  </p>
                </div>
                <div className="lg:flex-1 w-full">
                  <Image
                    src="/images/your-playlists.png"
                    alt="Playlist selection interface"
                    width={600}
                    height={338}
                    className="rounded-lg border border-white/10 w-full"
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col lg:flex-row-reverse gap-8 items-center">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 text-[#1DB954]">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1DB954]/10 text-[#1DB954]">2</div>
                    <span className="font-medium">Design Your Workout</span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Create a structured workout by adding segments to each track
                  </p>
                </div>
                <div className="lg:flex-1 w-full">
                  <Image
                    src="/images/workout-builder.png"
                    alt="Workout builder interface"
                    width={600}
                    height={338}
                    className="rounded-lg border border-white/10 w-full"
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col lg:flex-row gap-8 items-center">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 text-[#1DB954]">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1DB954]/10 text-[#1DB954]">3</div>
                    <span className="font-medium">Add Segments</span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Fine-tune each track with specific workout segments and intensities
                  </p>
                </div>
                <div className="lg:flex-1 w-full">
                  <Image
                    src="/images/segment-editor.png"
                    alt="Segment editor interface"
                    width={600}
                    height={338}
                    className="rounded-lg border border-white/10 w-full"
                  />
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col lg:flex-row-reverse gap-8 items-center">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 text-[#1DB954]">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1DB954]/10 text-[#1DB954]">4</div>
                    <span className="font-medium">Start Your Ride</span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Follow along with your enhanced playlist, complete with BPM tracking
                  </p>
                </div>
                <div className="lg:flex-1 w-full">
                  <Image
                    src="/images/workout-player.png"
                    alt="Workout player interface"
                    width={600}
                    height={338}
                    className="rounded-lg border border-white/10 w-full"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl p-8 backdrop-blur-sm border border-white/10">
          <div className="max-w-[1800px] mx-auto">
            <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3 text-white">
              <svg className="w-6 h-6 text-[#1DB954]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 15v2m0 0v2m0-2h2m-2 0H8m4-6V4m0 0v2m0-2h2m-2 0H8m12 0a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              Privacy & Permissions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4 p-4 rounded-lg transition-all duration-300 hover:bg-white/5">
                <h3 className="font-medium text-white">What we access:</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-400">
                  <li>Your Spotify playlists (read-only)</li>
                  <li>Basic profile information</li>
                  <li>Playback control for workout sessions</li>
                </ul>
              </div>

              <div className="space-y-4 p-4 rounded-lg transition-all duration-300 hover:bg-white/5">
                <h3 className="font-medium text-white">What we store locally:</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-400">
                  <li>Workout configurations</li>
                  <li>BPM settings for your tracks</li>
                  <li>Temporary Spotify access token</li>
                </ul>
              </div>

              <div className="space-y-4 p-4 rounded-lg transition-all duration-300 hover:bg-white/5">
                <h3 className="font-medium text-white">What we don&apos;t do:</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-400">
                  <li>Store your personal information</li>
                  <li>Track your listening habits</li>
                  <li>Modify your Spotify playlists</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
