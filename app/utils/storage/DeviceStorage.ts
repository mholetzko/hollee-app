
interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

export const DeviceStorage = {
  key: 'spotify_active_devices',

  save: (devices: SpotifyDevice[]) => {
    try {
      localStorage.setItem(DeviceStorage.key, JSON.stringify(devices));
      console.log("[Device Storage] Devices saved:", devices.length);
    } catch (error) {
      console.error("[Device Storage] Error saving devices:", error);
    }
  },

  load: (): SpotifyDevice[] => {
    try {
      const stored = localStorage.getItem(DeviceStorage.key);
      const devices = stored ? JSON.parse(stored) : [];
      console.log("[Device Storage] Devices loaded:", devices.length);
      return devices;
    } catch (error) {
      console.error("[Device Storage] Error loading devices:", error);
      return [];
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(DeviceStorage.key);
      console.log("[Device Storage] Devices cleared");
    } catch (error) {
      console.error("[Device Storage] Error clearing devices:", error);
    }
  }
};

export default DeviceStorage; 