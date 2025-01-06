import { SpotifyAuthStorage } from '@/app/utils/storage/SpotifyAuthStorage';

describe('SpotifyAuthStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockToken = 'mock-spotify-token';

  it('should save and load token', () => {
    // Save token
    SpotifyAuthStorage.save(mockToken);

    // Load token
    const loadedToken = SpotifyAuthStorage.load();

    // Verify
    expect(loadedToken).toBe(mockToken);
  });

  it('should clear token', () => {
    // Save token
    SpotifyAuthStorage.save(mockToken);

    // Clear token
    SpotifyAuthStorage.clear();

    // Verify token is cleared
    const loadedToken = SpotifyAuthStorage.load();
    expect(loadedToken).toBeNull();
  });

  it('should handle missing token', () => {
    const token = SpotifyAuthStorage.load();
    expect(token).toBeNull();
  });
}); 