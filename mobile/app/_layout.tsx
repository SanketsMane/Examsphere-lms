import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { View, Appearance } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from "../stores/authStore";
import { notificationService } from "../services/notificationService";
import { Toaster } from 'sonner-native';
// import { useColorScheme } from "nativewind";
import * as SplashScreen from 'expo-splash-screen';
import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
// Sanket
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might cause this error, safe to ignore */
});

const queryClient = new QueryClient();

export default function RootLayout() {
  // const { colorScheme } = useColorScheme();
  // Using React Native Appearance to avoid Navigation Context crash in RootLayout
  // const colorScheme = Appearance.getColorScheme(); 
  // Moved logic to render time to ensure freshness
  
  console.log("RootLayout Re-render");
  const initialize = useAuthStore((state: any) => state.initialize);
  const isLoading = useAuthStore((state: any) => state.isLoading);
  const isAuthenticated = useAuthStore((state: any) => state.isAuthenticated);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // Track if we already tried registering to avoid redundant logs
  const registrationAttempted = useRef(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Only register for push notifications AFTER authentication to prevent noise
    // and ensuring we have a user context if needed. - Author: Sanket
    if (isAuthenticated && !registrationAttempted.current) {
      registrationAttempted.current = true;
      notificationService.registerForPushNotifications().then(token => {
        if (token) {
          console.log("Push Token Registered:", token);
        }
      });
    }

    if (isAuthenticated) {
      notificationListener.current = notificationService.addNotificationReceivedListener(notification => {
        console.log("Notification Received:", notification);
      });

      responseListener.current = notificationService.addNotificationResponseReceivedListener(response => {
        console.log("Notification Tap:", response);
      });
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
        notificationListener.current = null;
      }
      if (responseListener.current) {
        responseListener.current.remove();
        responseListener.current = null;
      }
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return null; 
  }

  const colorScheme = Appearance.getColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View className={`flex-1 ${colorScheme}`}>
            <StatusBar style={isDark ? "light" : "dark"} animated />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(auth)/login" options={{ presentation: 'modal' }} />
              <Stack.Screen 
                name="(student)" 
                options={{ 
                  // Only wrap if we are in the student flow
                }} 
              />
            </Stack>
            <Toaster />
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
