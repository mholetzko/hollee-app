'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Playlist {
  id: string
  name: string
  images: { url: string }[]
  tracks: { total: number }
  owner: {
    id: string
  }
}

interface User {
  id: string
}

export default function DashboardPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get access token from URL hash and store it
    const hash = window.location.hash
    if (hash) {
      const token = hash.substring(1).split('&').find(elem => elem.startsWith('access_token'))?.split('=')[1]
      if (token) {
        localStorage.setItem('spotify_access_token', token)
        // Remove the hash from the URL
        window.history.pushState({}, '', window.location.pathname)
      }
    }

    const fetchUserAndPlaylists = async () => {
      try {
        const accessToken = localStorage.getItem('spotify_access_token')
        if (!accessToken) {
          router.push('/')
          return
        }

        // First fetch user profile
        const userResponse = await fetch('https://api.spotify.com/v1/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user profile')
        }

        const userData = await userResponse.json()
        setUser(userData)

        // Then fetch playlists
        const playlistResponse = await fetch('https://api.spotify.com/v1/me/playlists', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!playlistResponse.ok) {
          throw new Error('Failed to fetch playlists')
        }

        const playlistData = await playlistResponse.json()
        // Filter playlists to only include those owned by the user
        const userPlaylists = playlistData.items.filter(
          (playlist: Playlist) => playlist.owner.id === userData.id
        )
        setPlaylists(userPlaylists)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndPlaylists()
  }, [router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Your Playlists</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition"
          >
            {playlist.images && playlist.images.length > 0 ? (
              <img
                src={playlist.images[0].url}
                alt={playlist.name}
                className="w-full h-48 object-cover rounded-md mb-4"
              />
            ) : (
              <div className="w-full h-48 bg-white/10 rounded-md mb-4 flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
            <h2 className="text-xl font-semibold mb-2">{playlist.name}</h2>
            <p className="text-gray-400 mb-4">{playlist.tracks.total} tracks</p>
            <Link href={`/workout-builder/${playlist.id}`}>
              <Button className="w-full">
                Create Workout
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
} 