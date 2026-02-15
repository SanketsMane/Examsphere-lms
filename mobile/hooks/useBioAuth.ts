import * as LocalAuthentication from "expo-local-authentication";
import { Alert } from "react-native";

/**
 * Biometric Authentication Hook
 * Sanket
 */
export const useBioAuth = () => {
  const authenticate = async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return false;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert(
          "Biometrics Not Enrolled",
          "Please set up biometrics on your device to use this feature."
        );
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Sign in with Biometrics",
        fallbackLabel: "Use Password",
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error("[BioAuth Error]", error);
      return false;
    }
  };

  return { authenticate };
};
