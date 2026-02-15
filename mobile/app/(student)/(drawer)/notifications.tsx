import React from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  Bell, 
  Info, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  MoreVertical,
  Circle
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { notificationService, Notification } from "../../../services/notificationService";
import { NotificationSkeleton } from "../../../components/skeletons/NotificationSkeleton";

/**
 * Notification Center Screen
 * Sanket
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: notificationData, isLoading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications(),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = notificationData?.data?.notifications || [];

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success": return <CheckCircle size={18} color="#10B981" />;
      case "warning": return <AlertCircle size={18} color="#F59E0B" />;
      case "error": return <XCircle size={18} color="#EF4444" />;
      default: return <Info size={18} color="#4D9FFF" />;
    }
  };

  const getNotificationBg = (type: Notification["type"]) => {
    switch (type) {
      case "success": return "bg-emerald-500/10";
      case "warning": return "bg-amber-500/10";
      case "error": return "bg-red-500/10";
      default: return "bg-primary/10";
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 bg-card border border-border rounded-xl items-center justify-center"
        >
          <ChevronLeft size={20} color="#94a3b8" />
        </TouchableOpacity>
        <Text className="text-foreground font-bold text-lg">Notifications</Text>
        <TouchableOpacity 
          onPress={() => markAllAsReadMutation.mutate()}
          className="px-3 py-1.5 bg-primary/10 rounded-lg"
          disabled={markAllAsReadMutation.isPending}
        >
          <Text className="text-primary text-xs font-bold">Mark all read</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="p-6">
          <NotificationSkeleton />
        </View>
      ) : (
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#4D9FFF" />
          }
        >
          <View className="p-6">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <TouchableOpacity 
                  key={notification.id}
                  activeOpacity={0.8}
                  onPress={() => !notification.isRead && markAsReadMutation.mutate(notification.id)}
                  className={`flex-row p-4 rounded-3xl mb-4 border border-border ${notification.isRead ? 'bg-card/40' : 'bg-card shadow-sm shadow-black/20'}`}
                >
                  <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${getNotificationBg(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className={`font-bold text-sm ${notification.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {notification.title}
                      </Text>
                      {!notification.isRead && <Circle size={8} color="#4D9FFF" fill="#4D9FFF" />}
                    </View>
                    <Text className="text-muted-foreground text-xs leading-5">
                      {notification.message}
                    </Text>
                    <Text className="text-[10px] text-muted-foreground/50 mt-2 font-medium">
                      {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="flex-1 items-center justify-center mt-20 px-6">
                <View className="w-20 h-20 bg-primary/5 rounded-full items-center justify-center mb-6">
                  <Bell size={32} color="#4D9FFF" className="opacity-80" />
                </View>
                <Text className="text-foreground font-bold text-lg text-center">No notifications yet</Text>
                <Text className="text-muted-foreground/60 text-sm text-center mt-2">
                  When you receive updates about your courses or exams, they'll appear here.
                </Text>
              </View>
            )}
          </View>
          <View className="h-20" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
