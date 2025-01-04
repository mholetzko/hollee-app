"use client";

import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { Footer } from "@/components/Footer";

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
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Login section */}
        <div className="w-full max-w-7xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Workout Builder</h1>
          <p className="text-gray-400 mb-8">Sync your ride with your favorite beats</p>
          <Button
            onClick={handleLogin}
            className="inline-flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white 
              px-8 py-3 rounded-full text-lg font-medium transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.371-.721.53-1.07.29-3.29-2.02-7.43-2.47-12.31-1.35-.379.09-.759-.21-.84-.59-.09-.38.21-.76.59-.84 5.359-1.23 10.01-.71 13.73 1.5.36.23.519.71.279 1.07zm1.473-3.269c-.301.45-.907.63-1.365.33-3.76-2.31-9.51-2.98-13.97-1.63-.467.11-.953-.19-1.07-.66-.11-.47.19-.95.66-1.07 5.11-1.55 11.45-.79 15.77 1.82.45.3.629.91.329 1.359zm.127-3.41c-4.51-2.68-11.96-2.93-16.28-1.62-.558.17-1.147-.15-1.31-.71-.167-.56.152-1.15.711-1.31 4.959-1.5 13.19-1.21 18.38 1.86.533.32.719 1.01.41 1.54-.31.53-1.007.72-1.539.41z"/>
            </svg>
            Connect with Spotify
          </Button>
        </div>

        {/* Overview section - now in single column */}
        <div className="w-full max-w-7xl mx-auto bg-white/5 rounded-lg p-8 mb-12">
          <h2 className="text-xl font-semibold mb-8 text-white">Create the Perfect Workout</h2>
          <div className="space-y-12">
            {/* Step 1 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[#1DB954]">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1DB954]/10 text-[#1DB954]">1</div>
                <span className="font-medium">Select Your Playlist</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Choose from your Spotify playlists and start building your perfect workout
              </p>
              <div className="aspect-video relative overflow-hidden rounded-lg shadow-lg border border-white/10">
                <Image 
                  src="/images/your-playlists.png"
                  alt="Playlist Selection"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[#1DB954]">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1DB954]/10 text-[#1DB954]">2</div>
                <span className="font-medium">Design Your Workout</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Create a structured workout by adding segments to each track
              </p>
              <div className="aspect-video relative overflow-hidden rounded-lg shadow-lg border border-white/10">
                <Image 
                  src="/images/workout-builder.png"
                  alt="Workout Builder"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[#1DB954]">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1DB954]/10 text-[#1DB954]">3</div>
                <span className="font-medium">Add Workout Segments</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Fine-tune each track with specific workout segments and intensities
              </p>
              <div className="aspect-video relative overflow-hidden rounded-lg shadow-lg border border-white/10">
                <Image 
                  src="/images/segment-editor.png"
                  alt="Segment Editor"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[#1DB954]">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1DB954]/10 text-[#1DB954]">4</div>
                <span className="font-medium">Start Your Ride</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Follow along with your enhanced playlist, complete with BPM tracking and segment guidance
              </p>
              <div className="aspect-video relative overflow-hidden rounded-lg shadow-lg border border-white/10">
                <Image 
                  src="/images/workout-player.png"
                  alt="Workout Player"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Privacy section - now full width */}
        <div className="w-full max-w-7xl mx-auto bg-white/5 rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
            <svg 
              className="w-6 h-6 text-[#1DB954]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m0 0v2m0-2h2m-2 0H8m4-6V4m0 0v2m0-2h2m-2 0H8m12 0a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            Privacy & Permissions
          </h2>
          
          <div className="space-y-6 text-gray-300">
            <div>
              <h3 className="font-medium mb-2 text-white">What we access:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Your Spotify playlists (read-only)</li>
                <li>Basic profile information (display name)</li>
                <li>Playback control for workout sessions</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2 text-white">What we store locally:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Workout configurations (segments, intensities)</li>
                <li>BPM settings for your tracks</li>
                <li>Temporary Spotify access token</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2 text-white">What we don&apos;t do:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Store your personal information</li>
                <li>Track your listening habits</li>
                <li>Share any data with third parties</li>
                <li>Modify your Spotify playlists</li>
              </ul>
            </div>

            <div className="pt-4 text-sm text-gray-400 border-t border-white/10">
              <p>
                All workout data is stored locally in your browser. We recommend using the export 
                feature to backup your configurations. You can remove access to this app at any time 
                through your Spotify account settings.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
