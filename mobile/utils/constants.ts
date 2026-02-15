import Constants from "expo-constants";

/**
 * Mobile App Constants
 * Sanket
 */

// Use localhost for iOS simulator, 10.0.2.2 for Android emulator, and specific IP for physical devices
import { Platform } from "react-native";

// const DEV_URL = "http://192.168.1.37:3000"; // Physical Device
const DEV_URL = "http://192.168.1.37:3000"; // Physical Device & Simulators (Use LAN IP)
// const DEV_URL = Platform.select({
//   ios: "http://localhost:3000",
//   android: "http://10.0.2.2:3000",
//   default: "http://192.168.1.37:3000",
// });

export const API_URL = `${DEV_URL}`;

export const APP_CONFIG = {
  name: "Kidokool LMS",
  version: "1.0.0",
  developer: "Sanket",
};
