"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SpotifyAuthStorage } from "../utils/storage/SpotifyAuthStorage";

interface SpotifyDevice {
  id: string;
  is_active: boolean;
  name: string;
  type: string;
}

export const DeviceSelector = ({
  onDeviceSelected,
}: {
  onDeviceSelected?: () => void;
}) => {
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const token = SpotifyAuthStorage.load();
      const response = await fetch(
        "https://api.spotify.com/v1/me/player/devices",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setDevices(data.devices);
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const activateDevice = async (deviceId: string) => {
    const token = SpotifyAuthStorage.load();
    try {
      await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_ids: [deviceId],
        }),
      });
      onDeviceSelected?.();
    } catch (error) {
      console.error("Error activating device:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Select a Spotify Device</h2>
        {loading ? (
          <p>Loading devices...</p>
        ) : devices.length === 0 ? (
          <div className="space-y-4">
            <p className="text-gray-400">No devices found. Please:</p>
            <ul className="list-disc list-inside text-sm text-gray-400 space-y-2">
              <li>Open Spotify on your phone or desktop</li>
              <li>Start playing any track (then pause it)</li>
              <li>Click refresh below</li>
            </ul>
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
                  ${
                    device.is_active
                      ? "bg-green-500/20 border border-green-500/50"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
              >
                <div className="font-medium">{device.name}</div>
                <div className="text-sm text-gray-400">{device.type}</div>
              </button>
            ))}
            <Button
              onClick={fetchDevices}
              variant="outline"
              className="w-full mt-4"
            >
              Refresh Devices
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
