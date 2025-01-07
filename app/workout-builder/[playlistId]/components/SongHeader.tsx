import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import Image from 'next/image';
import { BPMInput } from './BPMInput';
import { Track, TrackBPM } from '../types';

interface SongHeaderProps {
  track: Track;
  trackBPM: TrackBPM;
  onBPMChange: (bpm: number) => void;
  onBack: () => void;
  formatDuration: (ms: number) => string;
}

export const SongHeader: React.FC<SongHeaderProps> = ({
  track,
  trackBPM,
  onBPMChange,
  onBack,
  formatDuration,
}) => {
  return (
    <div className="flex-none bg-black/20 backdrop-blur-sm p-8 border-b border-white/10">
      <div className="w-full">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 hover:bg-white/10"
          onClick={onBack}
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Playlist
        </Button>

        <div className="flex items-start gap-6">
          <div className="flex items-center gap-6">
            {track.album?.images?.[0] && (
              <Image
                src={track.album.images[0].url}
                alt={track.name}
                width={48}
                height={48}
                className="rounded"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{track.name}</h1>
              <p className="text-gray-400">
                {track.artists.map((a) => a.name).join(", ")} •{" "}
                {formatDuration(track.duration_ms)}
              </p>
            </div>
          </div>

          <div className="ml-auto text-center min-w-[300px]">
            <div className="bg-white/5 px-6 py-4 rounded-lg">
              <BPMInput 
                value={trackBPM.tempo}
                onChange={onBPMChange}
              />
            </div>
            <div className="mt-2 text-sm text-gray-400">
              {trackBPM.isManual ? "Manual BPM" : "BPM from title"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 