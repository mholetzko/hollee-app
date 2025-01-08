'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { WelcomeGuide } from "./WelcomeGuide";

interface ExportImportButtonsProps {
  onExport: () => void;
  onImport: (file: File) => void;
}

export function ExportImportButtons({ onExport, onImport }: ExportImportButtonsProps) {
  const [showGuide, setShowGuide] = useState(false);

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
