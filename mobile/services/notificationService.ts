import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from '../utils/storage';
import { ApiResponse } from '../types';
import api from './api';

/**
 * Notification Service
 * Handles push notification permissions and token generation
 * Sanket
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface Notification {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export const notificationService = {
  registerForPushNotifications: async (): Promise<string | undefined> => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return undefined;
      }
      
      try {
          const projectId = 
            Constants?.expoConfig?.extra?.eas?.projectId ?? 
            Constants?.easConfig?.projectId;
          
          if (!projectId) {
            console.warn("⚠️ [Push] Project ID not found. Registration skipped. (Run 'eas project:init' to enable push)");
            return undefined;
          }

          console.log(`[Push] Attempting registration for Project ID: ${projectId}`);

          token = (await Notifications.getExpoPushTokenAsync({
            projectId,
          })).data;
          
          // Cache the token
          await storage.save("push_token", token);
          console.log("✅ [Push] Registered successfully:", token);
      } catch (error: any) {
          console.error("❌ [Push] Error fetching token:", error.message);
          if (error.message.includes("EXPERIENCE_NOT_FOUND")) {
            console.error("💡 TIP: This means the projectId in app.json does not exist on Expo servers.");
          }
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  },

  // Retrieve notifications
  getNotifications: async (): Promise<ApiResponse<{ notifications: Notification[] }>> => {
    try {
      const response = await api.get("/api/notifications");
      return { 
        status: "success", 
        data: { notifications: response.data || [] } 
      };
    } catch (error: any) {
      return {
        status: "error",
        message: error.response?.data?.message || "Failed to fetch notifications"
      };
    }
  },

  markAsRead: async (id: string) => {
    return { status: "success" };
  },

  markAllAsRead: async () => {
    return { status: "success" };
  },

  // Add listeners
  addNotificationReceivedListener: (callback: (notification: Notifications.Notification) => void) => {
      return Notifications.addNotificationReceivedListener(callback);
  },

  addNotificationResponseReceivedListener: (callback: (response: Notifications.NotificationResponse) => void) => {
      return Notifications.addNotificationResponseReceivedListener(callback);
  }
};
