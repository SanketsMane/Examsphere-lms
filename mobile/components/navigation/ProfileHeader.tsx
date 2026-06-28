import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Typography } from '../ui/Typography';
import { useRouter } from 'expo-router';
import { BadgeCheck, Sparkles } from 'lucide-react-native';

interface ProfileHeaderProps {
  user: {
    name?: string;
    email: string;
    image?: string;
    role: string;
  } | null;
}

/**
 * Redesigned Premium Profile Header
 * Clean, minimalist, and personal.
 * Sanket
 */
export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push("/(student)/(drawer)/(tabs)/profile");
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={handlePress}
      className="px-6 pt-12 pb-6 flex-row items-center border-b border-slate-100 dark:border-slate-800/50"
    >
      {/* Avatar Section */}
      <View className="relative mr-4">
        <View className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 items-center justify-center overflow-hidden border-2 border-white dark:border-slate-900 shadow-sm">
          {user?.image ? (
            <Image 
              source={{ uri: user.image }} 
              className="w-full h-full" 
            />
          ) : (
            <Typography weight="bold" className="text-slate-500 dark:text-slate-400 text-xl">
              {user?.name?.charAt(0) || "S"}
            </Typography>
          )}
        </View>
        
        {/* Verification / Online Badge */}
        <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 border-2 border-white dark:border-slate-950">
           <BadgeCheck size={10} color="white" />
        </View>
      </View>

      {/* Info Section */}
      <View className="flex-1 justify-center">
        <View className="flex-row items-center mb-1">
           <Typography variant="h4" className="text-slate-900 dark:text-white font-bold mr-2" numberOfLines={1}>
             {user?.name || "Student"}
           </Typography>
        </View>
        
        <Typography variant="small" className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2" numberOfLines={1}>
           {user?.email || "student@examsphere.com"}
        </Typography>

        <View className="flex-row items-center">
           <View className="bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md flex-row items-center">
             <Sparkles size={10} color="#6366f1" style={{ marginRight: 4 }} />
             <Typography className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
               Premium
             </Typography>
           </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
