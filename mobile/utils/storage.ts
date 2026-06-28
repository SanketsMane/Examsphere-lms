import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

/**
 * Mobile Storage & Caching Utility
 * Sanket
 */

const CACHE_PREFIX = "@examsphere_cache_";
const MEDIA_DIR = `${(FileSystem as any).documentDirectory}media/`;

export const storage = {
  // Key-Value Storage
  save: async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Error saving to AsyncStorage", e);
    }
  },

  load: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.error("Error loading from AsyncStorage", e);
      return null;
    }
  },

  remove: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error("Error removing from AsyncStorage", e);
    }
  },

  // API Caching with Expiry
  cacheApi: async (key: string, data: any, ttlHours: number = 24) => {
    const expiry = Date.now() + ttlHours * 60 * 60 * 1000;
    await storage.save(`${CACHE_PREFIX}${key}`, { data, expiry });
  },

  getCachedApi: async <T>(key: string): Promise<T | null> => {
    const cached = await storage.load<{ data: T; expiry: number }>(`${CACHE_PREFIX}${key}`);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    return null;
  },

  // Media Download for Offline
  ensureDirExists: async () => {
    const dirInfo = await FileSystem.getInfoAsync(MEDIA_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
    }
  },

  downloadFile: async (url: string, filename: string): Promise<string | null> => {
    try {
      await storage.ensureDirExists();
      const fileUri = `${MEDIA_DIR}${filename}`;
      const downloadRes = await FileSystem.downloadAsync(url, fileUri);
      return downloadRes.uri;
    } catch (e) {
      console.error("Error downloading file", e);
      return null;
    }
  },

  getLocalUri: (filename: string): string => {
    return `${MEDIA_DIR}${filename}`;
  }
};
