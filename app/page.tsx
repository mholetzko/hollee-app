'use client'

import { Button } from "@/components/ui/button"

export default function Home() {
  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI
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
    ].join(' ')

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId!,
      scope: scopes,
      redirect_uri: redirectUri!,
    })

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Button onClick={handleLogin}>Login with Spotify</Button>
    </div>
  )
}