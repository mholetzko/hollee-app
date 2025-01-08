'use client';

import { EXAMPLE_PLAYLISTS } from '@/app/config/example-workouts';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function ExampleWorkouts() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {Object.values(EXAMPLE_PLAYLISTS).map((playlist) => (
        <div
          key={playlist.id}
          className="group relative bg-gradient-to-br from-white/[0.07] to-white/[0.02] rounded-lg 
            hover:from-white/10 hover:to-white/[0.03] transition-all duration-500 
            overflow-hidden backdrop-blur-sm border border-white/10 p-6"
        >
          <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-[#1DB954] transition-colors duration-300">
            {playlist.name}
          </h3>
          <p className="text-gray-400 mb-6 text-sm leading-relaxed">
            {playlist.description}
          </p>
          <Button
            className="bg-[#1DB954] hover:bg-[#1DB954]/90 text-white transition-all duration-300 
              hover:scale-102 hover:shadow-lg hover:shadow-[#1DB954]/20"
            onClick={() => router.push(`/workout-builder/${playlist.id}`)}
          >
            <svg
              className="w-4 h-4 mr-2"
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
            Try this workout
          </Button>
        </div>
      ))}
    </div>
  );
} 