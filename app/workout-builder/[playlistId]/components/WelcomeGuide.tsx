'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ExampleWorkoutStorage } from "@/app/utils/storage/ExampleWorkoutStorage";

interface WelcomeGuideProps {
  playlistId: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WelcomeGuide({ playlistId, isOpen: controlledOpen, onOpenChange }: WelcomeGuideProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  useEffect(() => {
    if (ExampleWorkoutStorage.isExamplePlaylist(playlistId)) {
      const hasSeenGuide = localStorage.getItem(`seen_guide_${playlistId}`);
      if (!hasSeenGuide) {
        setIsOpen(true);
      }
    }
  }, [playlistId, setIsOpen]);

  const handleClose = () => {
    if (playlistId) {
      localStorage.setItem(`seen_guide_${playlistId}`, 'true');
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl bg-gradient-to-b from-black/95 to-black/90 border border-white/10 backdrop-blur-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Welcome to the Workout Editor! 👋
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 text-gray-300 mt-6">
          <section className="space-y-6">
            <h3 className="text-xl font-semibold text-white/90">Quick Guide:</h3>
            <div className="space-y-8">
              {/* Editor Section */}
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-black border border-white/10 flex items-center justify-center text-white font-bold text-lg">
                    1
                  </div>
                  <div className="space-y-3 flex-1">
                    <p className="text-white font-medium">Configure your workout:</p>
                    <ul className="space-y-2 text-gray-400">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        Set BPM (beats per minute) for precise timing
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        Create segments by clicking and dragging on the timeline
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        Choose workout types for each segment
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        Adjust intensity levels (0-100%)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Player Section */}
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-black border border-white/10 flex items-center justify-center text-white font-bold text-lg">
                    2
                  </div>
                  <div className="space-y-3 flex-1">
                    <p className="text-white font-medium">During your workout:</p>
                    <ul className="space-y-2 text-gray-400">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        Play your configured workout with Spotify integration
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        See upcoming segments and intensity changes
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        Control playback and track progress
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-black border border-white/10 flex items-center justify-center text-white font-bold text-lg">
                    3
                  </div>
                  <div className="space-y-3 flex-1">
                    <p className="text-white font-medium">Don't forget to:</p>
                    <ul className="space-y-2 text-gray-400">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        Export your workout configuration to save it
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        Match your bike resistance to the displayed intensity
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="bg-[#1DB954]/5 border border-[#1DB954]/10 rounded-lg p-4">
            <p className="text-sm text-[#1DB954]/90 flex items-center gap-2">
              <span className="text-lg">💡</span>
              This guide will only appear once, but you can always refer to the documentation for more details.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-8">
          <Button
            className="bg-black hover:bg-black/90 text-white w-full sm:w-auto text-sm font-medium px-6 py-2 h-9 border border-white/10"
            onClick={handleClose}
          >
            Let's get started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 