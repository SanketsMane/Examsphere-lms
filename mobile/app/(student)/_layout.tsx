import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "../../stores/authStore";

import { PermissionGate } from "../../components/auth/PermissionGate";

export default function StudentLayout() {
  const isAuthenticated = useAuthStore((state: any) => state.isAuthenticated);
  const isLoading = useAuthStore((state: any) => state.isLoading);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <PermissionGate>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(drawer)" />
      </Stack>
    </PermissionGate>
  );
}
