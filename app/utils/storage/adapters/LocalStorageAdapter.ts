export const LocalStorageAdapter = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[LocalStorageAdapter] Error getting item:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('[LocalStorageAdapter] Error setting item:', error);
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[LocalStorageAdapter] Error removing item:', error);
    }
  },

  getAllKeys: (): string[] => {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('[LocalStorageAdapter] Error getting all keys:', error);
      return [];
    }
  }
}; 