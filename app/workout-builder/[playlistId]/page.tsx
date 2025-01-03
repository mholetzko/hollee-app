'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { use } from 'react'
import Link from 'next/link'

interface Track {
  id: string
  name: string
  duration_ms: number
  artists: { name: string }[]
  album?: { images?: { url: string }[] }
}

export default function WorkoutBuilder({ params }: { params: Promise<{ playlistId: string }> }) {
  const resolvedParams = use(params)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchPlaylistTracks = async () => {
      try {
        const accessToken = localStorage.getItem('spotify_access_token')
        if (!accessToken) {
          router.push('/')
          return
        }

        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${resolvedParams.playlistId}/tracks`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch tracks')
        }

        const data = await response.json()
        setTracks(data.items.map((item: any) => item.track))
      } catch (error) {
        console.error('Error fetching tracks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylistTracks()
  }, [resolvedParams.playlistId, router])

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Workout Builder</h1>
      <div className="grid gap-4">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="bg-white/5 rounded-lg p-4 flex items-center gap-4"
          >
            {track.album?.images?.[0] && (
              <img
                src={track.album.images[0].url}
                alt={track.name}
                className="w-16 h-16 rounded"
              />
            )}
            <div className="flex-1">
              <h2 className="font-semibold">{track.name}</h2>
              <p className="text-sm text-gray-400">
                {track.artists.map(a => a.name).join(', ')} • {formatDuration(track.duration_ms)}
              </p>
            </div>
            <Link
              href={`/workout-builder/${resolvedParams.playlistId}/song/${track.id}`}
              className="shrink-0"
            >
              <Button>
                Edit Segments
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
} 