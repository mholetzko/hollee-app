export const SpotifyAuthStorage = {
  key: 'spotify_access_token',

  save: (token: string) => {
    try {
      localStorage.setItem(SpotifyAuthStorage.key, token);
      console.log("[Auth Storage] Token saved");
    } catch (error) {
      console.error("[Auth Storage] Error saving token:", error);
    }
  },

  load: (): string | null => {
    try {
      const token = localStorage.getItem(SpotifyAuthStorage.key);
      console.log("[Auth Storage] Token loaded");
      return token;
    } catch (error) {
      console.error("[Auth Storage] Error loading token:", error);
      return null;
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(SpotifyAuthStorage.key);
      console.log("[Auth Storage] Token cleared");
    } catch (error) {
      console.error("[Auth Storage] Error clearing token:", error);
    }
  }
}; 