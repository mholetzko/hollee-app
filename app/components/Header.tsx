'use client';

import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export const Header = () => {
  const router = useRouter();

  const handleLogout = () => {
    // Only remove the Spotify access token
    localStorage.removeItem("spotify_access_token");
    
    // Redirect to login page
    router.push("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-sm border-b border-white/10 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        <Logo />
        
        <Button
          onClick={handleLogout}
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
    </header>
  );
}; 