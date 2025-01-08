'use client';

import { Button } from "@/components/ui/button";
import toast from 'react-hot-toast';

interface Props {
  onExport: () => void;
  onImport: (file: File) => void;
}

export function ExportImportButtons({ onExport, onImport }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="default"
        size="sm"
        onClick={() => {
          onExport();
          toast.success('Workout configuration exported');
        }}
        className="bg-white/10 hover:bg-white/20 text-white"
      >
        Export
      </Button>

      <div className="relative">
        <Button
          variant="default"
          size="sm"
          className="bg-white/10 hover:bg-white/20 text-white"
          asChild
        >
          <label className="cursor-pointer">
            Import
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file);
              }}
              className="hidden"
            />
          </label>
        </Button>
      </div>
    </div>
  );
}
