export class AudioCrossfader {
  private audioContext: AudioContext;
  private sources: Map<string, {
    buffer: AudioBuffer;
    source?: AudioBufferSourceNode;
    gain?: GainNode;
  }> = new Map();
  private currentTrackId: string | null = null;
  private crossfadeDuration: number;

  constructor(crossfadeDuration: number = 3) {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.crossfadeDuration = crossfadeDuration;
    console.log('[AudioCrossfader] Created new AudioContext:', this.audioContext.state);
  }

  async ensureContext() {
    if (this.audioContext.state === 'closed') {
      console.log('[AudioCrossfader] Creating new AudioContext to replace closed one');
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (this.audioContext.state === 'suspended') {
      console.log('[AudioCrossfader] Resuming suspended AudioContext');
      await this.audioContext.resume();
    }
    
    return this.audioContext.state === 'running';
  }

  async loadTrack(trackId: string, url: string) {
    try {
      console.log(`[AudioCrossfader] Loading track: ${trackId} from ${url}`);
      
      await this.ensureContext();

      if (this.sources.has(trackId)) {
        console.log(`[AudioCrossfader] Track ${trackId} already loaded`);
        return true;
      }

      const response = await fetch(url);
      if (!response.ok) {
        console.error(`[AudioCrossfader] HTTP error: ${response.status} ${response.statusText}`);
        return false;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        console.error(`[AudioCrossfader] Empty audio file`);
        return false;
      }

      console.log(`[AudioCrossfader] Decoding audio data: ${arrayBuffer.byteLength} bytes`);
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      console.log(`[AudioCrossfader] Audio decoded:`, {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels
      });

      this.sources.set(trackId, { buffer: audioBuffer });
      return true;
    } catch (error) {
      console.error('[AudioCrossfader] Error loading track:', error);
      return false;
    }
  }

  async play(trackId: string, startTime: number = 0, endTime?: number) {
    try {
      console.log(`[AudioCrossfader] Play called:`, {
        trackId,
        startTime,
        endTime,
        audioContextState: this.audioContext.state
      });

      await this.ensureContext();

      const track = this.sources.get(trackId);
      if (!track) {
        console.error(`[AudioCrossfader] Track not found: ${trackId}`);
        return;
      }

      // Create and connect nodes
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = track.buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Store nodes
      track.source = source;
      track.gain = gainNode;

      // Start playback
      console.log('[AudioCrossfader] Starting playback:', {
        startTime: startTime / 1000,
        duration: (endTime ? (endTime - startTime) / 1000 : undefined)
      });

      source.start(0, startTime / 1000);
      gainNode.gain.setValueAtTime(1, this.audioContext.currentTime);

      this.currentTrackId = trackId;

    } catch (error) {
      console.error('[AudioCrossfader] Error during playback:', error);
    }
  }

  stop(trackId: string) {
    const track = this.sources.get(trackId);
    if (track?.source) {
      const currentTime = this.audioContext.currentTime;
      // Fade out over 0.5 seconds before stopping
      if (track.gain) {
        track.gain.gain.setValueAtTime(track.gain.gain.value, currentTime);
        track.gain.gain.linearRampToValueAtTime(0, currentTime + 0.5);
      }
      setTimeout(() => {
        track.source?.stop();
        track.source = undefined;
        track.gain = undefined;
      }, 500);
    }
    if (this.currentTrackId === trackId) {
      this.currentTrackId = null;
    }
  }

  stopAll() {
    this.sources.forEach((track, trackId) => {
      this.stop(trackId);
    });
  }

  getCurrentTime(trackId: string): number {
    const track = this.sources.get(trackId);
    if (!track?.source) return 0;
    return this.audioContext.currentTime * 1000; // Convert to ms
  }

  getTrackDuration(trackId: string): number {
    const track = this.sources.get(trackId);
    if (!track?.buffer) return 0;
    return track.buffer.duration * 1000; // Convert to ms
  }

  cleanup() {
    this.stopAll();
    this.audioContext.suspend().catch(console.error);
    this.sources.clear();
  }

  getStatus() {
    return {
      contextState: this.audioContext.state,
      currentTrack: this.currentTrackId,
      loadedTracks: Array.from(this.sources.keys()),
      baseLatency: this.audioContext.baseLatency,
      sampleRate: this.audioContext.sampleRate
    };
  }
} 