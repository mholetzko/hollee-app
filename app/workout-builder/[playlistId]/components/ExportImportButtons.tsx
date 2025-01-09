'use client';

import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { WelcomeGuide } from "./WelcomeGuide";
import { TrackStorage } from "../../../utils/storage/TrackStorage";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import { Segment } from "../types";

interface ExportImportButtonsProps {
  onExport: () => void;
  onImport: (file: File) => void;
  onSegmentsChange: (segments: Segment[]) => void;
  playlistId: string;
  track?: {
    id: string;
    duration_ms: number;
  };
}

export function ExportImportButtons({ onExport, onImport, onSegmentsChange, playlistId, track }: ExportImportButtonsProps) {
  const [showGuide, setShowGuide] = useState(false);

  // Safety check for track
  if (!track) {
    return null;
  }

  const handleLoadExample = useCallback(() => {
    // First check if there are any existing segments
    const existingSegments = TrackStorage.segments.load(playlistId, track.id);
    
    // Only load example if there are no existing segments
    if (existingSegments && existingSegments.length > 0) {
      return;
    }
    
    // Calculate segment duration based on track duration
    const segmentDuration = Math.floor(track.duration_ms / 3);
    
    // Create example segments
    const exampleSegments: Segment[] = [
      {
        id: uuidv4(),
        startTime: 0,
        endTime: segmentDuration,
        type: "warmup",
        intensity: 6,
        title: "Warm Up",
      },
      {
        id: uuidv4(),
        startTime: segmentDuration,
        endTime: segmentDuration * 2,
        type: "climb",
        intensity: 8,
        title: "Climb",
      },
      {
        id: uuidv4(),
        startTime: segmentDuration * 2,
        endTime: track.duration_ms,
        type: "cooldown",
        intensity: 5,
        title: "Cool Down",
      },
    ];

    // Save and update
    TrackStorage.segments.save(playlistId, track.id, exampleSegments);
    onSegmentsChange(exampleSegments);
    toast.success("Example workout template loaded!");
  }, [playlistId, track?.id, track?.duration_ms, onSegmentsChange]);

  const hasExistingSegments = track ? TrackStorage.segments.load(playlistId, track.id)?.length > 0 : false;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="hover:bg-white/10"
        onClick={() => setShowGuide(true)}
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
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Help
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onExport}
        className="hover:bg-white/10"
      >
        Export
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => document.getElementById('import-config')?.click()}
        className="hover:bg-white/10"
      >
        Import
      </Button>

      <input
        type="file"
        id="import-config"
        className="hidden"
        accept=".json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onImport(file);
          }
        }}
      />

      {/* Add the WelcomeGuide component */}
      {showGuide && (
        <WelcomeGuide 
          playlistId="" // Not needed for manual trigger
          isOpen={showGuide}
          onOpenChange={setShowGuide}
        />
      )}
    </div>
  );
}
