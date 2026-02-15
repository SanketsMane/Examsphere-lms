import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "../stores/authStore";
import { useOnboardingStore } from "../stores/onboardingStore";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect } from "react";

/**
 * Entry Point Router
 * Handles intelligent redirection between Onboarding, Auth, and Dashboard.
 * Sanket
 */
export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { hasCompletedOnboarding } = useOnboardingStore();

  const onReady = useCallback(async () => {
    if (!isLoading) {
      // Hide splash screen once auth state is determined
      // Sanket
      await SplashScreen.hideAsync().catch(() => {
         // Ignore errors on double hide or race conditions
      });
    }
  }, [isLoading]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(student)/dashboard" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(auth)/login" />;
}

