import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  View, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  RefreshControl,
  Image
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, Filter, BookOpen, LayoutGrid, Heart, Menu, Sparkles, Compass } from "lucide-react-native";
import { useRouter, useNavigation } from "expo-router";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { courseService } from "../../../../services/courseService";
import { engagementService } from "../../../../services/engagementService";
import { CourseCard } from "../../../../components/dashboard/CourseCard";
import { CourseSkeleton } from "../../../../components/skeletons/CourseSkeleton";
import { Course } from "../../../../types";
import { Typography, GlassCard } from "../../../../components/ui";
import { cn } from "../../../../utils/cn";

type TabType = "enrolled" | "explore" | "saved";

/**
 * Premium Courses Catalog Screen
 * Completely Redesigned for "Senior UI/UX" Standards.
 * Fixed "Hiding under notch" issue.
 * Sanket
 */
export default function CoursesScreen() {
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [activeTab, setActiveTab] = useState<TabType>("enrolled");
  const [searchQuery, setSearchQuery] = useState("");
  const insets = useSafeAreaInsets();

  const { data: enrolledResponse, isLoading: enrolledLoading, refetch: refetchEnrolled } = useQuery({
    queryKey: ["enrolledCourses"],
    queryFn: () => courseService.getEnrolledCourses(),
  });

  const { data: exploreResponse, isLoading: exploreLoading, refetch: refetchExplore } = useQuery({
    queryKey: ["allCourses"],
    queryFn: () => courseService.getAllCourses(),
  });

  const { data: savedResponse, isLoading: savedLoading, refetch: refetchSaved } = useQuery({
    queryKey: ["savedCourses"],
    queryFn: () => engagementService.getWishlist(),
  });

  const enrolledCourses = enrolledResponse?.data || [];
  const exploreCourses = exploreResponse?.data || [];
  const savedCourses = savedResponse?.data || [];

  let currentCourses: Course[] = [];
  let isLoading = false;

  switch (activeTab) {
    case "enrolled":
      currentCourses = enrolledCourses;
      isLoading = enrolledLoading;
      break;
    case "explore":
      currentCourses = exploreCourses;
      isLoading = exploreLoading;
      break;
    case "saved":
      currentCourses = savedCourses;
      isLoading = savedLoading;
      break;
  }

  const filteredCourses = currentCourses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = () => {
    if (activeTab === "enrolled") refetchEnrolled();
    else if (activeTab === "explore") refetchExplore();
    else refetchSaved();
  };

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

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

  return (
    <View className="flex-1 bg-slate-50 dark:bg-[#020817]">
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* 
         SAFE AREA FIX:
         Using padding top equal to insets.top to strictly respect the notch.
      */}
      <View style={{ paddingTop: insets.top }} className="flex-1">
        
        {/* Header Section */}
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
                  Learning Hub
                </Typography>
                <Typography variant="small" className="text-slate-500 dark:text-slate-400 font-medium">
                  Expand your knowledge today
                </Typography>
              </View>
            </View>
            
            {/* Contextual Icon based on Tab */}
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
               {activeTab === 'explore' ? (
                 <Compass size={20} color={isDark ? "#60a5fa" : "#2563EB"} />
               ) : activeTab === 'saved' ? (
                 <Heart size={20} color={isDark ? "#f472b6" : "#db2777"} />
               ) : (
                 <Sparkles size={20} color={isDark ? "#fbbf24" : "#d97706"} />
               )}
            </View>
          </View>

          {/* Search Bar - Modern Floating Style */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 h-12 rounded-2xl shadow-sm">
              <Search size={18} color={isDark ? "#64748b" : "#94a3b8"} />
              <TextInput
                className="flex-1 ml-3 text-slate-900 dark:text-white text-base font-medium h-full"
                placeholder={
                    activeTab === "enrolled" ? "Search my courses..." : 
                    activeTab === "saved" ? "Search wishlist..." : 
                    "What do you want to learn?"
                }
                placeholderTextColor={isDark ? "#475569" : "#94a3b8"}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity className="ml-3 w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl items-center justify-center shadow-sm active:opacity-70">
              <Filter size={18} color={isDark ? "#e2e8f0" : "#334155"} />
            </TouchableOpacity>
          </View>

          {/* Modern Scrollable Tab Switcher */}
          <View>
            <FlatList 
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[
                { id: 'enrolled', label: 'My Courses', icon: BookOpen },
                { id: 'explore', label: 'Discover', icon: Compass },
                { id: 'saved', label: 'Wishlist', icon: Heart },
              ]}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                 <TabPill id={item.id as TabType} label={item.label} icon={item.icon} />
              )}
              contentContainerStyle={{ paddingRight: 20 }}
            />
          </View>
        </View>

        {/* Courses List Content */}
        {isLoading && currentCourses.length === 0 ? (
          <View className="flex-1 px-6 pt-4">
             {[1, 2, 3].map(i => <View key={i} className="mb-8"><CourseSkeleton /></View>)}
          </View>
        ) : (
          <FlatList
            data={filteredCourses}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140, paddingTop: 20 }}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={isDark ? "#3b82f6" : "#2563EB"} />
            }
            renderItem={({ item }) => (
              <View className="mb-8">
                <CourseCard
                  title={item.title}
                  category={item.category}
                  price={item.price}
                  duration={item.duration}
                  lessons={item.chapters?.reduce((acc: any, c: any) => acc + (c.lessons?.length || 0), 0) || 0}
                  rating={item.averageRating || 0}
                  reviews={item.totalReviews || 0}
                  instructor={item.instructor?.name || "Expert Instructor"}
                  isEnrolled={activeTab === "enrolled"}
                  onPress={() => router.push(`/(student)/course/${item.slug}`)}
                />
              </View>
            )}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center mt-10 px-8">
                {searchQuery ? (
                  <View className="items-center py-10 opacity-70">
                    <Search size={48} color={isDark ? "#475569" : "#cbd5e1"} strokeWidth={1.5} />
                    <Typography variant="h4" weight="bold" className="mt-4 text-center text-slate-700 dark:text-slate-300">
                      No matches found
                    </Typography>
                    <Typography variant="small" className="text-center text-slate-500 dark:text-slate-500 mt-2">
                       We couldn't find anything for "{searchQuery}"
                    </Typography>
                  </View>
                ) : (
                  <View className="w-full items-center justify-center py-12">
                     <View className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-6">
                        {activeTab === "enrolled" ? (
                          <LayoutGrid size={32} color={isDark ? "#64748b" : "#94a3b8"} />
                        ) : activeTab === "saved" ? (
                          <Heart size={32} color={isDark ? "#f472b6" : "#db2777"} />
                        ) : (
                          <Compass size={32} color={isDark ? "#64748b" : "#94a3b8"} />
                        )}
                     </View>
                    <Typography variant="h4" weight="bold" className="text-center text-slate-800 dark:text-slate-200">
                      {activeTab === "enrolled" ? "Start your journey" : activeTab === "saved" ? "Your wishlist is empty" : "No courses found"}
                    </Typography>
                    <Typography className="text-center text-slate-500 dark:text-slate-400 mt-2 px-6 leading-5">
                      {activeTab === "enrolled" 
                        ? "You haven't enrolled in any courses yet. Browse the catalog to get started!" 
                        : activeTab === "saved"
                        ? "Save interesting courses here to watch them later."
                        : "Check back later for new content."}
                    </Typography>
                    
                    {activeTab === "enrolled" && (
                      <TouchableOpacity 
                        onPress={() => setActiveTab('explore')}
                        className="mt-8 bg-primary px-8 py-3 rounded-xl shadow-lg shadow-primary/30 active:scale-95"
                      >
                         <Typography weight="bold" className="text-white">Browse Courses</Typography>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}
