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

const hasSavedSegments = (songId: string): boolean => {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(`segments_${songId}`)
  return stored ? JSON.parse(stored).length > 0 : false
}

const getAllWorkoutConfigs = (tracks: Track[]) => {
  if (typeof window === 'undefined') return {}
  
  // Create a map of all tracks first
  const configs: Record<string, {
    track: {
      id: string
      name: string
      artists: string[]
      duration_ms: number
    }
    bpm: {
      tempo: number
      isManual: boolean
    } | null
    segments: any[]
  }> = {}

  // First add all tracks (including those without configs)
  tracks.forEach(track => {
    configs[track.id] = {
      track: {
        id: track.id,
        name: track.name,
        artists: track.artists.map(a => a.name),
        duration_ms: track.duration_ms
      },
      bpm: null,
      segments: []
    }
  })

  // Then add any saved segments and BPM
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('segments_')) {
      const songId = key.replace('segments_', '')
      const segments = JSON.parse(localStorage.getItem(key) || '[]')
      if (configs[songId]) {
        configs[songId].segments = segments
      }
    }
  }

  // Add saved BPMs
  const savedBPMs = JSON.parse(localStorage.getItem('savedBPMs') || '{}')
  Object.entries(savedBPMs).forEach(([songId, bpm]) => {
    if (configs[songId]) {
      configs[songId].bpm = {
        tempo: Number(bpm),
        isManual: true
      }
    }
  })

  return configs
}

const importConfigs = async (file: File) => {
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    
    // Validate the imported data structure
    if (!data.tracks || typeof data.tracks !== 'object') {
      throw new Error('Invalid configuration file format')
    }

    // Import track configurations
    Object.entries(data.tracks).forEach(([songId, config]: [string, any]) => {
      // Save segments if they exist
      if (config.segments && Array.isArray(config.segments)) {
        localStorage.setItem(`segments_${songId}`, JSON.stringify(config.segments))
      }
      
      // Save BPM if it exists
      if (config.bpm && typeof config.bpm.tempo === 'number') {
        const savedBPMs = JSON.parse(localStorage.getItem('savedBPMs') || '{}')
        savedBPMs[songId] = config.bpm.tempo
        localStorage.setItem('savedBPMs', JSON.stringify(savedBPMs))
      }
    })

    return {
      success: true,
      message: 'Configurations imported successfully'
    }
  } catch (error) {
    console.error('Import error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to import configurations'
    }
  }
}

export default function WorkoutBuilder({ params }: { params: Promise<{ playlistId: string }> }) {
  const resolvedParams = use(params)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [importMessage, setImportMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

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

  const handleExport = () => {
    const configs = getAllWorkoutConfigs(tracks)
    const fileName = 'workout-configs.json'
    const json = JSON.stringify({
      exportDate: new Date().toISOString(),
      playlistId: resolvedParams.playlistId,
      tracks: configs
    }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    
    // Create and click a temporary download link
    const link = document.createElement('a')
    link.href = href
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const result = await importConfigs(file)
    
    setImportMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    })

    // Clear message after 3 seconds
    setTimeout(() => setImportMessage(null), 3000)

    // Refresh the page to show updated configurations
    if (result.success) {
      window.location.reload()
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Workout Builder</h1>
          {tracks.some(track => hasSavedSegments(track.id)) && (
            <Button
              variant="default"
              size="lg"
              className="bg-green-500 hover:bg-green-600"
              onClick={() => router.push(`/workout-builder/${resolvedParams.playlistId}/play`)}
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
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              Start Workout
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
              id="import-config"
            />
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => document.getElementById('import-config')?.click()}
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L12 4m4 4v12" 
                />
              </svg>
              Import Configs
            </Button>
          </div>

          <Button
            onClick={handleExport}
            className="flex items-center gap-2"
            variant="outline"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
              />
            </svg>
            Export Configs
          </Button>
        </div>
      </div>

      {importMessage && (
        <div className={`mb-4 p-4 rounded-lg ${
          importMessage.type === 'success' 
            ? 'bg-green-500/20 text-green-300' 
            : 'bg-red-500/20 text-red-300'
        }`}>
          {importMessage.text}
        </div>
      )}

      <div className="grid gap-4">
        {tracks.map((track) => {
          const hasConfig = hasSavedSegments(track.id)
          
          return (
            <Link
              key={track.id}
              href={`/workout-builder/${resolvedParams.playlistId}/song/${track.id}`}
              className={`
                flex items-center gap-4 p-4 rounded-lg 
                ${hasConfig ? 'bg-white/10' : 'bg-black/20'} 
                hover:bg-white/20 transition-colors relative group
              `}
            >
              {track.album?.images?.[0] && (
                <img
                  src={track.album.images[0].url}
                  alt={track.name}
                  className="w-16 h-16 rounded"
                />
              )}
              <div className="flex-1">
                <div className="font-medium">{track.name}</div>
                <div className="text-sm text-gray-400">
                  {track.artists.map(a => a.name).join(', ')}
                </div>
              </div>
              
              {hasConfig && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  Configured
                </div>
              )}
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost">
                  Edit Workout
                </Button>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
} 