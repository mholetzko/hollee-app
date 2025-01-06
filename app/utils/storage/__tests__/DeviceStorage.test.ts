import { DeviceStorage } from '../DeviceStorage';

describe('DeviceStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockDevices = [
    {
      id: 'device1',
      name: 'Device 1',
      type: 'Smartphone',
      is_active: true
    },
    {
      id: 'device2',
      name: 'Device 2',
      type: 'Computer',
      is_active: false
    }
  ];

  it('should save and load devices', () => {
    // Save devices
    DeviceStorage.save(mockDevices);

    // Load devices
    const loadedDevices = DeviceStorage.load();

    // Verify
    expect(loadedDevices).toEqual(mockDevices);
  });

  it('should clear devices', () => {
    // Save devices
    DeviceStorage.save(mockDevices);

    // Clear devices
    DeviceStorage.clear();

    // Verify devices are cleared
    const loadedDevices = DeviceStorage.load();
    expect(loadedDevices).toEqual([]);
  });

  it('should handle invalid stored data', () => {
    // Manually set invalid data
    localStorage.setItem(DeviceStorage.key, 'invalid-json');

    // Should handle error and return empty array
    const devices = DeviceStorage.load();
    expect(devices).toEqual([]);
  });

  it('should handle invalid JSON when loading devices', () => {
    // Set invalid JSON in localStorage
    localStorage.setItem('spotify-devices', 'invalid-json');
    
    // Should return empty array when encountering invalid JSON
    const devices = DeviceStorage.load();
    expect(devices).toEqual([]);
  });
}); 