import * as FileSystem from "expo-file-system";
import { storage } from "../utils/storage";
import { ApiResponse } from "../types";

/**
 * Offline Content Service
 * Manages downloading and accessing course content offline.
 * Sanket
 */

export const offlineService = {
  // --- Resources ---

  downloadResource: async (url: string, resourceId: string, filename: string): Promise<ApiResponse<string>> => {
    try {
      const extension = filename.split('.').pop() || 'file';
      const localFilename = `resource_${resourceId}.${extension}`;
      
      const uri = await storage.downloadFile(url, localFilename);
      
      if (uri) {
        // Track this download in a persistent list if needed, 
        // for now simple file existence is enough for "isDownloaded" check if we name deterministically.
        return { status: "success", data: uri };
      } else {
        return { status: "error", message: "Download failed" };
      }
    } catch (error: any) {
        return { status: "error", message: error.message };
    }
  },

  isResourceDownloaded: async (resourceId: string, originalFilename: string): Promise<boolean> => {
    const extension = originalFilename.split('.').pop() || 'file';
    const localFilename = `resource_${resourceId}.${extension}`;
    const uri = storage.getLocalUri(localFilename);
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  },

  getResourceUri: (resourceId: string, originalFilename: string): string => {
    const extension = originalFilename.split('.').pop() || 'file';
    const localFilename = `resource_${resourceId}.${extension}`;
    return storage.getLocalUri(localFilename);
  },

  // --- Videos ---

  downloadVideo: async (url: string, lessonId: string): Promise<ApiResponse<string>> => {
    try {
      // Assuming mp4 for now, or extract from URL
      const localFilename = `video_${lessonId}.mp4`;
      const uri = await storage.downloadFile(url, localFilename);
      
      if (uri) {
        return { status: "success", data: uri };
      } else {
        return { status: "error", message: "Video download failed" };
      }
    } catch (error: any) {
        return { status: "error", message: error.message };
    }
  },

  isVideoDownloaded: async (lessonId: string): Promise<boolean> => {
    const localFilename = `video_${lessonId}.mp4`;
    const uri = storage.getLocalUri(localFilename);
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  },

  getVideoUri: (lessonId: string): string => {
    const localFilename = `video_${lessonId}.mp4`;
    return storage.getLocalUri(localFilename);
  },
  
  // --- Cleanup ---
  
  deleteOfflineContent: async (filename: string): Promise<void> => {
     const uri = storage.getLocalUri(filename);
     await FileSystem.deleteAsync(uri, { idempotent: true });
  }
};
