import React, { useState } from "react";
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Switch
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight, Bell, BookOpen, Clock, Tag, MessageSquare } from "lucide-react-native";
import { Typography } from "../../../components/ui";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { cn } from "../../../utils/cn";

/**
 * Notifications Settings Screen
 * Granular Push Preference Control
 * Sanket
 */
export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [preferences, setPreferences] = useState({
    courseUpdates: true,
    assignments: true,
    reminders: true,
    promotions: false,
    mentorship: true,
    community: false,
  });

  const toggleSwitch = (key: string) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key as keyof typeof preferences] }));
  };

  const ToggleItem = ({ icon: Icon, label, description, stateKey, isLast }: any) => (
    <View className={cn(
      "flex-row items-center p-5 justify-between",
      !isLast && "border-b border-slate-100 dark:border-slate-800/50"
    )}>
       <View className="flex-row items-center flex-1 mr-4">
          <View className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 items-center justify-center mr-4">
             <Icon size={20} color={isDark ? "#94a3b8" : "#64748b"} />
          </View>
          <View className="flex-1">
             <Typography weight="bold" className="text-slate-900 dark:text-white text-[15px]">{label}</Typography>
             <Typography className="text-slate-500 text-xs mt-0.5 leading-4">{description}</Typography>
          </View>
       </View>
       <Switch 
         value={preferences[stateKey as keyof typeof preferences]} 
         onValueChange={() => toggleSwitch(stateKey)}
         trackColor={{ false: "#e2e8f0", true: "#3b82f6" }}
         thumbColor={"#ffffff"}
       />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#020817]" edges={['top']}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-6">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center shadow-sm active:scale-95"
        >
          <ChevronRight size={20} color={isDark ? "#e2e8f0" : "#334155"} className="rotate-180" />
        </TouchableOpacity>
        <Typography variant="h4" weight="bold" className="text-slate-900 dark:text-white">Notifications</Typography>
        <View className="w-10" />
      </View>

      <ScrollView 
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl mb-8 border border-blue-100 dark:border-blue-500/20 flex-row items-center">
           <Bell size={24} color="#3b82f6" className="mr-4" />
           <Typography className="text-blue-700 dark:text-blue-400 text-sm flex-1 leading-5">
              Control which emails and push notifications you receive from Kidokool.
           </Typography>
        </View>

        <Typography weight="bold" className="text-slate-400 text-xs uppercase tracking-widest mb-4 ml-2">
          Learning Activity
        </Typography>

        <View className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm mb-8">
           <ToggleItem 
             icon={BookOpen}
             label="Course Updates"
             description="New lessons, quizzes and materials added"
             stateKey="courseUpdates"
           />
           <ToggleItem 
             icon={Clock}
             label="Reminders"
             description="Study streaks and scheduled sessions"
             stateKey="reminders"
           />
           <ToggleItem 
             icon={MessageSquare}
             label="Mentorship"
             description="Messages from your instructors"
             stateKey="mentorship"
             isLast
           />
        </View>


        <Typography weight="bold" className="text-slate-400 text-xs uppercase tracking-widest mb-4 ml-2">
          Other
        </Typography>

        <View className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm mb-8">
           <ToggleItem 
             icon={Tag}
             label="Offers & Promotions"
             description="Discounts and special offers for you"
             stateKey="promotions"
             isLast
           />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
