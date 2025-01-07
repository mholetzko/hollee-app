'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScissorsIcon, PlayIcon, Cross2Icon, QuestionMarkCircledIcon } from "@radix-ui/react-icons";

export function WorkoutStructureHint() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      {/* Help Icon Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed bottom-4 right-4 rounded-full w-10 h-10 bg-white/10 hover:bg-white/20 z-40"
        onClick={() => setIsVisible(true)}
      >
        <QuestionMarkCircledIcon className="w-5 h-5" />
      </Button>

      {/* Modal */}
      {isVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50
          transition-opacity duration-500"
          onClick={() => setIsVisible(false)}
        >
          <div className="bg-gray-900 p-8 rounded-xl max-w-2xl mx-4 relative" 
               onClick={e => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="sm"
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => setIsVisible(false)}
            >
              <Cross2Icon className="w-4 h-4" />
            </Button>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Structure Your Workout</h2>
              
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start gap-4">
                  <PlayIcon className="w-6 h-6 mt-1 text-green-400" />
                  <p>Listen to the full track first to identify natural energy changes and beat drops</p>
                </div>
                
                <div className="flex items-start gap-4">
                  <ScissorsIcon className="w-6 h-6 mt-1 text-blue-400" />
                  <p>Use the split function at major beat drops and energy transitions to create segments</p>
                </div>
              </div>

              <div className="mt-6 text-sm text-gray-400">
                Tip: Most tracks have natural high-energy sections that work great for climbs or sprints
              </div>

              <Button 
                className="w-full mt-4"
                onClick={() => setIsVisible(false)}
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}