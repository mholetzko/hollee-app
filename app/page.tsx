'use client'

import { Button } from "@/components/ui/button"
import { Footer } from '@/components/Footer'

export default function Home() {
  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
    const scopes = [
      'playlist-read-private',
      'streaming',
      'user-read-playback-state',
      'user-modify-playback-state',
      'playlist-modify-private',
      'user-read-currently-playing',
      'user-library-read',
      'user-read-email',
      'user-read-private'
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId!,
      scope: scopes,
      redirect_uri: redirectUri!,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  };

  return (
    <main className="min-h-screen flex flex-col bg-black">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl px-4 py-8 text-center">
          {/* Hero Section */}
          <div className="mb-12 space-y-4">
            <h1 className="text-4xl font-bold text-white">
              HOLLEES Indoor Cycling Workout Builder
            </h1>
            <p className="text-lg text-gray-400">
              Transform your Spotify playlists into dynamic cycling workout experiences
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <div className="text-2xl mb-2">🎵</div>
              <h3 className="text-lg font-semibold mb-2 text-white">Sync with Spotify</h3>
              <p className="text-sm text-gray-400">
                Use your favorite playlists and tracks
              </p>
            </div>
            <div className="p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <div className="text-2xl mb-2">🏋️‍♂️</div>
              <h3 className="text-lg font-semibold mb-2 text-white">Custom Workouts</h3>
              <p className="text-sm text-gray-400">
                Create personalized workout segments
              </p>
            </div>
            <div className="p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="text-lg font-semibold mb-2 text-white">Real-time Tracking</h3>
              <p className="text-sm text-gray-400">
                Follow your progress as you work out
              </p>
            </div>
          </div>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-white px-8 py-6 h-auto text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105"
          >
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Connect with Spotify
          </Button>

          {/* Footer */}
          <p className="mt-8 text-sm text-gray-500">
            Premium Spotify account required for playback
          </p>
        </div>
      </div>
      <Footer />
    </main>
  )
}