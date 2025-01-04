"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface SpotifyDevice {
  id: string;
  is_active: boolean;
  name: string;
  type: string;
}

export const DeviceSelector = ({ onDeviceSelected }: { onDeviceSelected?: (deviceId: string) => void }) => {
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('spotify_access_token');
      const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }
      
      const data = await response.json();
      setDevices(data.devices);
      
      // If no devices found, show helpful message
      if (data.devices.length === 0) {
        setError('No active Spotify devices found. Please open Spotify on any device and play/pause a track to make it visible.');
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      setError('Failed to load devices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activateDevice = async (deviceId: string) => {
    const token = localStorage.getItem('spotify_access_token');
    try {
      // First, transfer playback to the selected device
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false, // Don't start playing automatically
        }),
      });

      // Store the selected device ID in localStorage
      localStorage.setItem('spotify_active_device', deviceId);
      
      // Notify parent component
      onDeviceSelected?.(deviceId);
    } catch (error) {
      console.error('Error activating device:', error);
      setError('Failed to activate device. Please try again.');
    }
  };

  // Fetch devices when component mounts
  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Select a Spotify Device</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
            <p>Loading devices...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-gray-400">No devices found. Please:</p>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-2">
                <li>Open Spotify on your phone, tablet, or computer</li>
                <li>Start playing any track (then pause it)</li>
                <li>Click refresh below</li>
              </ul>
            </div>
            <Button onClick={fetchDevices} className="w-full">
              Refresh Devices
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <button
                key={device.id}
                onClick={() => activateDevice(device.id)}
                className={`w-full p-4 rounded-lg text-left transition-colors
                  ${device.is_active 
                    ? 'bg-green-500/20 border border-green-500/50' 
                    : 'bg-white/5 hover:bg-white/10'}`}
              >
                <div className="font-medium">{device.name}</div>
                <div className="text-sm text-gray-400">{device.type}</div>
              </button>
            ))}
            <Button onClick={fetchDevices} variant="outline" className="w-full mt-4">
              Refresh Devices
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}; 