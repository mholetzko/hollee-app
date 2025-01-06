'use client'

export const LoadingState = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <div className="space-y-4 text-center">
        <div className="animate-spin h-8 w-8 border-2 border-white/50 rounded-full border-t-transparent" />
        <div className="text-lg">Initializing player...</div>
        <div className="text-sm text-gray-400">Please wait while we connect to Spotify</div>
      </div>
    </div>
  );
}; 