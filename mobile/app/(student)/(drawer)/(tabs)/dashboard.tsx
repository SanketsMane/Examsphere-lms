/// <reference types="nativewind/types" />
import React, { useEffect } from "react";
import { 
  View, 
  ScrollView, 
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { toast } from "sonner-native";
import { useAuthStore } from "../../../../stores/authStore";
import { useStudent } from "../../../../hooks/useStudent";
import { useCourses } from "../../../../hooks/useCourses";
import { useExams } from "../../../../hooks/useExams";
import { StatCard } from "../../../../components/dashboard/StatCard";
import { CourseSkeleton } from "../../../../components/skeletons/CourseSkeleton";
import { ExamSkeleton } from "../../../../components/skeletons/ExamSkeleton";
import { Button, Typography, Card, Badge, GlassCard } from "../../../../components/ui";

import { Bell, BookOpen, Calendar, ArrowRight, Play, User as UserIcon, Menu } from "lucide-react-native";
import { useRouter, useNavigation } from "expo-router";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useSessions } from "../../../../hooks/useSessions";

/**
 * Premium Student Dashboard Screen
 * Sanket
 */
import { UrgentItem, UrgentActionStack } from '../../../../components/dashboard/UrgentActionStack';
import { ResumeLearningHero } from '../../../../components/dashboard/ResumeLearningHero';
import { ProgressStats } from '../../../../components/dashboard/ProgressStats';
import { QuickActionsGrid } from '../../../../components/dashboard/QuickActionsGrid';


import { useDashboardData } from '../../../../hooks/useDashboardData';

export default function StudentDashboard() {
  const user = useAuthStore((state: any) => state.user);
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // React Query Hook - The Single Source of Truth
  const { data: dashboardResponse, isLoading, error, refetch } = useDashboardData();
  const dashboardData = dashboardResponse?.data;

  const onRefresh = () => {
    refetch();
  };

  useEffect(() => {
    if (error) {
      toast.error("Failed to load dashboard. Retrying...");
    }
  }, [error]);

  const layout = dashboardData?.layout || [];

  // Render Component Mapping
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'hero_resume':
        // If welcome type, handle logic inside Hero or pass prop
        if (dashboardData?.hero.type === 'welcome') {
             return <ResumeLearningHero key={sectionId} course={null} isLoading={false} />;
        }
        return (
          <ResumeLearningHero 
            key={sectionId}
            course={dashboardData?.hero.data as any} 
            isLoading={isLoading} 
          />
        );
      case 'urgent_actions':
        if (!dashboardData?.urgent || dashboardData.urgent.length === 0) return null;
        return <UrgentActionStack key={sectionId} items={dashboardData.urgent} />;
      case 'progress_stats':
        return (
          <ProgressStats 
            key={sectionId}
            streak={dashboardData?.stats.streak}
            hoursLearned={dashboardData?.stats.hoursLearned}
            completionRate={dashboardData?.stats.completionRate}
          />
        );
      case 'quick_actions':
        return <QuickActionsGrid key={sectionId} />;
      case 'mentorship':
        return (
          <View key={sectionId} className="mb-8">
             <Card className="bg-slate-900 border-0 p-0 overflow-hidden" innerClassName="p-0">
               <View className="flex-row items-center p-6">
                 <View className="flex-1 pr-4">
                   <Typography variant="h4" className="text-white mb-1">Expert Mentorship</Typography>
                   <Typography variant="small" className="text-slate-300 leading-5 mb-3">
                     Stuck on a concept? specific 1-on-1 help is available.
                   </Typography>
                   <TouchableOpacity className="bg-white/10 self-start px-4 py-2 rounded-xl border border-white/20">
                      <Typography variant="small" weight="bold" className="text-white">Find a Mentor</Typography>
                   </TouchableOpacity>
                 </View>
                 <View className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl items-center justify-center">
                    <UserIcon size={28} color="white" />
                 </View>
               </View>
             </Card>
          </View>
        );
      case 'recommendations':
        // We can implement a Horizontal Course List here later
        return null; 
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-background" edges={['top', 'bottom']}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        {/* Header - Minimal & Clean */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => navigation.openDrawer()}
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm mr-4"
            >
              <Menu size={20} color={isDark ? "#e2e8f0" : "#334155"} />
            </TouchableOpacity>
            <View>
              <Typography variant="small" className="text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase text-[10px]">
                Welcome Back
              </Typography>
              <Typography variant="h3" className="leading-tight">
                {user?.name?.split(' ')[0] || "Student"}
              </Typography>
            </View>
          </View>
          
          <View className="flex-row items-center gap-3">
            <TouchableOpacity 
              onPress={() => router.push("/(student)/notifications")}
              className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full items-center justify-center active:scale-95 shadow-sm"
            >
              <Bell size={18} color={isDark ? "#94A3B8" : "#64748B"} />
              <View className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800" />
            </TouchableOpacity>
            
             <TouchableOpacity 
              onPress={() => router.push("/(student)/(drawer)/(tabs)/profile")}
              className="w-10 h-10 bg-indigo-600 rounded-full items-center justify-center shadow-md shadow-indigo-500/20 active:scale-95"
            >
               <Typography weight="bold" className="text-white text-base">
                 {user?.name?.charAt(0) || "S"}
               </Typography>
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View className="py-20">
             <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <View>
            {layout
              .filter((section: any) => section.visible)
              .map((section: any) => renderSection(section.id))
            }
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

