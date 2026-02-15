import React from 'react';
import { View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Typography } from '../ui/Typography';
import { Play, Sparkles, ChevronRight, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

// Import the generated asset (in a real app, this would be a require or responsive URI)
// For this environment, we assume the asset is placed in assets/images or we use a remote URL as fallback if local isn't possible directly in code.
// Since I cannot 'require' a dynamic artifact path in react-native without metro config, I will use a high-quality remote placeholder that matches the vibe if the local one fails, 
// BUT for this specific task, I will try to use a relative path if the user moves it, or a reliable placeholder.
// Strategy: Use a high-quality Unsplash image that matches the "3D" vibe as a reliable fallback.

const HERO_IMAGE_URI = 'https://cdn.dribbble.com/users/1206719/screenshots/17300445/media/17300445.png?resize=800x600&vertical=center'; 
// (Replacing the specific artifact path which might be fragile in code. Using a proven 3D illustration URL for stability)

interface ResumeLearningHeroProps {
  course?: {
    id: string;
    title: string;
    thumbnail?: string;
    progress: number;
    lastChapter?: string;
    lastLesson?: string;
    totalLessons?: number;
    completedLessons?: number;
    category?: string;
    slug: string;
  } | null;
  isLoading?: boolean;
}

export const ResumeLearningHero = ({ course, isLoading }: ResumeLearningHeroProps) => {
  const router = useRouter();

  if (isLoading) {
    return (
      <View className="w-full h-56 bg-slate-100 dark:bg-slate-800 rounded-[32px] animate-pulse mb-8" />
    );
  }

  // EMPTY STATE: "Start Journey" - Improved Visuals
  if (!course) {
    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => router.push('/(student)/(drawer)/(tabs)/courses')}
        className="mb-8"
      >
        <View className="w-full h-56 rounded-[32px] overflow-hidden relative shadow-xl shadow-indigo-500/20 bg-indigo-600">
           {/* Vibrant Background Gradient */}
           <LinearGradient
            colors={['#4f46e5', '#7c3aed']} // Indigo 600 -> Violet 600
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="absolute inset-0"
          />

          <View className="flex-row h-full">
            {/* Left Content */}
            <View className="flex-1 p-6 justify-between z-10">
              <View>
                <View className="bg-white/20 self-start px-3 py-1 rounded-full border border-white/20 mb-3 backdrop-blur-sm">
                  <Typography variant="small" className="text-white font-bold text-[10px] uppercase tracking-wider">
                    New Student
                  </Typography>
                </View>
                <Typography variant="h2" className="text-white font-bold leading-tight mb-2 text-2xl">
                  Start Your{'\n'}Journey
                </Typography>
                <Typography variant="small" className="text-indigo-100 font-medium leading-4">
                  Unlock your potential with premium courses.
                </Typography>
              </View>

              <View className="bg-white self-start px-5 py-2.5 rounded-xl flex-row items-center shadow-sm mt-2">
                 <Typography variant="small" weight="bold" className="text-indigo-600 mr-1">Explore</Typography>
                 <ChevronRight size={14} color="#4f46e5" strokeWidth={3} />
              </View>
            </View>

            {/* Right Image */}
            <View className="w-[45%] h-full relative justify-end items-end">
               {/* Decorative Circles */}
               <View className="absolute top-[-20] right-[-20] w-40 h-40 bg-white/10 rounded-full blur-2xl" />
               
               <Image 
                source={{ uri: "https://static.vecteezy.com/system/resources/previews/011/153/360/original/3d-web-development-concept-with-window-programming-code-on-screen-laptop-floating-isolated-on-transparent-background-3d-rendering-png.png" }}
                className="w-[140%] h-[140%] absolute bottom-[-10] right-[-20]"
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ACTIVE STATE: "Resume Learning" - Refined
  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => router.push(`/(student)/course/${course.slug}`)}
      className="mb-8"
    >
      <View className="w-full h-56 bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-xl shadow-indigo-500/10 border border-slate-100 dark:border-slate-800 relative">
        {/* Full Background Image */}
        <Image 
          source={{ uri: course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop' }} 
          className="absolute w-full h-full"
          resizeMode="cover"
        />
        
        {/* Gradient Overlay */}
        <LinearGradient
            colors={['transparent', 'rgba(15, 23, 42, 0.95)']}
            className="absolute inset-0"
            start={{ x: 0, y: 0.2 }}
            end={{ x: 0, y: 1 }}
        />

        <View className="p-6 h-full justify-end">
           <View className="flex-row justify-between items-end mb-4">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-2">
                   <View className="bg-blue-500 w-1.5 h-1.5 rounded-full mr-2" />
                   <Typography variant="small" className="text-blue-400 font-bold text-[10px] uppercase tracking-wider">
                     Resume Learning
                   </Typography>
                </View>
                <Typography variant="h3" className="text-white font-bold leading-tight" numberOfLines={2}>
                  {course.title}
                </Typography>
              </View>
              
              <View className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/20">
                 <Play size={20} color="white" fill="white" className="ml-1" />
              </View>
           </View>

           {/* Progress Section */}
           <View>
              <View className="flex-row justify-between mb-2">
                 <Typography variant="small" className="text-slate-300 font-medium text-xs">
                   {course.lastLesson || "Next Lesson"}
                 </Typography>
                 <Typography variant="small" className="text-white font-bold text-xs">
                   {Math.round(course.progress)}%
                 </Typography>
              </View>
              <View className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${course.progress}%` }} 
                />
              </View>
           </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
