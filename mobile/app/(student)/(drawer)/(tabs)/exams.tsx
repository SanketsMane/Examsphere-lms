import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  View, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Trophy, 
  ChevronRight, 
  Menu,
  GraduationCap,
  History,
  AlertCircle
} from "lucide-react-native";
import { useRouter, useNavigation } from "expo-router";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { examService } from "../../../../services/examService";
import { Exam } from "../../../../types";
import { Typography, Card, Badge, GlassCard } from "../../../../components/ui";
import { useColorScheme } from "nativewind";
import { cn } from "../../../../utils/cn";

type TabType = "upcoming" | "completed" | "missed";

/**
 * Premium Exams Management Screen
 * Redesigned with Standard Header & Tabs
 * Sanket
 */
const ExamsScreen = () => {
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabType>("upcoming");

  const { data: examsResponse, isLoading, refetch } = useQuery({
    queryKey: ["exams"],
    queryFn: () => examService.getExams(),
  });

  const allExams = examsResponse?.data || [];
  
  // Filter exams based on active tab
  const filteredExams = allExams.filter((exam) => {
    if (activeTab === "upcoming") return exam.status === "upcoming" || exam.status === "ongoing";
    if (activeTab === "completed") return exam.status === "completed";
    if (activeTab === "missed") return false; // Mock logic, ideally status should support 'missed'
    return true;
  });

  const TabPill = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
    <TouchableOpacity 
      onPress={() => setActiveTab(id)}
      activeOpacity={0.8}
      className={cn(
        "flex-row items-center px-5 py-2.5 rounded-full mr-3 border transition-all",
        activeTab === id 
          ? "bg-primary border-primary shadow-md shadow-primary/30" 
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
      )}
    >
      <Icon size={14} color={activeTab === id ? "#FFFFFF" : isDark ? "#94a3b8" : "#64748b"} strokeWidth={2.5} />
      <Typography 
        weight="bold" 
        className={cn(
          "ml-2 text-xs uppercase tracking-wide", 
          activeTab === id ? "text-white" : "text-slate-600 dark:text-slate-400"
        )}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  );

  const getBadgeVariant = (status: Exam["status"]): any => {
    switch (status) {
      case "upcoming": return "default";
      case "ongoing": return "warning";
      case "completed": return "success";
      default: return "secondary";
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-[#020817]">
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Safe Area Fix */}
      <View style={{ paddingTop: insets.top }} className="flex-1">
        
        {/* Header Section (Standardized) */}
        <View className="px-6 pt-4 pb-4">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <TouchableOpacity 
                onPress={() => navigation.openDrawer()}
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm mr-4"
              >
                <Menu size={20} color={isDark ? "#e2e8f0" : "#334155"} />
              </TouchableOpacity>
              <View>
                <Typography variant="h2" weight="black" className="text-slate-900 dark:text-white leading-tight">
                  My Exams
                </Typography>
                <Typography variant="small" className="text-slate-500 dark:text-slate-400 font-medium">
                  Track your progress
                </Typography>
              </View>
            </View>
            
            <View className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 items-center justify-center">
               <GraduationCap size={20} color={isDark ? "#818cf8" : "#4f46e5"} />
            </View>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 h-12 rounded-2xl shadow-sm">
              <Search size={18} color={isDark ? "#64748b" : "#94a3b8"} />
              <Typography className="ml-3 text-slate-400 dark:text-slate-500 text-base font-medium">
                Search assessments...
              </Typography>
            </View>
          </View>

          {/* Tabs */}
          <FlatList 
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { id: 'upcoming', label: 'Upcoming', icon: Calendar },
              { id: 'completed', label: 'Completed', icon: History },
              { id: 'missed', label: 'Missed', icon: AlertCircle },
            ]}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
                <TabPill id={item.id as TabType} label={item.label} icon={item.icon} />
            )}
            contentContainerStyle={{ paddingRight: 20 }}
          />
        </View>

        {/* Content List */}
        <FlatList 
          data={filteredExams}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, paddingTop: 10 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={isDark ? "#3b82f6" : "#2563EB"} />
          }
          renderItem={({ item: exam }) => (
            <Card 
              className="mb-6 p-0 border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-3xl"
              innerClassName="p-0"
              onPress={() => exam.status === "upcoming" && router.push(`/(student)/exam/${exam.id}`)}
            >
              <View className="p-6">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1 mr-4">
                    <Typography variant="h4" weight="bold" numberOfLines={2} className="mb-2 text-slate-900 dark:text-white leading-6">
                        {exam.title}
                    </Typography>
                    <Typography variant="small" weight="medium" className="text-primary tracking-wide uppercase text-[10px]">
                        {exam.courseTitle}
                    </Typography>
                  </View>
                  <Badge label={exam.status} variant={getBadgeVariant(exam.status)} />
                </View>

                <View className="flex-row items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800">
                  <View className="flex-row items-center space-x-6 gap-4">
                    <View className="flex-row items-center">
                      <Calendar size={14} color={isDark ? "#94a3b8" : "#64748b"} />
                      <Typography variant="small" className="ml-2 text-slate-500 font-medium">{exam.date}</Typography>
                    </View>
                    <View className="flex-row items-center">
                      <Clock size={14} color={isDark ? "#94a3b8" : "#64748b"} />
                      <Typography variant="small" className="ml-2 text-slate-500 font-medium">{exam.duration}m</Typography>
                    </View>
                  </View>
                  
                  {exam.status === "completed" ? (
                    <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                      <Trophy size={14} color="#10B981" />
                      <Typography variant="small" weight="bold" className="text-emerald-600 dark:text-emerald-400 ml-1.5">
                          {exam.result || "A+"}
                      </Typography>
                    </View>
                  ) : (
                    <View className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 items-center justify-center border border-slate-100 dark:border-slate-700">
                      <ChevronRight size={16} color={isDark ? "#94a3b8" : "#64748b"} />
                    </View>
                  )}
                </View>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            !isLoading ? (
                <View className="flex-1 items-center justify-center py-20 px-4">
                    <View className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-6">
                        <GraduationCap size={32} color={isDark ? "#64748b" : "#94a3b8"} />
                    </View>
                    <Typography variant="h4" weight="bold" className="text-center text-slate-800 dark:text-slate-200">
                      No {activeTab} exams
                    </Typography>
                    <Typography className="text-center text-slate-500 dark:text-slate-400 mt-2 leading-5">
                      {activeTab === 'upcoming' 
                        ? "You're all clear! No exams scheduled." 
                        : "You haven't completed any exams yet."}
                    </Typography>
                </View>
            ) : <View className="mt-10"><ActivityIndicator color="#3b82f6" /></View>
          }
        />
      </View>
    </View>
  );
};

export default ExamsScreen;
